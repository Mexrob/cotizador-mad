
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import ProductImageUpload from '@/components/product-image-upload';
import { toast } from 'sonner';

interface HandleModel {
    id: string;
    name: string;
    model?: string;
    finish?: string;
    price: number;
    priceUnit: string;
    imageUrl?: string | null;
    isActive?: boolean;
}

export default function HandleModelsManagement() {
    const [handles, setHandles] = useState<HandleModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingHandle, setEditingHandle] = useState<HandleModel | null>(null);
    const [formData, setFormData] = useState({
        name: '', price: 0, priceUnit: 'ml', sortOrder: 0, imageUrl: ''
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
                name: handle.name,
                price: Number(handle.price),
                priceUnit: handle.priceUnit || 'ml',
                sortOrder: 0,
                imageUrl: handle.imageUrl || ''
            });
        } else {
            setEditingHandle(null);
            setFormData({ name: '', price: 0, priceUnit: 'ml', sortOrder: 0, imageUrl: '' });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.price) {
            toast.error('Nombre y precio son obligatorios');
            return;
        }
        try {
            setSubmitting(true);
            const url = editingHandle ? `/api/admin/handles/${editingHandle.id}` : '/api/admin/handles';
            const res = await fetch(url, {
                method: editingHandle ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Guardado');
                fetchHandles();
                setDialogOpen(false);
                setEditingHandle(null);
                setFormData({ name: '', price: 0, priceUnit: 'ml', sortOrder: 0, imageUrl: '' });
            } else {
                toast.error(data.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('Error de conexión');
        } finally {
            setSubmitting(false);
        }
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
                            {handle.imageUrl && (
                                <div className="relative w-full h-32 mb-4 rounded-md overflow-hidden bg-gray-100">
                                    <Image 
                                        src={handle.imageUrl} 
                                        alt={handle.name} 
                                        fill 
                                        className="object-cover" 
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                </div>
                            )}
                            <div className="text-sm space-y-1 text-gray-600 mb-2">
                                <p className="font-bold text-green-600">${Number(handle.price)} / ml</p>
                            </div>
                            <Badge variant={handle.isActive ? 'default' : 'secondary'}>
                                {handle.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
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
                        <div><Label>Nombre *</Label><Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                        
                        <div>
                            <Label className="mb-2 block">Imagen</Label>
                            <ProductImageUpload
                                images={formData.imageUrl ? [formData.imageUrl] : []}
                                onImagesChange={(imgs) => setFormData({ ...formData, imageUrl: imgs[0] || '' })}
                                maxImages={1}
                            />
                        </div>

                        <div><Label>Precio metro lineal *</Label><Input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} /></div>
                        <DialogFooter><Button type="submit" disabled={submitting}>Guardar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
