
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface ShippingCost {
  id: string;
  zone: string;
  description: string | null;
  cost: number;
  freeFrom: number | null;
  isActive: boolean;
  sortOrder: number;
}

export default function ShippingCostsManagement() {
  const [shippingCosts, setShippingCosts] = useState<ShippingCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<ShippingCost | null>(null);
  const [formData, setFormData] = useState({
    zone: '',
    description: '',
    cost: 0,
    freeFrom: null as number | null,
    isActive: true,
    sortOrder: 0
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchShippingCosts();
  }, []);

  const fetchShippingCosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/shipping-costs');
      if (response.ok) {
        const data = await response.json();
        setShippingCosts(data.data);
      } else {
        toast.error('Error al cargar los costos de envío');
      }
    } catch (error) {
      console.error('Error fetching shipping costs:', error);
      toast.error('Error al cargar los costos de envío');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (cost?: ShippingCost) => {
    if (cost) {
      setEditingCost(cost);
      setFormData({
        zone: cost.zone,
        description: cost.description || '',
        cost: cost.cost,
        freeFrom: cost.freeFrom,
        isActive: cost.isActive,
        sortOrder: cost.sortOrder
      });
    } else {
      setEditingCost(null);
      setFormData({
        zone: '',
        description: '',
        cost: 0,
        freeFrom: null,
        isActive: true,
        sortOrder: shippingCosts.length
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCost(null);
    setFormData({
      zone: '',
      description: '',
      cost: 0,
      freeFrom: null,
      isActive: true,
      sortOrder: 0
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const url = editingCost ? `/api/admin/shipping-costs/${editingCost.id}` : '/api/admin/shipping-costs';
      const method = editingCost ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingCost ? 'Costo de envío actualizado' : 'Costo de envío creado');
        handleCloseDialog();
        fetchShippingCosts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving shipping cost:', error);
      toast.error('Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/shipping-costs/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Costo de envío eliminado');
        fetchShippingCosts();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      console.error('Error deleting shipping cost:', error);
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
          <h2 className="text-2xl font-bold">Costos de Envío</h2>
          <p className="text-muted-foreground">Administra las zonas y costos de envío para cotizaciones</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Zona
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : shippingCosts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay costos de envío configurados
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shippingCosts.map((cost) => (
            <Card key={cost.id} className={!cost.isActive ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    {cost.zone}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(cost)}>
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
                          <AlertDialogTitle>Eliminar Costo de Envío</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar la zona &quot;{cost.zone}&quot;?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(cost.id)} className="bg-red-500">
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-lg font-bold text-blue-600">
                    {formatPrice(cost.cost)}
                  </div>
                  {cost.freeFrom && cost.freeFrom > 0 && (
                    <p className="text-sm text-green-600">
                      Envío gratis desde {formatPrice(cost.freeFrom)}
                    </p>
                  )}
                  {cost.description && (
                    <p className="text-sm text-muted-foreground">{cost.description}</p>
                  )}
                  {!cost.isActive && (
                    <span className="inline-block mt-2 text-xs bg-gray-100 px-2 py-1 rounded">Inactivo</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCost ? 'Editar Costo de Envío' : 'Nueva Zona de Envío'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="zone">Zona *</Label>
              <Input
                id="zone"
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                placeholder="Ej: Zona Metropolitana, Interior del país, etc."
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción de la zona..."
              />
            </div>
            <div>
              <Label htmlFor="cost">Costo de envío (MXN) *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="freeFrom">Envío gratis desde (MXN)</Label>
              <Input
                id="freeFrom"
                type="number"
                step="0.01"
                value={formData.freeFrom || ''}
                onChange={(e) => setFormData({ ...formData, freeFrom: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="Dejar vacío si no aplica"
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
            <Button onClick={handleSubmit} disabled={submitting || !formData.zone}>
              {submitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
