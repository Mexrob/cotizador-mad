
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import ProductImageUpload from '@/components/product-image-upload';

import { productSchema } from '@/lib/validationSchemas';

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
}

interface Product {
  id?: string;
  name?: string;
  categoryId?: string;
  categoria?: string;
  coleccion?: string;
  linea?: string;
  lineaName?: string;
  tonoColor?: string;
  tonoVidrio?: string;
  tonoAluminio?: string;
  precioBaseM2?: number;
  tiempoEntrega?: number;
  puertaAnchoMin?: number;
  puertaAnchoMax?: number;
  puertaAltoMin?: number;
  puertaAltoMax?: number;
  frenteAnchoMin?: number;
  frenteAnchoMax?: number;
  frenteAltoMin?: number;
  frenteAltoMax?: number;
  ventanaAnchoMin?: number;
  ventanaAnchoMax?: number;
  ventanaAltoMin?: number;
  ventanaAltoMax?: number;
  precioVidrio?: number;
  images?: string[];
}

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: Product) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [lines, setLines] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [loadingData, setLoadingData] = useState(true);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      categoryId: product?.categoryId || '',
      categoria: product?.categoria || '',
      coleccion: product?.coleccion || '',
      linea: product?.linea || '',
      tonoColor: product?.tonoColor || '',
      tonoVidrio: product?.tonoVidrio || '',
      tonoAluminio: product?.tonoAluminio || '',
      precioBaseM2: product?.precioBaseM2 || 0,
      tiempoEntrega: product?.tiempoEntrega || 7,
      puertaAnchoMin: product?.puertaAnchoMin,
      puertaAnchoMax: product?.puertaAnchoMax,
      puertaAltoMin: product?.puertaAltoMin,
      puertaAltoMax: product?.puertaAltoMax,
      frenteAnchoMin: product?.frenteAnchoMin,
      frenteAnchoMax: product?.frenteAnchoMax,
      frenteAltoMin: product?.frenteAltoMin,
      frenteAltoMax: product?.frenteAltoMax,
      ventanaAnchoMin: product?.ventanaAnchoMin,
      ventanaAnchoMax: product?.ventanaAnchoMax,
      ventanaAltoMin: product?.ventanaAltoMin,
      ventanaAltoMax: product?.ventanaAltoMax,
      precioVidrio: product?.precioVidrio,
    },
  });

  useEffect(() => {
    const loadAllData = async () => {
      setLoadingData(true);
      await Promise.all([fetchCategories(), fetchLines()]);
      setLoadingData(false);
    };
    loadAllData();
  }, []);

  useEffect(() => {
    if (product) {
      reset({
        name: product?.name || '',
        categoryId: product?.categoryId || '',
        categoria: product?.categoria || '',
        coleccion: product?.coleccion || '',
        linea: product?.linea || '',
        tonoColor: product?.tonoColor || '',
        tonoVidrio: product?.tonoVidrio || '',
        tonoAluminio: product?.tonoAluminio || '',
        precioBaseM2: product?.precioBaseM2 ?? 0,
        tiempoEntrega: product?.tiempoEntrega ?? 7,
        puertaAnchoMin: product?.puertaAnchoMin,
        puertaAnchoMax: product?.puertaAnchoMax,
        puertaAltoMin: product?.puertaAltoMin,
        puertaAltoMax: product?.puertaAltoMax,
        frenteAnchoMin: product?.frenteAnchoMin,
        frenteAnchoMax: product?.frenteAnchoMax,
        frenteAltoMin: product?.frenteAltoMin,
        frenteAltoMax: product?.frenteAltoMax,
        ventanaAnchoMin: product?.ventanaAnchoMin,
        ventanaAnchoMax: product?.ventanaAnchoMax,
        ventanaAltoMin: product?.ventanaAltoMin,
        ventanaAltoMax: product?.ventanaAltoMax,
        precioVidrio: product?.precioVidrio,
        images: product?.images || [],
      });
    }
  }, [product, reset]);

  useEffect(() => {
    setImages(product?.images || []);
  }, [product]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', { credentials: 'include' });
      const data = await response.json();
      if (Array.isArray(data)) {
        setCategories(data);
      } else if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchLines = async () => {
    try {
      const response = await fetch('/api/product-lines', { credentials: 'include' });
      const data = await response.json();
      setLines(data.data || []);
    } catch (error) {
      console.error('Error fetching lines:', error);
    }
  };

  const handleFormSubmit = (data: ProductFormData) => {
    console.log('Form submitted with images:', images);
    onSubmit({ ...data, images } as Product);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Producto *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ej: FOIL - Blanco Liso"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoría</Label>
              {loadingData ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => {
                    const selectedCategory = categories.find(c => c.id === field.value);
                    
                    return (
                      <select
                        id="categoryId"
                        value={selectedCategory ? field.value : ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="">Seleccionar categoría</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                        {!selectedCategory && product?.categoria && (
                          <option value={product.categoria} disabled>
                            {product.categoria} (actual)
                          </option>
                        )}
                      </select>
                    );
                  }}
                />
              )}
              {errors.categoryId && (
                <p className="text-sm text-red-500">{errors.categoryId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linea">Línea</Label>
              {loadingData ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Controller
                  name="linea"
                  control={control}
                  render={({ field }) => {
                    const selectedLine = lines.find(l => l.id === field.value);
                    
                    return (
                      <select
                        id="linea"
                        value={selectedLine ? field.value : ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Seleccionar línea</option>
                        {lines.map((line) => (
                          <option key={line.id} value={line.id}>
                            {line.name}
                          </option>
                        ))}
                        {!selectedLine && product?.linea && (
                          <option value={product.linea} disabled>
                            {product.lineaName || product.linea} (actual)
                          </option>
                        )}
                      </select>
                    );
                  }}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="coleccion">Colección</Label>
              <Input
                id="coleccion"
                {...register('coleccion')}
                placeholder="Ej: Luna, Sol, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría (texto)</Label>
              <Input
                id="categoria"
                {...register('categoria')}
                placeholder="Ej: Puerta, Ventana"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colores */}
      <Card>
        <CardHeader>
          <CardTitle>Colores y Materiales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tonoColor">Tono/Color</Label>
              <Input
                id="tonoColor"
                {...register('tonoColor')}
                placeholder="Ej: Blanco Liso, Negro Mate"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tonoVidrio">Tono Vidrio</Label>
              <Input
                id="tonoVidrio"
                {...register('tonoVidrio')}
                placeholder="Ej: Claro, Bronce"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tonoAluminio">Tono Aluminio</Label>
              <Input
                id="tonoAluminio"
                {...register('tonoAluminio')}
                placeholder="Ej: Natural, Negro"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Precios */}
      <Card>
        <CardHeader>
          <CardTitle>Precios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precioBaseM2">Precio Base por m² (MXN)</Label>
              <Input
                id="precioBaseM2"
                type="number"
                step="0.01"
                {...register('precioBaseM2', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="precioVidrio">Precio Vidrio 4mm (MXN)</Label>
              <Input
                id="precioVidrio"
                type="number"
                step="0.01"
                {...register('precioVidrio', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tiempoEntrega">Tiempo de Entrega (días)</Label>
              <Input
                id="tiempoEntrega"
                type="number"
                {...register('tiempoEntrega', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                placeholder="7"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimensiones Puerta */}
      <Card>
        <CardHeader>
          <CardTitle>Dimensiones Puerta (mm)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="puertaAnchoMin">Ancho Mín</Label>
              <Input
                id="puertaAnchoMin"
                type="number"
                {...register('puertaAnchoMin', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="puertaAnchoMax">Ancho Máx</Label>
              <Input
                id="puertaAnchoMax"
                type="number"
                {...register('puertaAnchoMax', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="puertaAltoMin">Alto Mín</Label>
              <Input
                id="puertaAltoMin"
                type="number"
                {...register('puertaAltoMin', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="puertaAltoMax">Alto Máx</Label>
              <Input
                id="puertaAltoMax"
                type="number"
                {...register('puertaAltoMax', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimensiones Frente */}
      <Card>
        <CardHeader>
          <CardTitle>Dimensiones Frente (mm)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frenteAnchoMin">Ancho Mín</Label>
              <Input
                id="frenteAnchoMin"
                type="number"
                {...register('frenteAnchoMin', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frenteAnchoMax">Ancho Máx</Label>
              <Input
                id="frenteAnchoMax"
                type="number"
                {...register('frenteAnchoMax', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frenteAltoMin">Alto Mín</Label>
              <Input
                id="frenteAltoMin"
                type="number"
                {...register('frenteAltoMin', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frenteAltoMax">Alto Máx</Label>
              <Input
                id="frenteAltoMax"
                type="number"
                {...register('frenteAltoMax', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimensiones Ventana */}
      <Card>
        <CardHeader>
          <CardTitle>Dimensiones Ventana (mm)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ventanaAnchoMin">Ancho Mín</Label>
              <Input
                id="ventanaAnchoMin"
                type="number"
                {...register('ventanaAnchoMin', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ventanaAnchoMax">Ancho Máx</Label>
              <Input
                id="ventanaAnchoMax"
                type="number"
                {...register('ventanaAnchoMax', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ventanaAltoMin">Alto Mín</Label>
              <Input
                id="ventanaAltoMin"
                type="number"
                {...register('ventanaAltoMin', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ventanaAltoMax">Alto Máx</Label>
              <Input
                id="ventanaAltoMax"
                type="number"
                {...register('ventanaAltoMax', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Imágenes */}
      <Card>
        <CardHeader>
          <CardTitle>Imágenes del Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductImageUpload
            images={images}
            onImagesChange={setImages}
            maxImages={10}
          />
        </CardContent>
      </Card>

      {/* Buttons */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : product ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
