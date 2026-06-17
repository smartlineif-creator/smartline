import ProductForm from '@/components/admin/ProductForm';

interface Props {
  params: Promise<{ productId: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { productId } = await params;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Редагувати товар</h1>
        <p className="mt-1 text-sm text-muted-foreground">Оновіть дані товару, варіанти, фото або опис.</p>
      </div>
      <ProductForm mode="edit" productId={productId} />
    </div>
  );
}
