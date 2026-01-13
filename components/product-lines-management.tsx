
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface ProductLine {
    id: string;
    name: string;
    description?: string;
    code?: string;
    isActive: boolean;
    sortOrder: number;
    _count: {
        products: number;
        tones: number;
    };
}

export default function ProductLinesManagement() {
    const [lines, setLines] = useState<ProductLine[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingLine, setEditingLine] = useState<ProductLine | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        code: '',
        isActive: true,
        sortOrder: 0
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchLines();
    }, []);

    const fetchLines = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/lines');
            if (response.ok) {
                const data = await response.json();
                setLines(data.data);
            } else {
                toast.error('Error al cargar las líneas');
            }
        } catch (error) {
            console.error('Error fetching lines:', error);
            toast.error('Error al cargar las líneas');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (line?: ProductLine) => {
        if (line) {
            setEditingLine(line);
            setFormData({
                name: line.name,
                description: line.description || '',
                code: line.code || '',
                isActive: line.isActive,
                sortOrder: line.sortOrder
            });
        } else {
            setEditingLine(null);
            setFormData({
                name: '',
                description: '',
                code: '',
                isActive: true,
                sortOrder: lines.length * 10
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingLine(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('El nombre es requerido');
            return;
        }

        try {
            setSubmitting(true);
            const url = editingLine ? `/api/admin/lines/${editingLine.id}` : '/api/admin/lines';
            const method = editingLine ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success(editingLine ? 'Línea actualizada' : 'Línea creada');
                fetchLines();
                handleCloseDialog();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Error al guardar');
            }
        } catch (error) {
            toast.error('Error al guardar');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/admin/lines/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success('Línea eliminada');
                fetchLines();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Error al eliminar');
            }
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-semibold">Líneas de Producto</h3>
                    <p className="text-gray-600">Configura las líneas base para el Kit Wizard</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Nueva Línea
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <p>Cargando...</p>
                ) : lines.map((line) => (
                    <Card key={line.id}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{line.name}</CardTitle>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(line)}><Edit className="h-4 w-4" /></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" disabled={line._count.products > 0}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>¿Eliminar línea?</AlertDialogTitle><AlertDialogDescription>Esta acción eliminará "{line.name}".</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(line.id)} className="bg-red-600">Eliminar</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-2">{line.description || 'Sin descripción'}</p>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant={line.isActive ? 'default' : 'secondary'}>{line.isActive ? 'Activa' : 'Inactiva'}</Badge>
                                <Badge variant="outline">{line._count.tones} Tonos</Badge>
                                <Badge variant="outline">{line._count.products} Productos</Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingLine ? 'Editar Línea' : 'Nueva Línea'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><Label>Nombre *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                        <div><Label>Descripción</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Código</Label><Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} /></div>
                            <div><Label>Orden</Label><Input type="number" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })} /></div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                            <Button type="submit" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
