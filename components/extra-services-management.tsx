
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface ExtraService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

export default function ExtraServicesManagement() {
  const [extras, setExtras] = useState<ExtraService[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExtra, setEditingExtra] = useState<ExtraService | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    isActive: true,
    sortOrder: 0
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExtras();
  }, []);

  const fetchExtras = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/extra-services');
      if (response.ok) {
        const data = await response.json();
        setExtras(data.data);
      } else {
        toast.error('Error al cargar los servicios extra');
      }
    } catch (error) {
      console.error('Error fetching extra services:', error);
      toast.error('Error al cargar los servicios extra');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (extra?: ExtraService) => {
    if (extra) {
      setEditingExtra(extra);
      setFormData({
        name: extra.name,
        description: extra.description || '',
        price: extra.price,
        isActive: extra.isActive,
        sortOrder: extra.sortOrder
      });
    } else {
      setEditingExtra(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        isActive: true,
        sortOrder: extras.length
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingExtra(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      isActive: true,
      sortOrder: 0
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const url = editingExtra ? `/api/admin/extra-services/${editingExtra.id}` : '/api/admin/extra-services';
      const method = editingExtra ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingExtra ? 'Servicio extra actualizado' : 'Servicio extra creado');
        handleCloseDialog();
        fetchExtras();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving extra service:', error);
      toast.error('Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/extra-services/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Servicio extra eliminado');
        fetchExtras();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      console.error('Error deleting extra service:', error);
      toast.error('Error al eliminar');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Servicios Extra</h2>
          <p className="text-muted-foreground">Administra los servicios adicionales disponibles para cotizaciones</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : extras.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay servicios extra configurados
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {extras.map((extra) => (
            <Card key={extra.id} className={!extra.isActive ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{extra.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(extra)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar Servicio Extra</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar &quot;{extra.name}&quot;?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(extra.id)} className="bg-red-500">
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-lg font-bold text-green-600">
                  <DollarSign className="h-5 w-5" />
                  {formatPrice(extra.price)}
                </div>
                {extra.description && (
                  <p className="text-sm text-muted-foreground mt-2">{extra.description}</p>
                )}
                {!extra.isActive && (
                  <span className="inline-block mt-2 text-xs bg-gray-100 px-2 py-1 rounded">Inactivo</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExtra ? 'Editar Servicio Extra' : 'Nuevo Servicio Extra'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Instalación, Medición, etc."
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del servicio..."
              />
            </div>
            <div>
              <Label htmlFor="price">Precio (MXN) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="isActive">Activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !formData.name}>
              {submitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
