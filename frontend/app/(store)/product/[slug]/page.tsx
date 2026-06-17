import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/api';
import ProductDetail from '@/components/store/ProductDetail';
import RecentlyViewedTracker from '@/components/store/RecentlyViewedTracker';
import RecentlyViewed from '@/components/store/RecentlyViewed';
import { Metadata } from 'next';
import { getProductPrice, getMainImage, getProductDisplayName } from '@/lib/utils';

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    const selectedVariant = product.variants?.find((v) => v.id === product.selectedVariantId);
    const mainImage = product.images?.find((i) => i.isMain)?.url;

    // Use variant-specific SEO if available, otherwise fall back to product
    const title = product.variantSeo?.title ?? getProductDisplayName(product, selectedVariant);
    const description = product.variantSeo?.description
      ?? product.description?.replace(/<[^>]*>/g, '').slice(0, 160);
    const canonicalUrl = product.variantSeo?.canonicalUrl
      ? `${process.env.NEXT_PUBLIC_SITE_URL || ''}${product.variantSeo.canonicalUrl}`
      : undefined;

    return {
      title: `${title} — купити в SmartLine`,
      description,
      openGraph: {
        title,
        images: mainImage ? [mainImage] : [],
      },
      ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
    };
  } catch {
    return { title: 'Товар не знайдено' };
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  let product;
  try {
    product = await getProduct(slug);
  } catch {
    notFound();
  }

  const selectedVariant = product.variants?.find((v) => v.id === product.selectedVariantId);
  const price = getProductPrice(product, selectedVariant);
  const displayName = product.variantSeo?.title ?? getProductDisplayName(product, selectedVariant);
  const mainImage = getMainImage(product);
  const avgRating = product.reviews?.length
    ? product.reviews.reduce((s: number, r: any) => s + r.rating, 0) / product.reviews.length
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: displayName,
    image: mainImage,
    description: (product.variantSeo?.description ?? product.description?.replace(/<[^>]*>/g, ''))?.slice(0, 500),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'UAH',
      price: price,
      availability: (selectedVariant?.stock ?? product.stock ?? 0) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    ...(avgRating && product.reviews?.length
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: avgRating.toFixed(1),
            reviewCount: product.reviews.length,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecentlyViewedTracker product={{
        id: product.id,
        slug: product.slug,
        name: displayName,
        image: mainImage,
        price: price ?? 0,
      }} />
      <ProductDetail product={product} />
      <div className="mx-auto max-w-7xl px-4">
        <RecentlyViewed currentProductId={product.id} />
      </div>
    </>
  );
}
