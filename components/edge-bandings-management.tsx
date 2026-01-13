
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

interface EdgeBanding {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    sortOrder: number;
    _count: { products: number };
}

export default function EdgeBandingsManagement() {
    const [edges, setEdges] = useState<EdgeBanding[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEdge, setEditingEdge] = useState<EdgeBanding | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', isActive: true, sortOrder: 0 });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchEdges(); }, []);

    const fetchEdges = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/edge-bandings');
            if (res.ok) {
                const data = await res.json();
                setEdges(data.data);
            }
        } finally { setLoading(false); }
    };

    const handleOpenDialog = (edge?: EdgeBanding) => {
        if (edge) {
            setEditingEdge(edge);
            setFormData({ name: edge.name, description: edge.description || '', isActive: edge.isActive, sortOrder: edge.sortOrder });
        } else {
            setEditingEdge(null);
            setFormData({ name: '', description: '', isActive: true, sortOrder: 0 });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const url = editingEdge ? `/api/admin/edge-bandings/${editingEdge.id}` : '/api/admin/edge-bandings';
            const res = await fetch(url, {
                method: editingEdge ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                toast.success('Guardado');
                fetchEdges();
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
            const res = await fetch(`/api/admin/edge-bandings/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success('Eliminado');
                fetchEdges();
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
                <div><h3 className="text-xl font-semibold">Cubrecantos</h3><p className="text-gray-600">Gestión de tipos de cubrecanto</p></div>
                <Button onClick={() => handleOpenDialog()}><Plus className="h-4 w-4 mr-2" /> Nuevo Cubrecanto</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {edges.map(edge => (
                    <Card key={edge.id}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{edge.name}</CardTitle>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(edge)}><Edit className="h-4 w-4" /></Button>
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
                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente el cubrecanto "{edge.name}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(edge.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                    Eliminar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-2">{edge.description || 'Sin descripción'}</p>
                            <Badge variant="outline">{edge._count.products} Productos</Badge>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingEdge ? 'Editar Cubrecanto' : 'Nuevo Cubrecanto'}</DialogTitle>
                        <DialogDescription>
                            {editingEdge ? 'Modifica los detalles del cubrecanto existente.' : 'Agrega un nuevo tipo de cubrecanto al catálogo.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><Label>Nombre *</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                        <div><Label>Descripción</Label><Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
                        <DialogFooter><Button type="submit" disabled={submitting}>Guardar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
