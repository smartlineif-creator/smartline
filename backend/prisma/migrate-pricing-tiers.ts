import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PricingItem {
  label: string;
  price: string;
  note?: string;
}

interface PricingBlock {
  type: 'pricing';
  items: PricingItem[];
}

type AnyBlock = PricingBlock | { type: string };

function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/[\s ]/g, '');
  const match = cleaned.match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  return parseFloat(match[0].replace(',', '.'));
}

async function main() {
  const services = await prisma.service.findMany({
    include: { tiers: true },
  });

  const created: { service: string; label: string; price: number }[] = [];
  let skippedServices = 0;

  for (const service of services) {
    if (service.tiers.length > 0) {
      skippedServices += 1;
      continue;
    }

    const blocks = (service.blocks as unknown as AnyBlock[]) ?? [];
    const pricingBlock = blocks.find(
      (b): b is PricingBlock => b.type === 'pricing',
    );
    if (!pricingBlock) continue;

    const unparsable: PricingItem[] = [];
    let sortOrder = 0;

    for (const item of pricingBlock.items) {
      const price = parsePrice(item.price);
      if (price == null) {
        console.warn(
          `WARN: could not parse price "${item.price}" for tier "${item.label}" of service "${service.name}" — skipping tier`,
        );
        unparsable.push(item);
        continue;
      }

      await prisma.serviceTier.create({
        data: {
          serviceId: service.id,
          label: item.label,
          price,
          note: item.note,
          sortOrder,
        },
      });
      created.push({ service: service.name, label: item.label, price });
      sortOrder += 1;
    }

    if (unparsable.length > 0) {
      console.warn(
        `WARN: service "${service.name}" has ${unparsable.length} tier(s) with no parseable price — leaving its "pricing" block untouched`,
      );
      continue;
    }

    const remainingBlocks = blocks.filter((b) => b.type !== 'pricing');
    await prisma.service.update({
      where: { id: service.id },
      data: { blocks: remainingBlocks as object[] },
    });
  }

  if (created.length > 0) {
    console.table(created);
  }
  console.log(
    `Migrated ${created.length} tier(s). Skipped ${skippedServices} service(s) already migrated.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
