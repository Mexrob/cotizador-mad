
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface BackFace {
    id: string;
    name: string;
    description?: string;
    priceAdjustment: number;
    isTwoSided: boolean;
    isActive: boolean;
    sortOrder: number;
}

export default function BackFacesManagement() {
    const [faces, setFaces] = useState<BackFace[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingFace, setEditingFace] = useState<BackFace | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        priceAdjustment: 0,
        isTwoSided: false,
        isActive: true,
        sortOrder: 0
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchFaces(); }, []);

    const fetchFaces = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/back-faces');
            if (res.ok) {
                const data = await res.json();
                setFaces(data.data);
            }
        } finally { setLoading(false); }
    };

    const handleOpenDialog = (face?: BackFace) => {
        if (face) {
            setEditingFace(face);
            setFormData({
                name: face.name,
                description: face.description || '',
                priceAdjustment: Number(face.priceAdjustment),
                isTwoSided: face.isTwoSided,
                isActive: face.isActive,
                sortOrder: face.sortOrder
            });
        } else {
            setEditingFace(null);
            setFormData({
                name: '',
                description: '',
                priceAdjustment: 0,
                isTwoSided: false,
                isActive: true,
                sortOrder: faces.length * 10
            });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const url = editingFace ? `/api/admin/back-faces/${editingFace.id}` : '/api/admin/back-faces';
            const res = await fetch(url, {
                method: editingFace ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                toast.success('Guardado');
                fetchFaces();
                setDialogOpen(false);
            } else {
                const errorData = await res.json().catch(() => ({}));
                toast.error(errorData.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('Error de conexión');
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/back-faces/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success('Eliminado');
                fetchFaces();
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
                <div>
                    <h3 className="text-xl font-semibold">Caras Traseras</h3>
                    <p className="text-gray-600">Gestión de acabados para la cara trasera (Kit Wizard)</p>
                </div>
                <Button onClick={() => handleOpenDialog()}><Plus className="h-4 w-4 mr-2" /> Nueva Cara</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {faces.map(face => (
                    <Card key={face.id}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{face.name}</CardTitle>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(face)}><Edit className="h-4 w-4" /></Button>
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
                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente la opción "{face.name}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(face.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                    Eliminar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-2">{face.description || 'Sin descripción'}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline">Adj. Precio: ${Number(face.priceAdjustment)}</Badge>
                                {face.isTwoSided && <Badge variant="default" className="bg-blue-600">2 Caras</Badge>}
                                {!face.isActive && <Badge variant="secondary">Inactivo</Badge>}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingFace ? 'Editar Cara Trasera' : 'Nueva Cara Trasera'}</DialogTitle>
                        <DialogDescription>
                            Configure los detalles del acabado para el reverso de la puerta.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><Label>Nombre *</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Blanca, Dos Caras" /></div>
                        <div><Label>Descripción</Label><Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Adj. Precio ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={isNaN(formData.priceAdjustment) ? '' : formData.priceAdjustment}
                                    onChange={e => {
                                        const val = parseFloat(e.target.value);
                                        setFormData({ ...formData, priceAdjustment: isNaN(val) ? 0 : val });
                                    }}
                                />
                            </div>
                            <div>
                                <Label>Orden</Label>
                                <Input
                                    type="number"
                                    value={isNaN(formData.sortOrder) ? '' : formData.sortOrder}
                                    onChange={e => {
                                        const val = parseInt(e.target.value);
                                        setFormData({ ...formData, sortOrder: isNaN(val) ? 0 : val });
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="isTwoSided" checked={formData.isTwoSided} onCheckedChange={(checked) => setFormData({ ...formData, isTwoSided: !!checked })} />
                                <Label htmlFor="isTwoSided">Es "Dos Caras"</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })} />
                                <Label htmlFor="isActive">Activo</Label>
                            </div>
                        </div>
                        <DialogFooter><Button type="submit" disabled={submitting}>Guardar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
