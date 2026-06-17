import CategoryForm from '@/components/admin/CategoryForm';

export default function NewCategoryPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Нова категорія</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Створіть новий розділ каталогу без emoji-іконок.
        </p>
      </div>
      <CategoryForm mode="create" />
    </div>
  );
}
