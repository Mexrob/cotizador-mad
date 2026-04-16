
'use client';

import { useState } from 'react';
import { ArrowLeft, Package, Folder, Truck, PlusCircle } from 'lucide-react';
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
import EdgeBandingsManagement from '@/components/edge-bandings-management';
import HandleModelsManagement from '@/components/handle-models-management';
import CategoriesManagement from '@/components/categories-management';
import BackFacesManagement from '@/components/back-faces-management';
import BrandsManagement from '@/components/brands-management';
import ExtraServicesManagement from '@/components/extra-services-management';
import ShippingCostsManagement from '@/components/shipping-costs-management';
import { Palette, Ruler, ShoppingBag, Layout, Tag as TagIcon, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface ProductDetails {
  id: string;
  name: string;
  categoryId: string;
  categoria?: string;
  coleccion?: string;
  linea?: string;
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
  createdAt?: Date;
  updatedAt?: Date;
}

export default function ProductsAdminPage() {
  const [activeTab, setActiveTab] = useState('tones');
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

      console.log('Submitting product:', { url, method, data });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log('Response:', result);

      if (response.ok && result.success) {
        toast.success(editingProduct ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
        handleCloseProductForm();
        window.location.reload();
      } else {
        toast.error(result.error || result.message || 'Error al guardar el producto');
      }
    } catch (error) {
      console.error('Error submitting product:', error);
      toast.error('Error al guardar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price || 0);
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
              Administra el catálogo completo de productos
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto w-full justify-start border-b rounded-none bg-transparent gap-2 mb-4">
            <TabsTrigger value="categories" className="flex items-center gap-2 px-4 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none">
              <Folder className="h-4 w-4" />
              Categorías
            </TabsTrigger>
            <TabsTrigger value="lines" className="flex items-center gap-2 px-4 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none">
              <Layout className="h-4 w-4" />
              Líneas
            </TabsTrigger>
            <TabsTrigger value="tones" className="flex items-center gap-2 px-4 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none">
              <Package className="h-4 w-4" />
              Productos
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
            <TabsTrigger value="brands" className="flex items-center gap-2 px-4 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none">
              <TagIcon className="h-4 w-4" />
              Marcas
            </TabsTrigger>
            <TabsTrigger value="extras" className="flex items-center gap-2 px-4 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none">
              <DollarSign className="h-4 w-4" />
              Extras
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex items-center gap-2 px-4 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none">
              <Truck className="h-4 w-4" />
              Envíos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <CategoriesManagement />
          </TabsContent>

          <TabsContent value="lines">
            <ProductLinesManagement />
          </TabsContent>

          <TabsContent value="tones">
            <ProductsTable
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
              onViewProduct={handleViewProduct}
            />
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

          <TabsContent value="brands">
            <BrandsManagement />
          </TabsContent>

          <TabsContent value="extras">
            <ExtraServicesManagement />
          </TabsContent>

          <TabsContent value="shipping">
            <ShippingCostsManagement />
          </TabsContent>
        </Tabs>

        {/* Product Form Dialog */}
        <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
            </DialogHeader>
            <ProductForm
              key={editingProduct?.id || 'new-product'}
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
                    <CardTitle>Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Nombre</Label>
                        <p className="text-lg font-semibold">{viewingProduct.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Línea</Label>
                        <p className="text-lg">{(viewingProduct as any).lineaName || viewingProduct.linea || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Categoría</Label>
                        <p className="text-lg">{viewingProduct.categoria || viewingProduct.categoryId}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Colección</Label>
                        <p className="text-lg">{viewingProduct.coleccion || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Colores */}
                <Card>
                  <CardHeader>
                    <CardTitle>Colores y Materiales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Tono/Color</Label>
                        <p>{viewingProduct.tonoColor || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Tono Vidrio</Label>
                        <p>{viewingProduct.tonoVidrio || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Tono Aluminio</Label>
                        <p>{viewingProduct.tonoAluminio || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Precios</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Precio Base por m²</Label>
                        <p className="text-xl font-bold text-green-600">
                          {formatPrice(viewingProduct.precioBaseM2 || 0)}
                        </p>
                      </div>
                      {viewingProduct.precioVidrio && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Precio Vidrio 4mm</Label>
                          <p className="text-lg font-semibold">
                            {formatPrice(viewingProduct.precioVidrio)}
                          </p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Tiempo de Entrega</Label>
                        <p>{viewingProduct.tiempoEntrega || 7} días hábiles</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dimensiones */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Dimensiones</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {viewingProduct.puertaAnchoMin && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Puerta</Label>
                          <p className="text-sm">
                            {viewingProduct.puertaAnchoMin}-{viewingProduct.puertaAnchoMax}mm (Ancho) × 
                            {viewingProduct.puertaAltoMin}-{viewingProduct.puertaAltoMax}mm (Alto)
                          </p>
                        </div>
                      )}
                      {viewingProduct.frenteAnchoMin && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Frente</Label>
                          <p className="text-sm">
                            {viewingProduct.frenteAnchoMin}-{viewingProduct.frenteAnchoMax}mm (Ancho) × 
                            {viewingProduct.frenteAltoMin}-{viewingProduct.frenteAltoMax}mm (Alto)
                          </p>
                        </div>
                      )}
                      {viewingProduct.ventanaAnchoMin && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Ventana</Label>
                          <p className="text-sm">
                            {viewingProduct.ventanaAnchoMin}-{viewingProduct.ventanaAnchoMax}mm (Ancho) × 
                            {viewingProduct.ventanaAltoMin}-{viewingProduct.ventanaAltoMax}mm (Alto)
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
