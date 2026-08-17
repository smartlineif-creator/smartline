import {
  ServiceBlock,
  ServiceBlockHeading,
  ServiceBlockText,
  ServiceBlockImage,
  ServiceBlockList,
  ServiceBlockPricing,
} from '@/types';
import Image from 'next/image';
import FaqBlock from './FaqBlock';

export default function BlockRenderer({ blocks }: { blocks: ServiceBlock[] }) {
  if (!blocks?.length) return null;

  return (
    <div className="flex flex-col gap-8">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return <HeadingBlock key={i} block={block} />;
          case 'text':
            return <TextBlock key={i} block={block} />;
          case 'image':
            return <ImageBlock key={i} block={block} />;
          case 'list':
            return <ListBlock key={i} block={block} />;
          case 'faq':
            return <FaqBlock key={i} block={block} />;
          case 'pricing':
            return <PricingBlock key={i} block={block} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

function HeadingBlock({ block }: { block: ServiceBlockHeading }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-[3px] h-7 rounded-full bg-[var(--sl-accent)] shrink-0" />
      <h2 className="font-[var(--sl-font-display)] text-2xl tracking-[0.04em] text-[var(--sl-text-primary)]">
        {block.text.toUpperCase()}
      </h2>
    </div>
  );
}

function TextBlock({ block }: { block: ServiceBlockText }) {
  return (
    <div
      className="text-[15px] text-[var(--sl-text-secondary)] leading-[1.75] max-w-2xl prose-p:mb-3"
      dangerouslySetInnerHTML={{ __html: block.html }}
    />
  );
}

function ImageBlock({ block }: { block: ServiceBlockImage }) {
  return (
    <figure className="rounded-2xl overflow-hidden bg-[var(--sl-bg-elevated)]">
      {block.url ? (
        <div className="relative aspect-[16/7]">
          <Image
            src={block.url}
            alt={block.alt ?? ''}
            fill
            className="object-cover"
            sizes="(max-width: 800px) 100vw, 800px"
          />
        </div>
      ) : (
        <div className="aspect-[16/7] flex items-center justify-center text-[var(--sl-text-muted)] text-sm font-mono">
          Фото відсутнє
        </div>
      )}
      {block.caption && (
        <figcaption className="px-4 py-2.5 font-mono text-[11px] text-[var(--sl-text-muted)] tracking-wide">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

function ListBlock({ block }: { block: ServiceBlockList }) {
  return (
    <div className="bg-[var(--sl-bg-surface)] border border-[var(--sl-border)] rounded-2xl p-5 max-w-2xl">
      {block.title && (
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--sl-text-muted)] mb-3.5">
          {block.title}
        </p>
      )}
      <ul className="flex flex-col gap-2.5">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--sl-text-secondary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--sl-accent)] shrink-0 mt-[6px]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PricingBlock({ block }: { block: ServiceBlockPricing }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {block.items.map((tier, i) => (
        <div
          key={i}
          className={`rounded-2xl p-5 border transition-colors ${
            tier.featured
              ? 'border-[var(--sl-border-hover)] bg-[var(--sl-bg-elevated)]'
              : 'border-[var(--sl-border)] bg-[var(--sl-bg-surface)]'
          }`}
        >
          <p className="font-[var(--sl-font-display)] text-xl tracking-[0.04em] text-[var(--sl-text-primary)] mb-1">
            {tier.label.toUpperCase()}
          </p>
          <p className="font-[var(--sl-font-display)] text-3xl tracking-[0.02em] text-[var(--sl-accent)]">
            {tier.price}
          </p>
          {tier.note && (
            <p className="text-xs text-[var(--sl-text-muted)] mt-2 leading-relaxed">{tier.note}</p>
          )}
        </div>
      ))}
    </div>
  );
}
