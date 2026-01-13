
'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, Tag, Package, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  status: string;
  basePrice: number;
  currency: string;
  images: string[];
  featured: boolean;
  leadTime: number;
  category: {
    id: string;
    name: string;
  };
  _count: {
    quoteItems: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
}

interface ProductsTableProps {
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
}

export default function ProductsTable({ onAddProduct, onEditProduct, onViewProduct }: ProductsTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, searchTerm, selectedCategory, selectedStatus]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory !== 'all' && { categoryId: selectedCategory }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
      });

      const response = await fetch(`/api/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        // Corrección: la API devuelve productos en 'data.data', no 'data.products'
        // Agregar validación defensiva para asegurar que siempre sea un array
        setProducts(Array.isArray(data.data) ? data.data : []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        toast.error('Error al cargar los productos');
        setProducts([]); // Asegurar que products siempre sea un array
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error al cargar los productos');
      setProducts([]); // Asegurar que products siempre sea un array
    } finally {
      setLoading(false);
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
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      setDeletingId(productId);
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Producto eliminado exitosamente');
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar el producto');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-600">Activo</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Inactivo</Badge>;
      case 'DISCONTINUED':
        return <Badge variant="destructive">Descontinuado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Productos</h2>
          <p className="text-gray-600">Administra el catálogo de productos de la empresa</p>
        </div>
        <Button onClick={onAddProduct} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={handleCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={handleStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="INACTIVE">Inactivo</SelectItem>
                <SelectItem value="DISCONTINUED">Descontinuado</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedStatus('all');
              setCurrentPage(1);
            }}>
              <Filter className="h-4 w-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos ({products?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-module-black"></div>
            </div>
          ) : !products || products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No se encontraron productos</p>
              <Button onClick={onAddProduct} className="mt-4">
                Crear primer producto
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Tiempo Entrega</TableHead>
                    <TableHead>Cotizaciones</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                            {product.images[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{product.name}</p>
                              {product.featured && (
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            {product.description && (
                              <p className="text-sm text-gray-500 truncate max-w-xs">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {product.sku}
                        </code>
                      </TableCell>
                      <TableCell>{product.category.name}</TableCell>
                      <TableCell>
                        {formatPrice(product.basePrice, product.currency)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(product.status)}
                      </TableCell>
                      <TableCell>
                        {product.leadTime} días
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {product._count.quoteItems}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewProduct(product)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={product._count.quoteItems > 0 || deletingId === product.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El producto "{product.name}" será eliminado permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
