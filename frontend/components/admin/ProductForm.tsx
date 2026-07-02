'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  adminCreateProduct,
  adminGetAttributeValues,
  adminGetOptionGroupNames,
  adminGetProduct,
  adminGetProductOptions,
  adminUpdateProduct,
  getCategories,
  uploadImage,
  uploadVideo,
} from '@/lib/api';
import RichEditor from '@/components/ui/RichEditor';
import {
  Attribute, Category, Product, ProductOptionGroup, Variant,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, toSlug } from '@/lib/utils';
import {
  ChevronDown, ChevronLeft, ChevronRight, Plus, Trash2, Upload, X,
} from 'lucide-react';
import { toast } from 'sonner';

type Mode = 'create' | 'edit';

interface Props {
  mode: Mode;
  productId?: string;
}

interface AttributeEntry {
  name: string;
  value: string;
  unit: string;
}

interface OptionValueEntry {
  id: string;
  value: string;
}

interface OptionGroupEntry {
  id: string;
  name: string;
  unit: string;
  values: OptionValueEntry[];
}

interface VariantSelectionEntry {
  groupId: string;
  groupName: string;
  value: string;
}

interface VariantEntry {
  key: string;
  name: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  sku: string;
  slug: string;
  selections: VariantSelectionEntry[];
  isEnabled: boolean;
}

interface CategoryOption {
  category: Category;
  depth: number;
}

interface ProductOptionItem {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  category?: Category;
  images?: Product['images'];
  isActive: boolean;
}

function flattenCategories(categories: Category[], depth = 0): CategoryOption[] {
  return categories.flatMap((category) => [
    { category, depth },
    ...flattenCategories(category.children || [], depth + 1),
  ]);
}

function createEntryId() {
  return Math.random().toString(36).slice(2, 10);
}

function createOptionGroup(): OptionGroupEntry {
  return {
    id: createEntryId(),
    name: '',
    unit: '',
    values: [{ id: createEntryId(), value: '' }],
  };
}

function getMainImage(product?: ProductOptionItem) {
  return product?.images?.[0]?.url || '/placeholder.jpg';
}

function normalizeLegacyVariants(variants: Variant[]): { groups: OptionGroupEntry[]; items: VariantEntry[] } {
  const fallbackGroupId = createEntryId();
  const groups = [{
    id: fallbackGroupId,
    name: 'Варіант',
    unit: '',
    values: variants.map((variant) => ({ id: createEntryId(), value: variant.name })),
  }];

  const items = variants.map((variant, index) => ({
    key: `${fallbackGroupId}:${index}`,
    name: variant.name,
    price: String(variant.price),
    compareAtPrice: String(variant.compareAtPrice || ''),
    stock: String(variant.stock ?? ''),
    sku: variant.sku || '',
    slug: variant.slug || '',
    isEnabled: true,
    selections: [{
      groupId: fallbackGroupId,
      groupName: 'Варіант',
      value: variant.name,
    }],
  }));

  return { groups, items };
}

function buildConfiguredState(
  optionGroups: ProductOptionGroup[],
  variants: Variant[],
): { groups: OptionGroupEntry[]; items: VariantEntry[] } {
  const groupIdMap = new Map<string, string>();
  const groups = optionGroups.map((group) => {
    const localId = createEntryId();
    groupIdMap.set(group.id, localId);
    return {
      id: localId,
      name: group.name,
      unit: '',
      values: group.values.map((value) => ({
        id: createEntryId(),
        value: value.value,
      })),
    };
  });

  const items = variants.map((variant, index) => {
    const selections = (variant.selections || []).map((selection) => ({
      groupId: groupIdMap.get(selection.optionValue.group.id) || '',
      groupName: selection.optionValue.group.name,
      value: selection.optionValue.value,
    })).filter((selection) => selection.groupId);

    const key = selections
      .slice()
      .sort((a, b) => a.groupName.localeCompare(b.groupName))
      .map((selection) => `${selection.groupId}:${selection.value}`)
      .join('|') || `variant:${index}`;

    return {
      key,
      name: variant.name,
      price: String(variant.price),
      compareAtPrice: String(variant.compareAtPrice || ''),
      stock: String(variant.stock ?? ''),
      sku: variant.sku || '',
      slug: variant.slug || '',
      isEnabled: variant.isActive !== false,
      selections,
    };
  });

  return { groups, items };
}

function getPreparedOptionGroups(optionGroups: OptionGroupEntry[]) {
  return optionGroups
    .map((group) => ({
      ...group,
      name: group.name.trim(),
      values: group.values
        .map((value) => ({ ...value, value: value.value.trim() }))
        .filter((value) => value.value),
    }))
    .filter((group) => group.name && group.values.length > 0);
}

function generateVariantMatrix(optionGroups: OptionGroupEntry[]): VariantEntry[] {
  const preparedGroups = getPreparedOptionGroups(optionGroups);
  if (preparedGroups.length === 0) return [];

  const combinations: VariantSelectionEntry[][] = [];

  const walk = (groupIndex: number, current: VariantSelectionEntry[]) => {
    if (groupIndex === preparedGroups.length) {
      combinations.push(current);
      return;
    }

    const group = preparedGroups[groupIndex];
    group.values.forEach((value) => {
      walk(groupIndex + 1, [
        ...current,
        { groupId: group.id, groupName: group.name, value: value.value },
      ]);
    });
  };

  walk(0, []);

  return combinations.map((selections) => ({
    key: selections
      .slice()
      .sort((a, b) => a.groupName.localeCompare(b.groupName))
      .map((selection) => `${selection.groupId}:${selection.value}`)
      .join('|'),
    name: selections.map((selection) => selection.value).join(' / '),
    price: '',
    compareAtPrice: '',
    stock: '',
    sku: '',
    slug: '',
    isEnabled: true,
    selections,
  }));
}

function mergeGeneratedVariants(optionGroups: OptionGroupEntry[], currentVariants: VariantEntry[]) {
  const generatedVariants = generateVariantMatrix(optionGroups);
  const currentByKey = new Map(currentVariants.map((variant) => [variant.key, variant]));

  return generatedVariants.map((variant) => {
    const existing = currentByKey.get(variant.key);
    return existing
      ? { ...existing, name: variant.name, selections: variant.selections }
      : variant;
  });
}

