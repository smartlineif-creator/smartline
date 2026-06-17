import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Новий товар</h1>
        <p className="mt-1 text-sm text-muted-foreground">Створіть товар, додайте ціну, характеристики, фото та опис.</p>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
