
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface ProductTone {
    id: string;
    name: string;
    lineId: string;
    line: { name: string };
    priceAdjustment: number;
    twoCarsAdjustment: number;
    supportsTwoCars: boolean;
    supportsHorizontalGrain: boolean;
    supportsVerticalGrain: boolean;
    isActive: boolean;
    sortOrder: number;
}

export default function ProductTonesManagement() {
    const [tones, setTones] = useState<ProductTone[]>([]);
    const [lines, setLines] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTone, setEditingTone] = useState<ProductTone | null>(null);
    const [selectedLineFilter, setSelectedLineFilter] = useState<string>('all');

    const [formData, setFormData] = useState({
        name: '',
        lineId: '',
        priceAdjustment: 0,
        twoCarsAdjustment: 0,
        supportsTwoCars: false,
        supportsHorizontalGrain: false,
        supportsVerticalGrain: false,
        isActive: true,
        sortOrder: 0
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTones();
        fetchLines();
    }, [selectedLineFilter]);

    const fetchLines = async () => {
        const res = await fetch('/api/admin/lines');
        if (res.ok) {
            const data = await res.json();
            setLines(data.data);
        }
    };

    const fetchTones = async () => {
        try {
            setLoading(true);
            const url = selectedLineFilter !== 'all' ? `/api/admin/tones?lineId=${selectedLineFilter}` : '/api/admin/tones';
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setTones(data.data);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (tone?: ProductTone) => {
        if (tone) {
            setEditingTone(tone);
            setFormData({
                name: tone.name,
                lineId: tone.lineId,
                priceAdjustment: Number(tone.priceAdjustment),
                twoCarsAdjustment: Number(tone.twoCarsAdjustment),
                supportsTwoCars: tone.supportsTwoCars,
                supportsHorizontalGrain: tone.supportsHorizontalGrain,
                supportsVerticalGrain: tone.supportsVerticalGrain,
                isActive: tone.isActive,
                sortOrder: tone.sortOrder
            });
        } else {
            setEditingTone(null);
            setFormData({
                name: '',
                lineId: selectedLineFilter !== 'all' ? selectedLineFilter : '',
                priceAdjustment: 0,
                twoCarsAdjustment: 0,
                supportsTwoCars: false,
                supportsHorizontalGrain: false,
                supportsVerticalGrain: false,
                isActive: true,
                sortOrder: 0
            });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const url = editingTone ? `/api/admin/tones/${editingTone.id}` : '/api/admin/tones';
            const response = await fetch(url, {
                method: editingTone ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                toast.success('Guardado correctamente');
                fetchTones();
                setDialogOpen(false);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Error response:', errorData);
                toast.error(errorData.error || 'Error al guardar');
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
            const response = await fetch(`/api/admin/tones/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success('Tono eliminado correctamente');
                fetchTones();
            } else {
                const errorData = await response.json().catch(() => ({}));
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
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-semibold">Tonos y Colores</h3>
                    <Select value={selectedLineFilter} onValueChange={setSelectedLineFilter}>
                        <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar por línea" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las líneas</SelectItem>
                            {lines.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={() => handleOpenDialog()}><Plus className="h-4 w-4 mr-2" /> Nuevo Tono</Button>
            </div>

            <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-xs uppercase font-medium">
                        <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Línea</th>
                            <th className="px-4 py-3">Precio Adj</th>
                            <th className="px-4 py-3">Opciones</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {tones.map((tone) => (
                            <tr key={tone.id}>
                                <td className="px-4 py-3 font-medium">{tone.name}</td>
                                <td className="px-4 py-3">{tone.line.name}</td>
                                <td className="px-4 py-3">${Number(tone.priceAdjustment)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-1">
                                        {tone.supportsTwoCars && <Badge variant="outline" className="text-[10px]">2 Caras</Badge>}
                                        {(tone.supportsHorizontalGrain || tone.supportsVerticalGrain) && <Badge variant="outline" className="text-[10px]">Veta</Badge>}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(tone)}><Edit className="h-4 w-4" /></Button>
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
                                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el tono "{tone.name}".
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(tone.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                        Eliminar
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingTone ? 'Editar Tono' : 'Nuevo Tono'}</DialogTitle>
                        <DialogDescription>
                            Configure los ajustes de precio y compatibilidad para este tono de producto.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><Label>Nombre *</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                        <div>
                            <Label>Línea *</Label>
                            <Select value={formData.lineId} onValueChange={v => setFormData({ ...formData, lineId: v })}>
                                <SelectTrigger><SelectValue placeholder="Selecciona una línea" /></SelectTrigger>
                                <SelectContent>{lines.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Adj. Precio</Label><Input type="number" value={formData.priceAdjustment} onChange={e => setFormData({ ...formData, priceAdjustment: parseFloat(e.target.value) })} /></div>
                            <div><Label>Adj. 2 Caras</Label><Input type="number" value={formData.twoCarsAdjustment} onChange={e => setFormData({ ...formData, twoCarsAdjustment: parseFloat(e.target.value) })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2"><Checkbox checked={formData.supportsTwoCars} onCheckedChange={c => setFormData({ ...formData, supportsTwoCars: !!c })} /><Label>Soporta 2 Caras</Label></div>
                            <div className="flex items-center gap-2"><Checkbox checked={formData.supportsHorizontalGrain} onCheckedChange={c => setFormData({ ...formData, supportsHorizontalGrain: !!c })} /><Label>Veta Horiz.</Label></div>
                            <div className="flex items-center gap-2"><Checkbox checked={formData.supportsVerticalGrain} onCheckedChange={c => setFormData({ ...formData, supportsVerticalGrain: !!c })} /><Label>Veta Vert.</Label></div>
                        </div>
                        <DialogFooter><Button type="submit" disabled={submitting}>Guardar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
