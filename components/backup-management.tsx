'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Database,
  Code,
  Image,
  Download,
  Trash2,
  RefreshCw,
  HardDrive,
  Loader2,
  Archive
} from 'lucide-react';

interface BackupInfo {
  id: string;
  name: string;
  date: string;
  size: number;
  sizeFormatted: string;
  hasDatabase: boolean;
  hasCode: boolean;
  hasImages: boolean;
}

export default function BackupManagement() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [options, setOptions] = useState({
    database: true,
    code: true,
    images: true
  });

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/backup');
      const data = await response.json();
      if (data.success) {
        setBackups(data.data);
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('Error al cargar respaldos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!options.database && !options.code && !options.images) {
      toast.error('Selecciona al menos un tipo de respaldo');
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      const data = await response.json();
      
      if (data.success) {
        setBackups(data.data);
        toast.success('Respaldo creado exitosamente');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Error al crear respaldo');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este respaldo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/backup?id=${encodeURIComponent(backupId)}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        setBackups(backups.filter(b => b.id !== backupId));
        toast.success('Respaldo eliminado');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Error al eliminar respaldo');
    }
  };

  const handleDownloadBackup = async (backupId: string, backupName: string) => {
    try {
      toast.info('Preparando descarga...');
      
      const response = await fetch(`/api/admin/backup?download=${encodeURIComponent(backupId)}`);
      
      if (!response.ok) {
        throw new Error('Error al descargar respaldo');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backupId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Descarga iniciada');
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Error al descargar respaldo');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Create Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Crear Nuevo Respaldo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id="database"
                checked={options.database}
                onCheckedChange={(checked) => setOptions({ ...options, database: !!checked })}
              />
              <Label htmlFor="database" className="flex items-center gap-2 cursor-pointer">
                <Database className="w-4 h-4" />
                Base de Datos
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id="code"
                checked={options.code}
                onCheckedChange={(checked) => setOptions({ ...options, code: !!checked })}
              />
              <Label htmlFor="code" className="flex items-center gap-2 cursor-pointer">
                <Code className="w-4 h-4" />
                Código Fuente
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id="images"
                checked={options.images}
                onCheckedChange={(checked) => setOptions({ ...options, images: !!checked })}
              />
              <Label htmlFor="images" className="flex items-center gap-2 cursor-pointer">
                <Image className="w-4 h-4" />
                Imágenes
              </Label>
            </div>
          </div>
          
          <Button
            onClick={handleCreateBackup}
            disabled={creating}
            className="w-full"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando respaldo...
              </>
            ) : (
              <>
                <HardDrive className="w-4 h-4 mr-2" />
                Crear Respaldo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Backup List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Respaldos Existentes ({backups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay respaldos disponibles</p>
              <p className="text-sm">Crea un nuevo respaldo usando el formulario de arriba</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{backup.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(backup.date)} • {backup.sizeFormatted}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {backup.hasDatabase && (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          <Database className="w-3 h-3" />
                          DB
                        </span>
                      )}
                      {backup.hasCode && (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          <Code className="w-3 h-3" />
                          Código
                        </span>
                      )}
                      {backup.hasImages && (
                        <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          <Image className="w-3 h-3" />
                          Imágenes
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadBackup(backup.id, backup.name)}
                      className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBackup(backup.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
