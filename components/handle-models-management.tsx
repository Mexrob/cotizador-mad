
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface HandleModel {
    id: string;
    name: string;
    model: string;
    finish: string;
    price: number;
    priceUnit: string;
    _count: { products: number };
}

export default function HandleModelsManagement() {
    const [handles, setHandles] = useState<HandleModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingHandle, setEditingHandle] = useState<HandleModel | null>(null);
    const [formData, setFormData] = useState({
        name: '', model: '', finish: '', price: 0, priceUnit: 'unit', sortOrder: 0
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchHandles(); }, []);

    const fetchHandles = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/handles');
            if (res.ok) {
                const data = await res.json();
                setHandles(data.data);
            }
        } finally { setLoading(false); }
    };

    const handleOpenDialog = (handle?: HandleModel) => {
        if (handle) {
            setEditingHandle(handle);
            setFormData({
                name: handle.name, model: handle.model, finish: handle.finish,
                price: Number(handle.price), priceUnit: handle.priceUnit, sortOrder: 0
            });
        } else {
            setEditingHandle(null);
            setFormData({ name: '', model: '', finish: '', price: 0, priceUnit: 'unit', sortOrder: 0 });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const url = editingHandle ? `/api/admin/handles/${editingHandle.id}` : '/api/admin/handles';
            const res = await fetch(url, {
                method: editingHandle ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                toast.success('Guardado');
                fetchHandles();
                setDialogOpen(false);
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error('Error response:', errorData);
                toast.error(errorData.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('Error de conexión');
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/handles/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Eliminado');
                fetchHandles();
            } else {
                const errorData = await res.json().catch(() => ({}));
                toast.error(errorData.error || 'Error al eliminar');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Error de conexión');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div><h3 className="text-xl font-semibold">Jaladeras</h3><p className="text-gray-600">Gestión de modelos de jaladera</p></div>
                <Button onClick={() => handleOpenDialog()}><Plus className="h-4 w-4 mr-2" /> Nueva Jaladera</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {handles.map(handle => (
                    <Card key={handle.id}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{handle.name}</CardTitle>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(handle)}><Edit className="h-4 w-4" /></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente la jaladera "{handle.name}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(handle.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                    Eliminar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm space-y-1 text-gray-600 mb-2">
                                <p>Modelo: {handle.model}</p>
                                <p>Acabado: {handle.finish}</p>
                                <p className="font-bold text-green-600">${Number(handle.price)} / {handle.priceUnit}</p>
                            </div>
                            <Badge variant="outline">{handle._count.products} Productos</Badge>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingHandle ? 'Editar Jaladera' : 'Nueva Jaladera'}</DialogTitle>
                        <DialogDescription>
                            {editingHandle ? 'Modifica los detalles de la jaladera seleccionada.' : 'Ingresa la información para el nuevo modelo de jaladera.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><Label>Nombre *</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Modelo *</Label><Input value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} /></div>
                            <div><Label>Acabado *</Label><Input value={formData.finish} onChange={e => setFormData({ ...formData, finish: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Precio *</Label><Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} /></div>
                            <div><Label>Unidad</Label><Input value={formData.priceUnit} onChange={e => setFormData({ ...formData, priceUnit: e.target.value })} /></div>
                        </div>
                        <DialogFooter><Button type="submit" disabled={submitting}>Guardar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
