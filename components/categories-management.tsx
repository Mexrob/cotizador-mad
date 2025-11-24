
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Folder, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  status: string;
  parentId?: string;
  parent?: { name: string } | null;
  children?: Category[];
  _count: {
    products: number;
  };
}

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    status: 'ACTIVE'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories?includeInactive=true');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        toast.error('Error al cargar las categorías');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        parentId: category.parentId || '',
        status: category.status
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        parentId: '',
        status: 'ACTIVE'
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      parentId: '',
      status: 'ACTIVE'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      setSubmitting(true);
      
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null
        }),
      });

      if (response.ok) {
        toast.success(editingCategory ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente');
        fetchCategories();
        handleCloseDialog();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar la categoría');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Error al guardar la categoría');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Categoría eliminada exitosamente');
        fetchCategories();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar la categoría');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Error al eliminar la categoría');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-600">Activa</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Inactiva</Badge>;
      case 'DISCONTINUED':
        return <Badge variant="destructive">Descontinuada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const rootCategories = categories.filter(cat => !cat.parentId);
  const getSubcategories = (parentId: string) => categories.filter(cat => cat.parentId === parentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Gestión de Categorías</h3>
          <p className="text-gray-600">Organiza los productos en categorías</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Categorías ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-module-black"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No hay categorías configuradas</p>
              <Button onClick={() => handleOpenDialog()} className="mt-4">
                Crear primera categoría
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {rootCategories.map((category) => (
                <div key={category.id} className="space-y-1">
                  {/* Parent Category */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <FolderOpen className="h-5 w-5 text-module-black" />
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-sm text-gray-500">{category.description}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusBadge(category.status)}
                          <Badge variant="outline">
                            {category._count.products} productos
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={category._count.products > 0 || getSubcategories(category.id).length > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. La categoría "{category.name}" será eliminada permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Subcategories */}
                  {getSubcategories(category.id).map((subcategory) => (
                    <div key={subcategory.id} className="flex items-center justify-between p-3 rounded-lg border ml-8 bg-white">
                      <div className="flex items-center space-x-3">
                        <Folder className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{subcategory.name}</p>
                          {subcategory.description && (
                            <p className="text-sm text-gray-500">{subcategory.description}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusBadge(subcategory.status)}
                            <Badge variant="outline">
                              {subcategory._count.products} productos
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(subcategory)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={subcategory._count.products > 0}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar subcategoría?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. La subcategoría "{subcategory.name}" será eliminada permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCategory(subcategory.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Modifica los datos de la categoría existente.'
                : 'Crea una nueva categoría para organizar los productos.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la categoría"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="parentId">Categoría Padre</Label>
              <Select value={formData.parentId || "all"} onValueChange={(value) => setFormData({ ...formData, parentId: value === "all" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin categoría padre (categoría principal)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Sin categoría padre</SelectItem>
                  {rootCategories
                    .filter(cat => !editingCategory || cat.id !== editingCategory.id)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activa</SelectItem>
                  <SelectItem value="INACTIVE">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Guardando...' : (editingCategory ? 'Actualizar' : 'Crear')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
