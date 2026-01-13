
'use client';

import { useState } from 'react';
import { ArrowLeft, Package, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import ProductsTable from '@/components/products-table';
import ProductForm from '@/components/product-form';
import Link from 'next/link';
import ProductLinesManagement from '@/components/product-lines-management';
import ProductTonesManagement from '@/components/product-tones-management';
import EdgeBandingsManagement from '@/components/edge-bandings-management';
import HandleModelsManagement from '@/components/handle-models-management';
import CategoriesManagement from '@/components/categories-management';
import BackFacesManagement from '@/components/back-faces-management';
import { Palette, Ruler, ShoppingBag, Layout } from 'lucide-react';
import { toast } from 'sonner';

interface ProductDetails {
  id: string;
  name: string;
  description?: string;
  sku: string;
  categoryId: string;
  width?: number;
  height?: number;
  depth?: number;
  weight?: number;
  dimensionUnit: string;
  weightUnit: string;
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

export default function ProductsAdminPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDetails | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ProductDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleViewProduct = (product: any) => {
    setViewingProduct(product);
  };

  const handleCloseProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleCloseProductView = () => {
    setViewingProduct(null);
  };

  const handleSubmitProduct = async (data: any) => {
    try {
      setIsSubmitting(true);

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(editingProduct ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
        handleCloseProductForm();
        // Refresh the products table
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar el producto');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Error al guardar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getDimensionsText = (product: ProductDetails) => {
    const dimensions = [];
    if (product.width) dimensions.push(`${product.width}${product.dimensionUnit}`);
    if (product.height) dimensions.push(`${product.height}${product.dimensionUnit}`);
    if (product.depth) dimensions.push(`${product.depth}${product.dimensionUnit}`);
    return dimensions.length > 0 ? `${dimensions.join(' × ')}` : 'Sin dimensiones';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al Panel
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Productos</h1>
            <p className="text-muted-foreground mt-2">
              Administra el catálogo completo de productos y sus categorías
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto w-full justify-start border-b rounded-none bg-transparent gap-2 mb-4">
            <TabsTrigger value="products" className="flex items-center gap-2 px-4 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none">
              <Package className="h-4 w-4" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2 px-4 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none">
              <Folder className="h-4 w-4" />
              Categorías
            </TabsTrigger>
            <TabsTrigger value="lines" className="flex items-center gap-2 px-4 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none">
              <Layout className="h-4 w-4" />
              Líneas
            </TabsTrigger>
            <TabsTrigger value="tones" className="flex items-center gap-2 px-4 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none">
              <Palette className="h-4 w-4" />
              Tonos
            </TabsTrigger>
            <TabsTrigger value="edges" className="flex items-center gap-2 px-4 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none">
              <Ruler className="h-4 w-4" />
              Cubrecantos
            </TabsTrigger>
            <TabsTrigger value="handles" className="flex items-center gap-2 px-4 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none">
              <ShoppingBag className="h-4 w-4" />
              Jaladeras
            </TabsTrigger>
            <TabsTrigger value="backfaces" className="flex items-center gap-2 px-4 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none">
              <Layout className="h-4 w-4" />
              Caras
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductsTable
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
              onViewProduct={handleViewProduct}
            />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesManagement />
          </TabsContent>

          <TabsContent value="lines">
            <ProductLinesManagement />
          </TabsContent>

          <TabsContent value="tones">
            <ProductTonesManagement />
          </TabsContent>

          <TabsContent value="edges">
            <EdgeBandingsManagement />
          </TabsContent>

          <TabsContent value="handles">
            <HandleModelsManagement />
          </TabsContent>

          <TabsContent value="backfaces">
            <BackFacesManagement />
          </TabsContent>
        </Tabs>

        {/* Product Form Dialog */}
        <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
            </DialogHeader>
            <ProductForm
              product={editingProduct || undefined}
              onSubmit={handleSubmitProduct}
              onCancel={handleCloseProductForm}
              isLoading={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        {/* Product View Dialog */}
        <Dialog open={!!viewingProduct} onOpenChange={handleCloseProductView}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Producto</DialogTitle>
            </DialogHeader>
            {viewingProduct && (
              <div className="space-y-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Información Básica</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Nombre</Label>
                        <p className="text-lg font-semibold">{viewingProduct.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">SKU</Label>
                        <p className="font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                          {viewingProduct.sku}
                        </p>
                      </div>
                    </div>
                    {viewingProduct.description && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Descripción</Label>
                        <p className="text-gray-700">{viewingProduct.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pricing & Dimensions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Precio y Configuración</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Precio Base</Label>
                        <p className="text-xl font-bold text-green-600">
                          {formatPrice(viewingProduct.basePrice, viewingProduct.currency)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Tiempo de Entrega</Label>
                          <p>{viewingProduct.leadTime} días</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Cantidad Mínima</Label>
                          <p>{viewingProduct.minQuantity}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Dimensiones</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Dimensiones</Label>
                        <p className="text-lg">{getDimensionsText(viewingProduct)}</p>
                      </div>
                      {viewingProduct.weight && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Peso</Label>
                          <p>{viewingProduct.weight}{viewingProduct.weightUnit}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Images */}
                {viewingProduct.images.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Imágenes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {viewingProduct.images.map((image, index) => (
                          <div key={index} className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={image}
                              alt={`${viewingProduct.name} ${index + 1}`}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tags */}
                {viewingProduct.tags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Etiquetas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {viewingProduct.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
