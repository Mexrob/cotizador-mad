
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import ProductImageUpload from './product-image-upload';

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  sku: z.string().min(1, 'El SKU es requerido'),
  categoryId: z.string().min(1, 'La categoría es requerida'),

  // Rangos de dimensiones
  minWidth: z.number().positive().optional(),
  maxWidth: z.number().positive().optional(),
  minHeight: z.number().positive().optional(),
  maxHeight: z.number().positive().optional(),
  lineId: z.string().optional().nullable(),

  // Dimensiones estándar
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  dimensionUnit: z.string().default('mm'),

  // Precio y configuración
  basePrice: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  currency: z.string().default('MXN'),
  leadTime: z.number().int().min(1).default(7),
  minQuantity: z.number().int().min(1).default(1),
  maxQuantity: z.number().int().positive().optional(),
  featured: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).default('ACTIVE'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
  parent?: { name: string } | null;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  categoryId: string;


  // Rangos de dimensiones
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;

  // Dimensiones estándar
  width?: number;
  height?: number;
  dimensionUnit: string;

  // Precio y configuración
  basePrice: number;
  currency: string;
  images: string[];
  thumbnail?: string;
  leadTime: number;
  minQuantity: number;
  maxQuantity?: number;
  tags: string[];
  featured: boolean;
  status: string;
  lineId?: string;
}

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export default function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productLines, setProductLines] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [tags, setTags] = useState<string[]>(product?.tags || []);
  const [newTag, setNewTag] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      sku: product?.sku || '',
      categoryId: product?.categoryId || '',


      // Rangos de dimensiones
      minWidth: product?.minWidth || undefined,
      maxWidth: product?.maxWidth || undefined,
      minHeight: product?.minHeight || undefined,
      maxHeight: product?.maxHeight || undefined,

      // Dimensiones estándar
      width: product?.width || undefined,
      height: product?.height || undefined,
      dimensionUnit: product?.dimensionUnit || 'cm',

      // Precio y configuración
      basePrice: product?.basePrice || 0,
      currency: product?.currency || 'MXN',
      leadTime: product?.leadTime || 7,
      minQuantity: product?.minQuantity || 1,
      maxQuantity: product?.maxQuantity || undefined,
      featured: product?.featured || false,
      status: (product?.status as any) || 'ACTIVE',
      lineId: product?.lineId || undefined,
    }
  });

  useEffect(() => {
    fetchCategories();
    fetchProductLines();
  }, []);

  const fetchProductLines = async () => {
    try {
      const response = await fetch('/api/admin/lines');
      if (response.ok) {
        const data = await response.json();
        setProductLines(data.data);
      }
    } catch (error) {
      console.error('Error fetching product lines:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error al cargar las categorías');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const onFormSubmit = async (data: ProductFormData) => {
    const formData = {
      ...data,
      lineId: data.lineId === 'none' ? null : data.lineId,
      images,
      tags,
      thumbnail: images[0] || null,
    };

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del Producto *</Label>
              <Input
                id="name"
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                {...register('sku')}
                className={errors.sku ? 'border-red-500' : ''}
              />
              {errors.sku && (
                <p className="text-sm text-red-600 mt-1">{errors.sku.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...register('description')}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="categoryId">Categoría *</Label>
              <Select onValueChange={(value) => setValue('categoryId', value)} defaultValue={product?.categoryId}>
                <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.parent ? `${category.parent.name} > ${category.name}` : category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-red-600 mt-1">{errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lineId">Línea de Producto (opcional para Kit Wizard)</Label>
              <Select
                onValueChange={(value) => {
                  setValue('lineId', value);
                }}
                value={watch('lineId') || 'none'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin línea (producto estándar)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna / Producto Estándar</SelectItem>
                  {productLines.map((line) => (
                    <SelectItem key={line.id} value={line.id}>
                      {line.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select onValueChange={(value) => setValue('status', value as any)} defaultValue={product?.status || 'ACTIVE'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="INACTIVE">Inactivo</SelectItem>
                    <SelectItem value="DISCONTINUED">Descontinuado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="featured"
                  checked={watch('featured')}
                  onCheckedChange={(checked) => setValue('featured', checked)}
                />
                <Label htmlFor="featured">Producto destacado</Label>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Precio y Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="basePrice">Precio Base por m² *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  {...register('basePrice', { valueAsNumber: true })}
                  className={errors.basePrice ? 'border-red-500' : ''}
                  placeholder="1850.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Precio por metro cuadrado (m²). Ej: $1850.00 por m²
                </p>
                {errors.basePrice && (
                  <p className="text-sm text-red-600 mt-1">{errors.basePrice.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="currency">Moneda</Label>
                <Select onValueChange={(value) => setValue('currency', value)} defaultValue={product?.currency || 'MXN'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                    <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="leadTime">Tiempo de Entrega (días)</Label>
                <Input
                  id="leadTime"
                  type="number"
                  {...register('leadTime', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label htmlFor="minQuantity">Cantidad Mínima</Label>
                <Input
                  id="minQuantity"
                  type="number"
                  {...register('minQuantity', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label htmlFor="maxQuantity">Cantidad Máxima</Label>
                <Input
                  id="maxQuantity"
                  type="number"
                  {...register('maxQuantity', { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dimension Ranges */}
      <Card>
        <CardHeader>
          <CardTitle>Rangos de Dimensiones Permitidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Ancho</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minWidth">Ancho Mínimo (cm)</Label>
                  <Input
                    id="minWidth"
                    type="number"
                    step="0.1"
                    min="0.1"
                    {...register('minWidth', { valueAsNumber: true })}
                    placeholder="30"
                  />
                  <p className="text-xs text-gray-500 mt-1">Centímetros lineales</p>
                </div>
                <div>
                  <Label htmlFor="maxWidth">Ancho Máximo (cm)</Label>
                  <Input
                    id="maxWidth"
                    type="number"
                    step="0.1"
                    min="0.1"
                    {...register('maxWidth', { valueAsNumber: true })}
                    placeholder="200"
                  />
                  <p className="text-xs text-gray-500 mt-1">Centímetros lineales</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm">Alto</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minHeight">Alto Mínimo (cm)</Label>
                  <Input
                    id="minHeight"
                    type="number"
                    step="0.1"
                    min="0.1"
                    {...register('minHeight', { valueAsNumber: true })}
                    placeholder="30"
                  />
                  <p className="text-xs text-gray-500 mt-1">Centímetros lineales</p>
                </div>
                <div>
                  <Label htmlFor="maxHeight">Alto Máximo (cm)</Label>
                  <Input
                    id="maxHeight"
                    type="number"
                    step="0.1"
                    min="0.1"
                    {...register('maxHeight', { valueAsNumber: true })}
                    placeholder="300"
                  />
                  <p className="text-xs text-gray-500 mt-1">Centímetros lineales</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div>
            <h4 className="font-medium text-sm mb-4">Dimensiones Estándar (Opcional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="width">Ancho (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1000"
                  {...register('width', { valueAsNumber: true })}
                  placeholder="100"
                />
                <p className="text-xs text-gray-500 mt-1">Dimensión estándar en cm</p>
              </div>

              <div>
                <Label htmlFor="height">Alto (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1000"
                  {...register('height', { valueAsNumber: true })}
                  placeholder="90"
                />
                <p className="text-xs text-gray-500 mt-1">Dimensión estándar en cm</p>
              </div>

              <div>
                <Label htmlFor="dimensionUnit">Unidad de Medida</Label>
                <Select onValueChange={(value) => setValue('dimensionUnit', value)} defaultValue={product?.dimensionUnit || 'cm'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">Centímetros (cm)</SelectItem>
                    <SelectItem value="m">Metros (m)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-800 dark:text-gray-200">
              <strong>Nota:</strong> Los rangos de dimensiones se expresan en centímetros lineales (cm). Las dimensiones estándar son opcionales y sirven como referencia.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Etiquetas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Agregar etiqueta..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Imágenes del Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductImageUpload
            images={images}
            onImagesChange={setImages}
          />
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : (product ? 'Actualizar Producto' : 'Crear Producto')}
        </Button>
      </div>
    </form>
  );
}
