
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Package, Upload, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  categoryId: string;
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
  createdAt?: string;
  updatedAt?: string;
}

interface ProductsTableProps {
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
}

export default function ProductsTable({ onAddProduct, onEditProduct, onViewProduct }: ProductsTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importData, setImportData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState({
    linea: '',
    categoria: '',
    coleccion: '',
    tiempoEntrega: ''
  });
  const [lines, setLines] = useState<{id: string, name: string}[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [totalAll, setTotalAll] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, limit, filters]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.linea && { linea: filters.linea }),
        ...(filters.categoria && { categoria: filters.categoria }),
        ...(filters.coleccion && { coleccion: filters.coleccion }),
        ...(filters.tiempoEntrega && { tiempoEntrega: filters.tiempoEntrega }),
      });

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      
      setProducts(data.products || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalAll(data.pagination?.totalAll || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [linesRes, categoriesRes, collectionsRes] = await Promise.all([
        fetch('/api/product-lines'),
        fetch('/api/categories'),
        fetch('/api/products/options')
      ]);

      const linesData = await linesRes.json();
      const categoriesData = await categoriesRes.json();
      const optionsData = await collectionsRes.json();

      setLines(linesData.data || []);
      setCategories(categoriesData?.map((c: any) => c.name) || []);
      
      const collectionsSet = new Set<string>();
      optionsData.products?.forEach((p: Product) => {
        if (p.coleccion) collectionsSet.add(p.coleccion);
      });
      setCollections(Array.from(collectionsSet).sort());
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const normalizeProductData = (row: any): any => {
    const getNumber = (val: any) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const num = parseFloat(val.replace(/,/g, ''));
        return isNaN(num) ? 0 : num;
      }
      return 0;
    };

    const getString = (val: any) => {
      if (!val) return '';
      return String(val).trim();
    };

    return {
      name: `${getString(row['linea'])} - ${getString(row['tono o color'])}`.trim() || 'Producto sin nombre',
      categoria: getString(row['categoria']),
      coleccion: getString(row['colección']),
      linea: getString(row['linea']),
      tonoColor: getString(row['tono o color']),
      tonoVidrio: getString(row['tonoVidrio'] || row['tono vidrio']),
      tonoAluminio: getString(row['tonoAluminio'] || row['tono aluminio']),
      precioBaseM2: getNumber(row['precio base por m²'] || row['precioBaseM2']),
      precioVidrio: getNumber(row['precio ml jaladera'] || row['precioVidrio']),
      tiempoEntrega: getNumber(row['tiempo de entrega (días habiles)'] || row['tiempoEntrega']),
      puertaAnchoMin: getNumber(row['ancho mín (mm)'] || row['puertaAnchoMin']),
      puertaAnchoMax: getNumber(row['ancho máx (mm)'] || row['puertaAnchoMax']),
      puertaAltoMin: getNumber(row['alto mín (mm)'] || row['puertaAltoMin']),
      puertaAltoMax: getNumber(row['alto máx (mm)'] || row['puertaAltoMax']),
      frenteAnchoMin: getNumber(row['ancho mín_fr (mm)'] || row['frenteAnchoMin']),
      frenteAnchoMax: getNumber(row['ancho máx_fr (mm)'] || row['frenteAnchoMax']),
      frenteAltoMin: getNumber(row['alto mín_fr (mm)'] || row['frenteAltoMin']),
      frenteAltoMax: getNumber(row['alto máx_fr (mm)'] || row['frenteAltoMax']),
    };
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const data: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        if (header.includes('precio') || header.includes('min') || header.includes('max')) {
          row[header] = parseFloat(value) || 0;
        } else {
          row[header] = value;
        }
      });
      data.push(row);
    }
    
    return data;
  };

  const parseXLSX = async (file: File): Promise<any[]> => {
    const { read, utils } = await import('xlsx');
    const data = await file.arrayBuffer();
    const workbook = read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return utils.sheet_to_json(worksheet);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let data: any[];
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'csv') {
        const text = await file.text();
        data = parseCSV(text);
      } else if (extension === 'xlsx' || extension === 'xls') {
        data = await parseXLSX(file);
      } else {
        toast.error('Formato no válido. Use CSV o XLSX');
        return;
      }

      if (data.length === 0) {
        toast.error('No se encontraron datos en el archivo');
        return;
      }

      const normalizedData = data.map(normalizeProductData);
      console.log('Normalized data sample:', JSON.stringify(normalizedData.slice(0, 3), null, 2));
      setPreviewData(normalizedData.slice(0, 5));
      setImportData(normalizedData);
      setShowImportDialog(true);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Error al procesar el archivo');
    }
  };

  const handleImport = async () => {
    if (importData.length === 0) {
      console.log('No import data');
      return;
    }

    console.log('Starting import with', importData.length, 'products');
    try {
      setImporting(true);
      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ products: importData }),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response result:', result);

      if (result.success) {
        if (result.errors && result.errors.length > 0) {
          console.log('Import errors:', result.errors);
          alert('Errores: ' + result.errors.join('\n'));
        } else {
          toast.success(`Se importaron ${result.imported} productos`);
        }
        setShowImportDialog(false);
        setPreviewData([]);
        setImportData([]);
        fetchProducts();
      } else {
        toast.error(result.error || 'Error al importar');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Error al importar productos');
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      setDeletingId(id);
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Producto eliminado');
        fetchProducts();
      } else {
        toast.error('Error al eliminar producto');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar producto');
    } finally {
      setDeletingId(null);
    }
  };

  const formatPrice = (price?: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price || 0);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={filters.linea}
          onChange={(e) => setFilters({ ...filters, linea: e.target.value })}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Todas las Líneas</option>
          {lines.map((line) => (
            <option key={line.id} value={line.name}>
              {line.name}
            </option>
          ))}
        </select>

        <select
          value={filters.categoria}
          onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Todas las Categorías</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={filters.coleccion}
          onChange={(e) => setFilters({ ...filters, coleccion: e.target.value })}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Todas las Colecciones</option>
          {collections.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>

        <select
          value={filters.tiempoEntrega}
          onChange={(e) => setFilters({ ...filters, tiempoEntrega: e.target.value })}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Todos los Tiempos</option>
          <option value="7">7 días</option>
          <option value="15">15 días</option>
          <option value="20">20 días</option>
        </select>

        <div className="flex gap-2">
          <Button onClick={onAddProduct} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv,.xlsx,.xls"
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importar
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Línea</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Colección</TableHead>
                <TableHead>Tono Color</TableHead>
                <TableHead>Precio/m²</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No hay productos
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {product.images && product.images.length > 0 ? (
                          <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        ) : (
                          <Package className="h-5 w-5 text-gray-400" />
                        )}
                        <span className="line-clamp-1">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.lineaName ? (
                        <Badge variant="secondary">{product.lineaName}</Badge>
                      ) : product.linea ? (
                        <Badge variant="secondary">{product.linea}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{product.categoria || product.categoryId}</TableCell>
                    <TableCell>{product.coleccion || '-'}</TableCell>
                    <TableCell>{product.tonoColor || '-'}</TableCell>
                    <TableCell>{formatPrice(product.precioBaseM2)}</TableCell>
                    <TableCell>{product.tiempoEntrega} días</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
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
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar Producto</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que deseas eliminar "{product.name}"? Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProduct(product.id)}
                                className="bg-red-500 hover:bg-red-600 text-white"
                                disabled={deletingId === product.id}
                              >
                                {deletingId === product.id ? 'Eliminando...' : 'Eliminar'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Mostrar</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-500">por página</span>
        </div>
        <div className="flex items-center gap-2">
          {!searchTerm && !filters.linea && !filters.categoria && !filters.coleccion && totalAll > 0 ? (
            <span className="text-sm text-gray-500 mr-4">
              Mostrando {((currentPage - 1) * limit) + 1}-{Math.min(currentPage * limit, totalAll)} de {totalAll} productos
            </span>
          ) : (
            <span className="text-sm text-gray-500 mr-4">
              Página {currentPage} de {totalPages}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar Productos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
              <p className="font-medium">Columnas esperadas en Excel:</p>
              <p className="mt-1">categoria, colección, linea, tono o color, precio base por m², precio ml jaladera, tiempo de entrega (días habiles), ancho mín (mm), ancho máx (mm), alto mín (mm), alto máx (mm), ancho mín_fr (mm), ancho máx_fr (mm), alto mín_fr (mm), alto máx_fr (mm)</p>
            </div>
            
            {previewData.length > 0 && (
              <div className="max-h-64 overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nombre</TableHead>
                      <TableHead className="text-xs">Línea</TableHead>
                      <TableHead className="text-xs">Categoría</TableHead>
                      <TableHead className="text-xs">Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs">{row.name}</TableCell>
                        <TableCell className="text-xs">{row.linea}</TableCell>
                        <TableCell className="text-xs">{row.categoria}</TableCell>
                        <TableCell className="text-xs">{row.precioBaseM2}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowImportDialog(false); setPreviewData([]); setImportData([]); }}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={importing || importData.length === 0}>
                {importing ? 'Importando...' : `Importar ${importData.length} productos`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
