
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
  modelName: z.string().optional(), // Nuevo campo: Nombre del Modelo o Estilo
  material: z.string().optional(), // Nuevo campo: Material
  finishColor: z.string().optional(), // Nuevo campo: Acabado o Color
  panelStyle: z.enum([ // Nuevo campo: Estilo o Diseño del Panel
    'Panel Elevado',
    'Panel Plano o Rebajado',
    'Liso o Slab',
    'Con Moldura',
  ]).optional(),
  edgeProfile: z.enum([ // Nuevo campo: Perfil del Canto
    'Canto Recto',
    'Canto Biselado',
    'Canto Redondeado',
  ]).optional(),
  sku: z.string().min(1, 'El SKU es requerido'), // Movido para evitar duplicado
  description: z.string().optional(), // Movido para evitar duplicado
  categoryId: z.string().min(1, 'La categoría es requerida'),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  dimensionUnit: z.string().default('mm'),
  basePrice: z.number().min(0, 'El precio debe ser mayor o igual a 0').multipleOf(0.000001, 'El precio base es por mm² - puede tener hasta 6 decimales'),
  currency: z.string().default('MXN'),
  isCustomizable: z.boolean().default(true),
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
  modelName?: string;
  sku: string;
  material?: string;
  finishColor?: string;
  panelStyle?: 'Panel Elevado' | 'Panel Plano o Rebajado' | 'Liso o Slab' | 'Con Moldura';
  edgeProfile?: 'Canto Recto' | 'Canto Biselado' | 'Canto Redondeado';
  categoryId: string;
  width?: number;
  height?: number;
  dimensionUnit: string;
  basePrice: number;
  currency: string;
  images: string[];
  model3d?: string;
  thumbnail?: string;
  isCustomizable: boolean;
  leadTime: number;
  minQuantity: number;
  maxQuantity?: number;
  tags: string[];
  featured: boolean;
  status: string;
}

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export default function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
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
      modelName: product?.modelName || '',
      material: product?.material || '',
      finishColor: product?.finishColor || '',
      panelStyle: product?.panelStyle, // Ya es undefined por defecto si product?.panelStyle es undefined/null
      edgeProfile: product?.edgeProfile, // Ya es undefined por defecto si product?.edgeProfile es undefined/null
      sku: product?.sku || '',
      description: product?.description || '',
      categoryId: product?.categoryId || '',
      width: product?.width || undefined,
      height: product?.height || undefined,
      dimensionUnit: product?.dimensionUnit || 'mm',
      basePrice: product?.basePrice || 0,
      currency: product?.currency || 'MXN',
      isCustomizable: product?.isCustomizable ?? true,
      leadTime: product?.leadTime || 7,
      minQuantity: product?.minQuantity || 1,
      maxQuantity: product?.maxQuantity || undefined,
      featured: product?.featured || false,
      status: (product?.status as any) || 'ACTIVE',
    }
  });

  useEffect(() => {
    fetchCategories();
  }, []);

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
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...register('description')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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

        {/* Door Characteristics */}
        <Card>
          <CardHeader>
            <CardTitle>Características de la Puerta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="modelName">Nombre del Modelo o Estilo</Label>
              <Input
                id="modelName"
                {...register('modelName')}
              />
            </div>

            <div>
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                {...register('material')}
              />
            </div>

            <div>
              <Label htmlFor="finishColor">Acabado o Color</Label>
              <Input
                id="finishColor"
                {...register('finishColor')}
              />
            </div>

            <div>
              <Label htmlFor="panelStyle">Estilo o Diseño del Panel</Label>
              <Select onValueChange={(value) => setValue('panelStyle', value as ProductFormData["panelStyle"])} value={watch('panelStyle') || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estilo de panel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Panel Elevado">Panel Elevado</SelectItem>
                  <SelectItem value="Panel Plano o Rebajado">Panel Plano o Rebajado</SelectItem>
                  <SelectItem value="Liso o Slab">Liso o Slab</SelectItem>
                  <SelectItem value="Con Moldura">Con Moldura</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edgeProfile">Perfil del Canto</Label>
              <Select onValueChange={(value) => setValue('edgeProfile', value as ProductFormData["edgeProfile"])} value={watch('edgeProfile') || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar perfil del canto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Canto Recto">Canto Recto</SelectItem>
                  <SelectItem value="Canto Biselado">Canto Biselado</SelectItem>
                  <SelectItem value="Canto Redondeado">Canto Redondeado</SelectItem>
                </SelectContent>
              </Select>
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
                <Label htmlFor="basePrice">Precio Base por mm² *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.000001"
                  {...register('basePrice', { valueAsNumber: true })}
                  className={errors.basePrice ? 'border-red-500' : ''}
                  placeholder="0.002026"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Precio por milímetro cuadrado. Ej: 0.002026 para $1823.40 por 1000×900mm
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

            <div className="flex items-center space-x-2">
              <Switch
                id="isCustomizable"
                checked={watch('isCustomizable')}
                onCheckedChange={(checked) => setValue('isCustomizable', checked)}
              />
              <Label htmlFor="isCustomizable">Producto personalizable</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dimensions */}
      <Card>
        <CardHeader>
          <CardTitle>Dimensiones Estándar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="width">Ancho (mm)</Label>
              <Input
                id="width"
                type="number"
                step="1"
                min="1"
                max="10000"
                {...register('width', { valueAsNumber: true })}
                placeholder="1000"
              />
              <p className="text-xs text-gray-500 mt-1">Dimensión estándar en milímetros</p>
            </div>

            <div>
              <Label htmlFor="height">Alto (mm)</Label>
              <Input
                id="height"
                type="number"
                step="1"
                min="1"
                max="10000"
                {...register('height', { valueAsNumber: true })}
                placeholder="900"
              />
              <p className="text-xs text-gray-500 mt-1">Dimensión estándar en milímetros</p>
            </div>

            <div>
              <Label htmlFor="dimensionUnit">Unidad de Medida</Label>
              <Select onValueChange={(value) => setValue('dimensionUnit', value)} defaultValue={product?.dimensionUnit || 'mm'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mm">Milímetros (mm)</SelectItem>
                  <SelectItem value="cm">Centímetros (cm)</SelectItem>
                  <SelectItem value="m">Metros (m)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Unidad para mostrar dimensiones</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Las dimensiones estándar son opcionales. Los clientes podrán ingresar dimensiones personalizadas al cotizar.
            </p>
            <p className="text-sm text-blue-600 mt-1">
              El precio se calculará automáticamente como: <strong>Ancho × Alto × Precio Base</strong>
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
