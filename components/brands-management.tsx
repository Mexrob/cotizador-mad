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

interface Brand {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    website?: string;
    status: string;
    sortOrder: number;
}

export default function BrandsManagement() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', imageUrl: '', website: '', status: 'ACTIVE', sortOrder: 0 });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchBrands(); }, []);

    const fetchBrands = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/brands');
            if (res.ok) {
                const data = await res.json();
                setBrands(data.data);
            }
        } finally { setLoading(false); }
    };

    const handleOpenDialog = (brand?: Brand) => {
        if (brand) {
            setEditingBrand(brand);
            setFormData({ 
                name: brand.name, 
                description: brand.description || '', 
                imageUrl: brand.imageUrl || '',
                website: brand.website || '',
                status: brand.status, 
                sortOrder: brand.sortOrder 
            });
        } else {
            setEditingBrand(null);
            setFormData({ name: '', description: '', imageUrl: '', website: '', status: 'ACTIVE', sortOrder: 0 });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const url = editingBrand ? `/api/admin/brands/${editingBrand.id}` : '/api/admin/brands';
            const res = await fetch(url, {
                method: editingBrand ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Guardado');
                fetchBrands();
                setDialogOpen(false);
                setEditingBrand(null);
                setFormData({ name: '', description: '', imageUrl: '', website: '', status: 'ACTIVE', sortOrder: 0 });
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
            const res = await fetch(`/api/admin/brands/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success('Eliminado');
                fetchBrands();
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
                <div><h3 className="text-xl font-semibold">Marcas</h3><p className="text-gray-600">Gestión de marcas de productos</p></div>
                <Button onClick={() => handleOpenDialog()}><Plus className="h-4 w-4 mr-2" /> Nueva Marca</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {brands.map(brand => (
                    <Card key={brand.id}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{brand.name}</CardTitle>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(brand)}><Edit className="h-4 w-4" /></Button>
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
                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente la marca "{brand.name}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(brand.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                    Eliminar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-2">{brand.description || 'Sin descripción'}</p>
                            <Badge variant={brand.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {brand.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBrand ? 'Editar Marca' : 'Nueva Marca'}</DialogTitle>
                        <DialogDescription>
                            {editingBrand ? 'Modifica los detalles de la marca existente.' : 'Agrega una nueva marca al catálogo.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><Label>Nombre *</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                        <div><Label>Descripción</Label><Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
                        <div><Label>URL del Logo</Label><Input value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="https://..." /></div>
                        <div><Label>Sitio Web</Label><Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://..." /></div>
                        <DialogFooter><Button type="submit" disabled={submitting}>Guardar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