/** Тільки ДОДАЄ нові комбінації — не видаляє і не перезаписує існуючі */
function addMissingVariants(optionGroups: OptionGroupEntry[], currentVariants: VariantEntry[]): VariantEntry[] {
  const generatedVariants = generateVariantMatrix(optionGroups);
  const currentKeys = new Set(currentVariants.map((v) => v.key));
  const newOnes = generatedVariants.filter((v) => !currentKeys.has(v.key));
  return [...currentVariants, ...newOnes];
}

export default function ProductForm({ mode, productId }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categorySelectorRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [expandedVariantSlugs, setExpandedVariantSlugs] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [productOptions, setProductOptions] = useState<ProductOptionItem[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [recommendedQuery, setRecommendedQuery] = useState('');
  const [withThisBuyQuery, setWithThisBuyQuery] = useState('');
  const [recommendedProductIds, setRecommendedProductIds] = useState<string[]>([]);
  const [withThisBuyProductIds, setWithThisBuyProductIds] = useState<string[]>([]);
  const [recommendedMode, setRecommendedMode] = useState<'products' | 'category'>('products');
  const [withThisBuyMode, setWithThisBuyMode] = useState<'products' | 'category'>('products');
  const [recommendedCategoryId, setRecommendedCategoryId] = useState<string>('');
  const [withThisBuyCategoryId, setWithThisBuyCategoryId] = useState<string>('');
  const [categoryPickerQuery, setCategoryPickerQuery] = useState('');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [badge, setBadge] = useState<string>('');
  const [hasVariants, setHasVariants] = useState(false);
  const [basePrice, setBasePrice] = useState('');
  const [baseCompareAtPrice, setBaseCompareAtPrice] = useState('');
  const [baseStock, setBaseStock] = useState('');
  const [optionGroups, setOptionGroups] = useState<OptionGroupEntry[]>([]);
  const [variants, setVariants] = useState<VariantEntry[]>([]);
  const [attributes, setAttributes] = useState<AttributeEntry[]>([{ name: '', value: '', unit: '' }]);
  const [attrValueSuggestions, setAttrValueSuggestions] = useState<Record<number, string[]>>({});
  const attrDebounceRef = useRef<number | null>(null);
  const [attrDropdownOpenIdx, setAttrDropdownOpenIdx] = useState<number | null>(null);
  const [optionGroupNameSuggestions, setOptionGroupNameSuggestions] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  const categoryOptions = useMemo(() => flattenCategories(categories), [categories]);
  const selectedCategory = categoryOptions.find((option) => option.category.id === categoryId)?.category;
  const categoryTemplates = useMemo(() => {
    if (!selectedCategory) return [];
    const templates = [...(selectedCategory.attributeTemplates ?? [])];
    let parentId = selectedCategory.parentId;
    while (parentId) {
      const parent = categoryOptions.find((o) => o.category.id === parentId)?.category;
      if (!parent) break;
      for (const t of (parent.attributeTemplates ?? [])) {
        if (!templates.some((existing) => existing.name.toLowerCase() === t.name.toLowerCase())) {
          templates.push(t);
        }
      }
      parentId = parent.parentId;
    }
    return templates;
  }, [selectedCategory, categoryOptions]);
  const optionGroupTemplates = useMemo(() => {
    if (!selectedCategory) return [];
    const templates = [...(selectedCategory.optionGroupTemplates ?? [])];
    let parentId = selectedCategory.parentId;
    while (parentId) {
      const parent = categoryOptions.find((o) => o.category.id === parentId)?.category;
      if (!parent) break;
      for (const t of (parent.optionGroupTemplates ?? [])) {
        if (!templates.some((existing) => existing.name.toLowerCase() === t.name.toLowerCase())) {
          templates.push(t);
        }
      }
      parentId = parent.parentId;
    }
    return templates;
  }, [selectedCategory, categoryOptions]);
  const getTemplate = (name: string) =>
    categoryTemplates.find((t) => t.name.toLowerCase() === name.toLowerCase());
  const getGroupTemplate = (name: string) =>
    optionGroupTemplates.find((t) => t.name.toLowerCase() === name.toLowerCase());
  const optionGroupNames = useMemo(
    () => new Set(optionGroups.map((g) => g.name.toLowerCase())),
    [optionGroups],
  );
  const isVariantGroup = (name: string) => !!name.trim() && optionGroupNames.has(name.toLowerCase());
  const preparedOptionGroups = useMemo(() => getPreparedOptionGroups(optionGroups), [optionGroups]);
  const categoryMap = useMemo(
    () => new Map(categoryOptions.map(({ category }) => [category.id, category])),
    [categoryOptions],
  );

  const getCategoryPathLabel = (category: Category) => {
    const chain: string[] = [category.name];
    let currentParentId = category.parentId;

    while (currentParentId) {
      const parent = categoryMap.get(currentParentId);
      if (!parent) break;
      chain.unshift(parent.name);
      currentParentId = parent.parentId;
    }

    return chain.join(' / ');
  };

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    adminGetProductOptions({ limit: 250 }).then((items) => setProductOptions(items)).catch(() => {});
  }, []);

  useEffect(() => {
    adminGetOptionGroupNames(categoryId || undefined)
      .then(setOptionGroupNameSuggestions)
      .catch(() => {});
  }, [categoryId]);

  useEffect(() => {
    if (!categoryOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!categorySelectorRef.current?.contains(event.target as Node)) {
        setCategoryOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCategoryOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [categoryOpen]);

  function hydrateProduct(product: Product) {
    setName(product.name);
    setSlug(product.slug);
    setSku(product.sku || '');
    setSlugManual(true);
    setCategoryId(product.categoryId || '');
    setIsActive(product.isActive);
    setIsFeatured(product.isFeatured);
    setBadge(product.badge || '');
    setDescription(product.description || '');
    setImages(product.images?.map((image) => image.url) || []);
    setVideoUrl(product.videoUrl || null);

    const productVariants = product.variants || [];
    const hasMultipleVariants = productVariants.length > 0 && !(productVariants.length === 1 && productVariants[0].name === 'Основний');
    setHasVariants(hasMultipleVariants);
    setBasePrice(hasMultipleVariants ? '' : String(product.basePrice || productVariants[0]?.price || ''));
    setBaseCompareAtPrice(hasMultipleVariants ? '' : String(product.compareAtPrice || productVariants[0]?.compareAtPrice || ''));
    setBaseStock(hasMultipleVariants ? '' : String(product.stock ?? productVariants[0]?.stock ?? ''));

    if (product.optionGroups && product.optionGroups.length > 0) {
      const configured = buildConfiguredState(product.optionGroups, productVariants);
      setOptionGroups(configured.groups);
      setVariants(configured.items);
    } else if (hasMultipleVariants) {
      const legacy = normalizeLegacyVariants(productVariants);
      setOptionGroups(legacy.groups);
      setVariants(legacy.items);
    } else {
      setOptionGroups([]);
      setVariants([]);
    }

    setAttributes(
      product.attributes && product.attributes.length > 0
        ? product.attributes.map((attribute: Attribute) => ({
            name: attribute.name,
            value: attribute.value,
            unit: attribute.unit || '',
          }))
        : [{ name: '', value: '', unit: '' }],
    );
    setRecommendedProductIds(product.recommendedProducts?.map((item) => item.id) || []);
    setWithThisBuyProductIds(product.withThisBuyProducts?.map((item) => item.id) || []);
    if (product.recommendedCategoryId) {
      setRecommendedMode('category');
      setRecommendedCategoryId(product.recommendedCategoryId);
    } else {
      setRecommendedMode('products');
      setRecommendedCategoryId('');
    }
    if (product.withThisBuyCategoryId) {
      setWithThisBuyMode('category');
      setWithThisBuyCategoryId(product.withThisBuyCategoryId);
    } else {
      setWithThisBuyMode('products');
      setWithThisBuyCategoryId('');
    }
  }

  useEffect(() => {
    if (mode !== 'edit' || !productId) return;

    adminGetProduct(productId)
      .then((product) => {
        hydrateProduct(product);
      })
      .catch(() => {
        toast.error('Товар не знайдено');
        router.push('/admin/products');
      })
      .finally(() => setLoading(false));
  }, [mode, productId, router]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugManual) setSlug(toSlug(value));
  };

  const updateOptionConfiguration = (updater: (items: OptionGroupEntry[]) => OptionGroupEntry[]) => {
    setOptionGroups((currentGroups) => {
      const nextGroups = updater(currentGroups);
      if (hasVariants) {
        setVariants((currentVariants) => mergeGeneratedVariants(nextGroups, currentVariants));
      }
      return nextGroups;
    });
  };

  const [groupDropdownOpenIdx, setGroupDropdownOpenIdx] = useState<number | null>(null);

  const addOptionGroup = () => updateOptionConfiguration((items) => [...items, createOptionGroup()]);
  const removeOptionGroup = (groupId: string) => updateOptionConfiguration((items) => items.filter((group) => group.id !== groupId));
  const updateOptionGroup = (groupId: string, field: 'name' | 'unit', value: string) => {
    updateOptionConfiguration((items) => items.map((group) => (group.id === groupId ? { ...group, [field]: value } : group)));
  };
  const handleSelectGroupTemplate = (index: number, tmpl: { name: string; unit?: string | null }) => {
    updateOptionConfiguration((items) =>
      items.map((item, i) => i === index ? { ...item, name: tmpl.name, unit: tmpl.unit || '' } : item)
    );
    setGroupDropdownOpenIdx(null);
  };
  const addOptionValue = (groupId: string) => {
    updateOptionConfiguration((items) => items.map((group) => (
      group.id === groupId
        ? { ...group, values: [...group.values, { id: createEntryId(), value: '' }] }
        : group
    )));
  };
  const updateOptionValue = (groupId: string, valueId: string, value: string) => {
    updateOptionConfiguration((items) => items.map((group) => (
      group.id === groupId
        ? {
            ...group,
            values: group.values.map((entry) => (entry.id === valueId ? { ...entry, value } : entry)),
          }
        : group
    )));
  };
  const removeOptionValue = (groupId: string, valueId: string) => {
    updateOptionConfiguration((items) => items.map((group) => (
      group.id === groupId
        ? { ...group, values: group.values.filter((entry) => entry.id !== valueId) }
        : group
    )));
  };

  const updateVariant = (key: string, field: keyof Pick<VariantEntry, 'price' | 'compareAtPrice' | 'stock' | 'sku' | 'slug'>, value: string) => {
    setVariants((items) => items.map((item) => (item.key === key ? { ...item, [field]: value } : item)));
  };

  const toggleVariantEnabled = (key: string) => {
    setVariants((items) => items.map((item) => (item.key === key ? { ...item, isEnabled: !item.isEnabled } : item)));
  };

  const toggleVariantSlug = (key: string) => {
    setExpandedVariantSlugs((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const addAttribute = () => setAttributes((items) => [...items, { name: '', value: '', unit: '' }]);
  const removeAttribute = (index: number) => setAttributes((items) => items.filter((_, i) => i !== index));
  const updateAttribute = (index: number, field: keyof AttributeEntry, value: string) =>
    setAttributes((items) => items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

  const handleAttrNameChange = (index: number, value: string) => {
    updateAttribute(index, 'name', value);
    if (attrDebounceRef.current) window.clearTimeout(attrDebounceRef.current);
    if (!value.trim()) return;
    attrDebounceRef.current = window.setTimeout(async () => {
      try {
        const suggestions = await adminGetAttributeValues(value.trim(), categoryId || undefined);
        setAttrValueSuggestions((prev) => ({ ...prev, [index]: suggestions }));
      } catch {
        // silent — suggestions are non-critical
      }
    }, 300);
  };

  const handleSelectTemplate = (index: number, tmpl: { name: string; unit?: string | null }) => {
    setAttributes((items) =>
      items.map((item, i) => (i === index ? { ...item, name: tmpl.name, unit: tmpl.unit || '' } : item)),
    );
    setAttrDropdownOpenIdx(null);
    if (tmpl.name && categoryId) {
      adminGetAttributeValues(tmpl.name, categoryId)
        .then((vals) => setAttrValueSuggestions((prev) => ({ ...prev, [index]: vals })))
        .catch(() => {});
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (images.length + files.length > 10) {
      toast.error('Максимум 10 фото');
      return;
    }

    setUploading(true);
    try {
      const urls = await Promise.all(files.map((file) => uploadImage(file)));
      setImages((current) => [...current, ...urls]);
    } catch {
      toast.error('Помилка завантаження фото');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const url = await uploadVideo(file);
      setVideoUrl(url);
    } catch {
      toast.error('Помилка завантаження відео');
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => setImages((items) => items.filter((_, i) => i !== index));
  const moveImage = (from: number, to: number) => {
    setImages((items) => {
      const next = [...items];
      const [image] = next.splice(from, 1);
      next.splice(to, 0, image);
      return next;
    });
  };

  const canSave = () => {
    if (!name.trim() || !slug.trim() || !categoryId) return false;
    if (!hasVariants) return Boolean(basePrice.trim());
    return preparedOptionGroups.length > 0 && variants.length > 0;
  };

  const productOptionsForLinks = useMemo(
    () => productOptions.filter((item) => item.id !== productId),
    [productId, productOptions],
  );

  const recommendedOptions = useMemo(() => {
    const query = recommendedQuery.trim().toLowerCase();
    return productOptionsForLinks.filter((item) => {
      if (recommendedProductIds.includes(item.id)) return true;
      if (!query) return true;
      return [item.name, item.slug, item.sku, item.category?.name]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [productOptionsForLinks, recommendedProductIds, recommendedQuery]);

  const withThisBuyOptions = useMemo(() => {
    const query = withThisBuyQuery.trim().toLowerCase();
    return productOptionsForLinks.filter((item) => {
      if (withThisBuyProductIds.includes(item.id)) return true;
      if (!query) return true;
      return [item.name, item.slug, item.sku, item.category?.name]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [productOptionsForLinks, withThisBuyProductIds, withThisBuyQuery]);

  const selectedRecommendedProducts = useMemo(
    () => recommendedProductIds
      .map((id) => productOptionsForLinks.find((item) => item.id === id))
      .filter(Boolean) as ProductOptionItem[],
    [productOptionsForLinks, recommendedProductIds],
  );

  const selectedWithThisBuyProducts = useMemo(
    () => withThisBuyProductIds
      .map((id) => productOptionsForLinks.find((item) => item.id === id))
      .filter(Boolean) as ProductOptionItem[],
    [productOptionsForLinks, withThisBuyProductIds],
  );

  const filteredCategoryOptions = useMemo(() => {
    const q = categoryPickerQuery.trim().toLowerCase();
    if (!q) return categoryOptions;
    return categoryOptions.filter(({ category }) =>
      getCategoryPathLabel(category).toLowerCase().includes(q),
    );
  }, [categoryOptions, categoryPickerQuery]);

  const toggleId = (items: string[], value: string) => (items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value]);

  const handleSave = async () => {
    if (!canSave()) {
      toast.error('Заповніть назву, slug, категорію та ціни для всіх комбінацій');
      return;
    }

    setSaving(true);
    try {
      const validAttributes = attributes.filter((attribute) => attribute.name.trim() && attribute.value.trim());
      // Зберігаємо всі варіанти — якщо ціна не заповнена, зберігаємо 0 (адмін побачить і заповнить пізніше)
      const validVariants = variants;
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        sku: sku.trim() || undefined,
        categoryId,
        isActive,
        isFeatured: badge === 'ХІТ',
        badge: badge || null,
        description,
        basePrice: hasVariants ? null : Number(basePrice),
        compareAtPrice: hasVariants || !baseCompareAtPrice.trim() ? null : Number(baseCompareAtPrice),
        stock: hasVariants ? 0 : Number(baseStock) || 0,
        optionGroups: hasVariants
          ? preparedOptionGroups.map((group, groupIndex) => ({
              name: group.name,
              sortOrder: groupIndex,
              values: group.values.map((value, valueIndex) => ({
                value: value.value,
                sortOrder: valueIndex,
              })),
            }))
          : [],
        variants: hasVariants
          ? validVariants.map((variant) => ({
              name: variant.name,
              price: Number(variant.price) || 0,
              compareAtPrice: variant.compareAtPrice.trim() ? Number(variant.compareAtPrice) : null,
              stock: Number(variant.stock) || 0,
              sku: variant.sku.trim() || undefined,
              slug: variant.slug.trim() || undefined,
              isActive: variant.isEnabled,
              selections: variant.selections.map((selection) => ({
                groupName: selection.groupName,
                value: selection.value,
              })),
            }))
          : [],
        attributes: validAttributes.map((attribute, index) => ({
          name: attribute.name.trim(),
          value: attribute.value.trim(),
          unit: attribute.unit.trim() || undefined,
          sortOrder: index,
        })),
        images: images.map((url, index) => ({
          url,
          isMain: index === 0,
          sortOrder: index,
        })),
        videoUrl: videoUrl || null,
        recommendedProductIds: recommendedMode === 'products' ? recommendedProductIds : [],
        withThisBuyProductIds: withThisBuyMode === 'products' ? withThisBuyProductIds : [],
        accessoryCategoryIds: [],
        recommendedCategoryId: recommendedMode === 'category' ? recommendedCategoryId || null : null,
        withThisBuyCategoryId: withThisBuyMode === 'category' ? withThisBuyCategoryId || null : null,
      };

      if (mode === 'edit' && productId) {
        const updatedProduct = await adminUpdateProduct(productId, payload);
        hydrateProduct(updatedProduct);
        toast.success('Товар оновлено');
        router.refresh();
      } else {
        const createdProduct = await adminCreateProduct(payload);
        toast.success('Товар створено');
        router.replace(`/admin/products/${createdProduct.id}/edit`);
        router.refresh();
      }
    } catch {
      toast.error('Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">Завантаження товару...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Основне</h2>
          <p className="mt-1 text-sm text-muted-foreground">Назва, сторінка товару, категорія та основний статус.</p>
        </div>
        <div className="grid gap-5">
          <div>
            <Label>Назва *</Label>
            <Input value={name} onChange={(e) => handleNameChange(e.target.value)} className="mt-2 h-11" autoFocus />
          </div>
          <div>
            <Label>Slug *</Label>
            <Input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }} className="mt-2 h-11" />
          </div>
          <div>
            <Label>Артикул</Label>
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="mt-2 h-11"
              placeholder="Наприклад, MBP14-M3-18-512"
            />
          </div>
          <div ref={categorySelectorRef} className="relative">
            <Label>Категорія *</Label>
            <button
              type="button"
              onClick={() => setCategoryOpen((open) => !open)}
              className="mt-2 flex h-11 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-left text-sm transition-colors hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className={selectedCategory ? 'text-gray-900' : 'text-muted-foreground'}>
                {selectedCategory?.name || 'Оберіть категорію'}
              </span>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', categoryOpen && 'rotate-180')} />
            </button>
            {categoryOpen && (
              <div className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-lg border bg-white p-1 shadow-xl">
                {categoryOptions.map(({ category, depth }) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => { setCategoryId(category.id); setCategoryOpen(false); }}
                    className={cn(
                      'flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-blue-50',
                      categoryId === category.id && 'bg-blue-50 text-blue-700',
                    )}
                    style={{ paddingLeft: 12 + depth * 18 }}
                  >
                    <span className="truncate">{category.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Бейдж</h2>
          <p className="mt-1 text-sm text-muted-foreground">Відображається на картці товару. Акційний % замінює бейдж автоматично.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['', 'ХІТ', 'НОВИНКА', 'Б/В', 'ЕКСКЛЮЗИВ'].map((option) => {
            const COLORS: Record<string, { bg: string; text: string; border: string }> = {
              'ХІТ':      { bg: 'bg-orange-50',  text: 'text-orange-600', border: 'border-orange-300' },
              'НОВИНКА':  { bg: 'bg-blue-50',    text: 'text-blue-600',   border: 'border-blue-300'  },
              'Б/В':      { bg: 'bg-gray-100',   text: 'text-gray-600',   border: 'border-gray-300'  },
              'ЕКСКЛЮЗИВ':{ bg: 'bg-purple-50',  text: 'text-purple-600', border: 'border-purple-300'},
            };
            const c = COLORS[option];
            const isSelected = badge === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setBadge(option)}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                  option === ''
                    ? isSelected
                      ? 'border-gray-400 bg-gray-100 text-gray-700'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    : isSelected
                      ? cn(c.bg, c.text, c.border, 'ring-2 ring-offset-1', c.border.replace('border-', 'ring-'))
                      : cn('border-gray-200 text-gray-400 hover:border-gray-300 hover:', c.text),
                )}
              >
                {option === '' ? 'Без бейджу' : option}
              </button>
            );
          })}
          <input
            type="text"
            value={!['', 'ХІТ', 'НОВИНКА', 'Б/В', 'ЕКСКЛЮЗИВ'].includes(badge) ? badge : ''}
            onChange={(e) => setBadge(e.target.value.toUpperCase())}
            placeholder="Свій текст..."
            className="h-9 rounded-full border border-dashed border-gray-300 bg-white px-4 text-sm text-gray-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Ціни та конфігурації</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Для моделей на кшталт Apple або ноутбуків з різною пам&apos;яттю та SSD тут задаються опції та точні комбінації цін.
            </p>
          </div>
          <div className="inline-flex rounded-lg border bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setHasVariants(false)}
              className={cn('rounded-md px-3 py-1.5 text-sm font-medium', !hasVariants ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600')}
            >
              Одна ціна
            </button>
            <button
              type="button"
              onClick={() => {
                setHasVariants(true);
                setVariants((currentVariants) => mergeGeneratedVariants(optionGroups, currentVariants));
              }}
              className={cn('rounded-md px-3 py-1.5 text-sm font-medium', hasVariants ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600')}
            >
              Конфігурації
            </button>
          </div>
        </div>

        {!hasVariants ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Поточна ціна, грн *</Label>
              <Input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="mt-2 h-11" />
            </div>
            <div>
              <Label>Стара ціна, грн</Label>
              <Input type="number" value={baseCompareAtPrice} onChange={(e) => setBaseCompareAtPrice(e.target.value)} className="mt-2 h-11" placeholder="Необов'язково" />
            </div>
            <div>
              <Label>Кількість, шт.</Label>
              <Input type="number" value={baseStock} onChange={(e) => setBaseStock(e.target.value)} className="mt-2 h-11" placeholder="0" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Спочатку задайте групи опцій, наприклад `Оперативна пам&apos;ять` і `SSD`. Після цього ми автоматично згенеруємо всі комбінації, і для кожної можна виставити свою ціну, склад та артикул.
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-950">Групи опцій</h3>
                  <p className="text-sm text-muted-foreground">Тільки ті параметри, які реально змінює покупець.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addOptionGroup}>
                  <Plus className="h-4 w-4" />
                  Додати групу
                </Button>
              </div>

              {optionGroups.length === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
                  Поки що немає жодної групи. Додайте, наприклад, `Оперативна пам&apos;ять`, `SSD` або `Колір`.
                </div>
              ) : (
                <div className="space-y-4">
                  {optionGroups.map((group, groupIndex) => {
                    const grpTmpl = getGroupTemplate(group.name);
                    const isGrpTemplate = !!grpTmpl;
                    const isGrpOpen = groupDropdownOpenIdx === groupIndex;

                    return (
                    <div key={group.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                      {/* Group header row: name + unit + delete */}
                      <div
                        className="mb-3 grid gap-2 md:grid-cols-[1fr_120px_40px]"
                        onBlur={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) setGroupDropdownOpenIdx(null);
                        }}
                      >
                        {/* Name with template dropdown */}
                        <div className="relative">
                          {isGrpTemplate ? (
                            <button
                              type="button"
                              onClick={() => setGroupDropdownOpenIdx(isGrpOpen ? null : groupIndex)}
                              className="flex h-9 w-full items-center justify-between rounded-lg border border-blue-300 bg-blue-50 px-3 text-sm font-medium text-blue-800 hover:bg-blue-100"
                            >
                              <span className="truncate">{group.name}</span>
                              <ChevronDown className={cn('ml-2 h-4 w-4 shrink-0 transition-transform', isGrpOpen && 'rotate-180')} />
                            </button>
                          ) : (
                            <div className="flex gap-1">
                              <Input
                                placeholder={groupIndex === 0 ? "Наприклад, Оперативна пам'ять" : 'Назва групи'}
                                value={group.name}
                                onChange={(e) => updateOptionGroup(group.id, 'name', e.target.value)}
                                className="h-9 flex-1"
                              />
                              {optionGroupTemplates.length > 0 && (
                                <button
                                  type="button"
                                  tabIndex={0}
                                  onClick={() => setGroupDropdownOpenIdx(isGrpOpen ? null : groupIndex)}
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-600"
                                >
                                  <ChevronDown className={cn('h-4 w-4 transition-transform', isGrpOpen && 'rotate-180')} />
                                </button>
                              )}
                            </div>
                          )}

                          {isGrpOpen && optionGroupTemplates.length > 0 && (
                            <div className="absolute z-30 mt-1 w-full rounded-lg border bg-white shadow-xl">
                              {optionGroupTemplates.map((t) => (
                                <button
                                  key={t.name}
                                  type="button"
                                  tabIndex={0}
                                  onClick={() => handleSelectGroupTemplate(groupIndex, t)}
                                  className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-blue-50"
                                >
                                  <span>{t.name}</span>
                                  {t.unit && <span className="text-xs text-gray-400">{t.unit}</span>}
                                </button>
                              ))}
                              <div className="border-t">
                                <button
                                  type="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    updateOptionGroup(group.id, 'name', '');
                                    updateOptionGroup(group.id, 'unit', '');
                                    setGroupDropdownOpenIdx(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                                >
                                  <Plus className="h-3 w-3" /> Інша група...
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Unit — locked if from template, editable otherwise */}
                        {isGrpTemplate && grpTmpl.unit ? (
                          <div className="flex h-9 select-none items-center rounded-lg border border-gray-200 bg-gray-100 px-3 text-sm text-gray-400">
                            {grpTmpl.unit}
                          </div>
                        ) : (
                          <Input
                            placeholder="Одиниця"
                            value={group.unit}
                            onChange={(e) => updateOptionGroup(group.id, 'unit', e.target.value)}
                            className="h-9"
                          />
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                          onClick={() => removeOptionGroup(group.id)}
                          aria-label="Видалити групу"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Values */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Значення</Label>
                        {group.values.map((value) => (
                          <div key={value.id} className="flex items-center gap-2">
                            <Input
                              value={value.value}
                              onChange={(e) => updateOptionValue(group.id, value.id, e.target.value)}
                              placeholder={group.unit ? `Наприклад, 16` : 'Наприклад, 16 ГБ'}
                              className="h-9 flex-1"
                            />
                            {(group.unit || (isGrpTemplate && grpTmpl?.unit)) && (
                              <span className="shrink-0 text-sm text-gray-400 select-none">
                                {grpTmpl?.unit || group.unit}
                              </span>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-red-500"
                              onClick={() => removeOptionValue(group.id, value.id)}
                              aria-label="Видалити значення"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => addOptionValue(group.id)}>
                          <Plus className="h-4 w-4" />
                          Додати значення
                        </Button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-950">
                    Комбінації
                    {variants.length > 0 && (
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-muted-foreground">
                        {variants.length}
                      </span>
                    )}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Для кожної конфігурації — окрема ціна і{' '}
                    <span className="font-medium text-blue-700" title="Кожна комбінація отримує унікальну URL-адресу, яку індексують Google та Bing">
                      окрема SEO-сторінка
                    </span>
                    .
                  </p>
                </div>
                {preparedOptionGroups.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVariants((current) => addMissingVariants(optionGroups, current))}
                  >
                    <Plus className="h-4 w-4" />
                    Генерувати комбінації
                  </Button>
                )}
              </div>

              {variants.length === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
                  Додайте хоча б одну повну групу опцій із значеннями, і тут з&apos;являться комбінації.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="hidden grid-cols-[44px_1.3fr_120px_120px_110px_1fr_32px] gap-3 px-1 text-xs font-medium text-muted-foreground lg:grid">
                    <span />
                    <span>Конфігурація</span>
                    <span>Ціна *</span>
                    <span>Стара ціна</span>
                    <span>Кількість</span>
                    <span>Артикул</span>
                    <span />
                  </div>
                  {variants.map((variant) => {
                    const isOutOfStock = !variant.stock || variant.stock === '0';
                    const slugExpanded = expandedVariantSlugs.has(variant.key);
                    return (
                      <div
                        key={variant.key}
                        className={cn(
                          'rounded-lg border p-4 transition-opacity',
                          !variant.isEnabled
                            ? 'border-gray-100 bg-gray-50 opacity-50'
                            : isOutOfStock
                              ? 'border-orange-100 bg-orange-50/50'
                              : 'border-gray-100 bg-gray-50 lg:bg-white',
                        )}
                      >
                        <div className="grid gap-3 lg:grid-cols-[44px_1.3fr_120px_120px_110px_1fr_32px]">
                          {/* Switch */}
                          <button
                            type="button"
                            onClick={() => toggleVariantEnabled(variant.key)}
                            className="flex items-center justify-center"
                            title={variant.isEnabled ? 'Вимкнути (варіант не існує)' : 'Увімкнути'}
                          >
                            <span className={cn(
                              'flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
                              variant.isEnabled ? 'bg-blue-600' : 'bg-gray-300',
                            )}>
                              <span className={cn('h-4 w-4 rounded-full bg-white shadow transition-transform', variant.isEnabled && 'translate-x-4')} />
                            </span>
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-950">{variant.name}</span>
                              {variant.isEnabled && isOutOfStock && (
                                <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">нема</span>
                              )}
                              {!variant.isEnabled && (
                                <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-500">вимкнено</span>
                              )}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {variant.selections.map((s) => `${s.groupName}: ${s.value}`).join(' · ')}
                            </div>
                          </div>
                          <Input type="number" placeholder="Ціна" value={variant.price} onChange={(e) => updateVariant(variant.key, 'price', e.target.value)} disabled={!variant.isEnabled} />
                          <Input type="number" placeholder="Стара ціна" value={variant.compareAtPrice} onChange={(e) => updateVariant(variant.key, 'compareAtPrice', e.target.value)} disabled={!variant.isEnabled} />
                          <Input type="number" placeholder="0" value={variant.stock} onChange={(e) => updateVariant(variant.key, 'stock', e.target.value)} disabled={!variant.isEnabled} />
                          <Input placeholder="Артикул" value={variant.sku} onChange={(e) => updateVariant(variant.key, 'sku', e.target.value)} disabled={!variant.isEnabled} />
                          <button
                            type="button"
                            onClick={() => toggleVariantSlug(variant.key)}
                            className="flex items-center justify-center rounded text-muted-foreground transition-colors hover:text-blue-600 disabled:pointer-events-none"
                            title="SEO slug"
                            disabled={!variant.isEnabled}
                          >
                            <ChevronDown className={cn('h-4 w-4 transition-transform', slugExpanded && 'rotate-180')} />
                          </button>
                        </div>

                        {slugExpanded && variant.isEnabled && (
                          <div className="mt-3 border-t border-gray-100 pt-3">
                            <Label className="text-xs text-muted-foreground">
                              SEO slug — URL цієї конфігурації (залиш порожнім для авто)
                            </Label>
                            <Input
                              value={variant.slug}
                              onChange={(e) => updateVariant(variant.key, 'slug', e.target.value)}
                              placeholder={`${slug}-${variant.selections.map((s) => toSlug(s.value)).join('-')}`}
                              className="mt-2 h-9 font-mono text-xs"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Мерчендайзинг</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Рекомендації та товари для комплекту — вручну або рандомно з категорії.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            {/* Рекомендовані товари */}
            <MerchPanel
              title="Рекомендовані товари"
              description="Підсвічуємо на сторінці товару як «Також дивляться»."
              mode={recommendedMode}
              onModeChange={(m) => { setRecommendedMode(m); setRecommendedProductIds([]); setRecommendedCategoryId(''); }}
              productQuery={recommendedQuery}
              onProductQueryChange={setRecommendedQuery}
              productOptions={recommendedOptions}
              selectedProductIds={recommendedProductIds}
              onToggleProduct={(id) => setRecommendedProductIds((cur) => toggleId(cur, id))}
              selectedProducts={selectedRecommendedProducts}
              categoryPickerQuery={categoryPickerQuery}
              onCategoryPickerQueryChange={setCategoryPickerQuery}
              categoryOptions={filteredCategoryOptions}
              selectedCategoryId={recommendedCategoryId}
              onSelectCategory={setRecommendedCategoryId}
              getCategoryPathLabel={getCategoryPathLabel}
            />

            {/* З цим купують */}
            <MerchPanel
              title="З цим купують"
              description="Добірка для комплекту: що логічно додати до кошика разом."
              mode={withThisBuyMode}
              onModeChange={(m) => { setWithThisBuyMode(m); setWithThisBuyProductIds([]); setWithThisBuyCategoryId(''); }}
              productQuery={withThisBuyQuery}
              onProductQueryChange={setWithThisBuyQuery}
              productOptions={withThisBuyOptions}
              selectedProductIds={withThisBuyProductIds}
              onToggleProduct={(id) => setWithThisBuyProductIds((cur) => toggleId(cur, id))}
              selectedProducts={selectedWithThisBuyProducts}
              categoryPickerQuery={categoryPickerQuery}
              onCategoryPickerQueryChange={setCategoryPickerQuery}
              categoryOptions={filteredCategoryOptions}
              selectedCategoryId={withThisBuyCategoryId}
              onSelectCategory={setWithThisBuyCategoryId}
              getCategoryPathLabel={getCategoryPathLabel}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Характеристики</h2>
          <p className="mt-1 text-sm text-muted-foreground">Фіксовані параметри товару, які не змінюються при виборі конфігурації.</p>
        </div>
        <div className="space-y-3">
          {attributes.map((attribute, index) => {
            const tmpl = getTemplate(attribute.name);
            const isTemplate = !!tmpl;
            const isOpen = attrDropdownOpenIdx === index;
            const collides = isVariantGroup(attribute.name);

            return (
              <div key={index} className="space-y-1">
              {collides && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600">
                  <span>⚠</span>
                  «{attribute.name}» вже використовується як конфігурація варіантів — не додавайте її як характеристику.
                </p>
              )}
              <div
                className={cn('grid gap-2 md:grid-cols-[1fr_1fr_120px_40px]', collides && 'opacity-60')}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setAttrDropdownOpenIdx(null);
                  }
                }}
              >
                {/* Name field */}
                <div className="relative">
                  {isTemplate ? (
                    <button
                      type="button"
                      onClick={() => setAttrDropdownOpenIdx(isOpen ? null : index)}
                      className="flex h-9 w-full items-center justify-between rounded-lg border border-blue-300 bg-blue-50 px-3 text-sm font-medium text-blue-800 hover:bg-blue-100"
                    >
                      <span className="truncate">{attribute.name}</span>
                      <ChevronDown className={cn('ml-2 h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')} />
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <Input
                        placeholder="Характеристика"
                        value={attribute.name}
                        onChange={(e) => handleAttrNameChange(index, e.target.value)}
                        className="h-9 flex-1"
                      />
                      {categoryTemplates.length > 0 && (
                        <button
                          type="button"
                          tabIndex={0}
                          onClick={() => setAttrDropdownOpenIdx(isOpen ? null : index)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-600"
                        >
                          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
                        </button>
                      )}
                    </div>
                  )}

                  {isOpen && categoryTemplates.length > 0 && (
                    <div className="absolute z-30 mt-1 w-full rounded-lg border bg-white shadow-xl">
                      {categoryTemplates.filter((t) => !isVariantGroup(t.name)).map((t) => (
                        <button
                          key={t.name}
                          type="button"
                          tabIndex={0}
                          onClick={() => handleSelectTemplate(index, t)}
                          className={cn(
                            'flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-blue-50',
                            attribute.name.toLowerCase() === t.name.toLowerCase() && 'bg-blue-50 text-blue-700',
                          )}
                        >
                          <span>{t.name}</span>
                          {t.unit && <span className="text-xs text-gray-400">{t.unit}</span>}
                        </button>
                      ))}
                      <div className="border-t">
                        <button
                          type="button"
                          tabIndex={0}
                          onClick={() => {
                            setAttributes((items) =>
                              items.map((item, i) => (i === index ? { ...item, name: '', unit: '' } : item)),
                            );
                            setAttrDropdownOpenIdx(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                        >
                          <Plus className="h-3 w-3" />
                          Інша характеристика...
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Value */}
                <Input
                  placeholder="Значення"
                  value={attribute.value}
                  list={`attr-value-suggestions-${index}`}
                  onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                  className="h-9"
                />

                {/* Unit — locked for templates with unit, editable otherwise */}
                {isTemplate && tmpl.unit ? (
                  <div className="flex h-9 select-none items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-400">
                    {tmpl.unit}
                  </div>
                ) : (
                  <Input
                    placeholder="Одиниця"
                    value={attribute.unit}
                    onChange={(e) => updateAttribute(index, 'unit', e.target.value)}
                    className="h-9"
                  />
                )}

                <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => removeAttribute(index)} aria-label="Видалити характеристику">
                  <Trash2 className="h-4 w-4" />
                </Button>

                <datalist id={`attr-value-suggestions-${index}`}>
                  {(attrValueSuggestions[index] ?? []).map((v) => <option key={v} value={v} />)}
                </datalist>
              </div>
              </div>
            );
          })}
          <Button type="button" variant="outline" size="sm" onClick={addAttribute}>
            <Plus className="h-4 w-4" />
            Додати характеристику
          </Button>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Фото</h2>
          <p className="mt-1 text-sm text-muted-foreground">Перше фото буде головним у каталозі.</p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-blue-400"
        >
          <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <span className="text-sm text-muted-foreground">
            {uploading ? 'Завантаження...' : 'Натисніть, щоб завантажити фото'}
          </span>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((url, index) => (
              <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border bg-gray-50">
                <Image src={url} alt="" fill className="object-contain p-1" />
                {index === 0 && <span className="absolute left-2 top-2 rounded bg-blue-600 px-2 py-0.5 text-xs text-white">Головне</span>}
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                  {index > 0 && (
                    <button type="button" onClick={() => moveImage(index, index - 1)} className="rounded bg-white p-1">
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                  )}
                  <button type="button" onClick={() => removeImage(index)} className="rounded bg-white p-1 text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                  {index < images.length - 1 && (
                    <button type="button" onClick={() => moveImage(index, index + 1)} className="rounded bg-white p-1">
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Відео</h2>
          <p className="mt-1 text-sm text-muted-foreground">MP4, WebM або MOV. Максимум 200 МБ. Відображається на сторінці товару.</p>
        </div>
        {videoUrl ? (
          <div className="relative overflow-hidden rounded-lg border bg-gray-50">
            <video src={videoUrl} controls className="w-full max-h-72 object-contain" />
            <button
              type="button"
              onClick={() => setVideoUrl(null)}
              className="absolute right-2 top-2 rounded bg-white p-1 text-red-500 shadow hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="w-full rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-blue-400"
          >
            <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <span className="text-sm text-muted-foreground">
              {uploadingVideo ? 'Завантаження відео...' : 'Натисніть, щоб завантажити відео'}
            </span>
          </button>
        )}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={handleVideoUpload}
        />
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Опис</h2>
          <p className="mt-1 text-sm text-muted-foreground">Коротко опишіть переваги, комплектацію та важливі деталі.</p>
        </div>
        <RichEditor value={description} onChange={setDescription} placeholder="Опис товару..." />
      </section>

      <div className="pointer-events-none sticky bottom-4 z-30 -mt-2">
        <div className="pointer-events-auto ml-auto max-w-fit rounded-2xl border border-gray-200 bg-white/96 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/admin/products">Скасувати</Link>
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !canSave()} className="w-full sm:w-auto">
            {saving ? 'Збереження...' : mode === 'edit' ? 'Зберегти' : 'Створити'}
          </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MerchPanel ──────────────────────────────────────────────────────────────
interface MerchPanelProps {
  title: string;
  description: string;
  mode: 'products' | 'category';
  onModeChange: (m: 'products' | 'category') => void;
  productQuery: string;
  onProductQueryChange: (q: string) => void;
  productOptions: ProductOptionItem[];
  selectedProductIds: string[];
  onToggleProduct: (id: string) => void;
  selectedProducts: ProductOptionItem[];
  categoryPickerQuery: string;
  onCategoryPickerQueryChange: (q: string) => void;
  categoryOptions: CategoryOption[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  getCategoryPathLabel: (cat: import('@/types').Category) => string;
}

function MerchPanel({
  title, description, mode, onModeChange,
  productQuery, onProductQueryChange, productOptions, selectedProductIds, onToggleProduct, selectedProducts,
  categoryPickerQuery, onCategoryPickerQueryChange, categoryOptions, selectedCategoryId, onSelectCategory,
  getCategoryPathLabel,
}: MerchPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-950">{title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        {/* Mode toggle */}
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          {(['products', 'category'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                mode === m ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {m === 'products' ? 'Конкретні товари' : 'Категорія'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'products' ? (
        <>
          <Input
            value={productQuery}
            onChange={(e) => onProductQueryChange(e.target.value)}
            placeholder="Пошук по назві, slug або артикулу"
            className="mb-3 h-10"
          />
          {selectedProducts.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {selectedProducts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleProduct(item.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 py-0.5 pl-2 pr-1.5 text-xs text-blue-700 hover:bg-blue-100"
                >
                  <span className="max-w-[160px] truncate">{item.name}</span>
                  <X className="h-2.5 w-2.5 shrink-0 opacity-60" />
                </button>
              ))}
            </div>
          )}
          <div className="max-h-64 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
            {productOptions.map((item) => {
              const selected = selectedProductIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleProduct(item.id)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors',
                    selected ? 'bg-blue-50' : 'hover:bg-gray-50',
                  )}
                >
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border bg-gray-50">
                    <Image src={getMainImage(item)} alt={item.name} fill className="object-contain p-0.5" sizes="32px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn('truncate text-sm font-medium', selected ? 'text-blue-700' : 'text-gray-900')}>{item.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[item.category?.name, item.slug].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  {selected
                    ? <X className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                    : <div className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            На сторінці товару показуватимуться випадкові товари з обраної категорії.
          </p>
          <Input
            value={categoryPickerQuery}
            onChange={(e) => onCategoryPickerQueryChange(e.target.value)}
            placeholder="Пошук по категоріях"
            className="mb-2 h-10"
          />
          {selectedCategoryId && (
            <div className="mb-3">
              <button
                type="button"
                onClick={() => onSelectCategory('')}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
              >
                <span>{getCategoryPathLabel(categoryOptions.find((o) => o.category.id === selectedCategoryId)?.category as any) || selectedCategoryId}</span>
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
            {categoryOptions.map(({ category, depth }) => {
              const isSelected = selectedCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onSelectCategory(isSelected ? '' : category.id)}
                  className={cn(
                    'flex w-full items-center px-3 py-2 text-left text-sm transition-colors',
                    isSelected ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700 hover:bg-gray-50',
                  )}
                  style={{ paddingLeft: 12 + depth * 14 }}
                >
                  {depth > 0 && <span className="mr-1.5 text-gray-300 text-xs">—</span>}
                  {category.name}
                  {isSelected && <span className="ml-auto text-xs text-blue-500">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
