import { notFound } from 'next/navigation';
import CategoryForm from '@/components/admin/CategoryForm';
import { getAdminCategory } from '@/lib/api';

interface Props {
  params: Promise<{ categoryId: string }>;
}

export default async function EditCategoryPage({ params }: Props) {
  const { categoryId } = await params;
  const category = await getAdminCategory(categoryId).catch(() => null);

  if (!category) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Редагувати категорію</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Оновіть назву або вкладеність категорії.
        </p>
      </div>
      <CategoryForm mode="edit" category={category} />
    </div>
  );
}
