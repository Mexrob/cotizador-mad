
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';

const execAsync = promisify(exec);
const fsPromises = fs.promises;

export const dynamic = 'force-dynamic';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUPS = 10;

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

async function createBackupNotification(title: string, message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          title,
          message,
          type,
          isRead: false
        }))
      });
    }
  } catch (error) {
    console.error('Error creating backup notification:', error);
  }
}

async function ensureBackupDir() {
  try {
    await fsPromises.access(BACKUP_DIR);
  } catch {
    await fsPromises.mkdir(BACKUP_DIR, { recursive: true });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function getBackupFiles(): Promise<BackupInfo[]> {
  try {
    await ensureBackupDir();
    const entries = await fsPromises.readdir(BACKUP_DIR, { withFileTypes: true });
    
    const backups: BackupInfo[] = [];
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('respaldo_')) {
        const backupPath = path.join(BACKUP_DIR, entry.name);
        const stats = await fsPromises.stat(backupPath);
        
        let hasDatabase = false;
        let hasCode = false;
        let hasImages = false;
        
        try {
          const files = await fsPromises.readdir(backupPath);
          hasDatabase = files.some(f => f.endsWith('.sql') || f.endsWith('.sql.gz'));
          hasCode = files.some(f => f.startsWith('codigo_') && f.endsWith('.tar.gz'));
          hasImages = files.some(f => f.startsWith('imagenes_') && f.endsWith('.tar.gz'));
        } catch (e) {
          // Ignore errors reading directory
        }

        const nameMatch = entry.name.match(/respaldo_(\d{8}_\d{6})/);
        const dateStr = nameMatch ? nameMatch[1] : stats.mtime.toISOString();

        let totalSize = 0;
        try {
          const files = await fsPromises.readdir(backupPath);
          for (const file of files) {
            const fileStats = await fsPromises.stat(path.join(backupPath, file));
            totalSize += fileStats.size;
          }
        } catch (e) {
          // Ignore
        }

        backups.push({
          id: entry.name,
          name: `Respaldo ${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)} ${dateStr.slice(9, 11)}:${dateStr.slice(11, 13)}:${dateStr.slice(13, 15)}`,
          date: stats.mtime.toISOString(),
          size: totalSize,
          sizeFormatted: formatBytes(totalSize),
          hasDatabase,
          hasCode,
          hasImages
        });
      }
    }

    return backups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error getting backup files:', error);
    return [];
  }
}

async function cleanupOldBackups() {
  try {
    const backups = await getBackupFiles();
    if (backups.length > MAX_BACKUPS) {
      const toDelete = backups.slice(MAX_BACKUPS);
      for (const backup of toDelete) {
        const backupPath = path.join(BACKUP_DIR, backup.id);
        await fsPromises.rm(backupPath, { recursive: true, force: true });
        console.log(`Deleted old backup: ${backup.id}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
  }
}

async function createBackup(options: { database?: boolean; code?: boolean; images?: boolean }) {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15);
  const backupDir = path.join(BACKUP_DIR, `respaldo_${timestamp}`);
  
  await ensureBackupDir();
  await fsPromises.mkdir(backupDir, { recursive: true });

  if (options.database) {
    try {
      const dbBackupPath = path.join(backupDir, `cotizador_mad_${timestamp}.sql`);
      
      // Use internal Docker network (postgres:5432) instead of localhost
      const dbHost = 'postgres';
      const dbPort = '5432';
      const dbUser = process.env.POSTGRES_USER || 'cotizador';
      const dbName = process.env.POSTGRES_DB || 'cotizador_mad';
      const dbPassword = process.env.POSTGRES_PASSWORD || 'changeme123';
      
      const { stdout, stderr } = await execAsync(
        `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${dbBackupPath}"`,
        { 
          encoding: 'utf8',
          env: { ...process.env, PGPASSWORD: dbPassword }
        }
      );
      
      // If pg_dump writes to stdout instead of file
      if (!fs.existsSync(dbBackupPath) && stdout) {
        await fsPromises.writeFile(dbBackupPath, stdout);
      }
      
      console.log('Database backup created');
    } catch (error) {
      console.error('Database backup failed:', error);
      throw new Error('Error al respaldar la base de datos');
    }
  }

  if (options.code) {
    try {
      const codeBackupPath = path.join(backupDir, `codigo_${timestamp}.tar.gz`);
      await execAsync(
        `tar -czf "${codeBackupPath}" --exclude='node_modules' --exclude='.next' --exclude='backups' --exclude='.git' --exclude='public/uploads' .`,
        { cwd: process.cwd() }
      );
      console.log('Code backup created');
    } catch (error) {
      console.error('Code backup failed:', error);
    }
  }

  if (options.images) {
    try {
      const uploadsDir = path.join(process.cwd(), 'public/uploads');
      const imagesBackupPath = path.join(backupDir, `imagenes_${timestamp}.tar.gz`);
      
      const uploadsExist = fs.existsSync(uploadsDir);
      if (uploadsExist) {
        await execAsync(
          `tar -czf "${imagesBackupPath}" -C "${path.dirname(uploadsDir)}" uploads`,
          { cwd: process.cwd() }
        );
        console.log('Images backup created');
      } else {
        console.log('No images directory found, skipping');
      }
    } catch (error) {
      console.error('Images backup failed:', error);
    }
  }

  await cleanupOldBackups();
  
  return backupDir;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download');

    // Handle download request
    if (download) {
      const backupPath = path.join(BACKUP_DIR, download);
      
      // Security: prevent path traversal
      if (!backupPath.startsWith(BACKUP_DIR)) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
      }

      if (!fs.existsSync(backupPath)) {
        return NextResponse.json({ error: 'Respaldo no encontrado' }, { status: 404 });
      }

      // Create ZIP file
      const zipPath = path.join(BACKUP_DIR, `${download}.zip`);
      
      try {
        await execAsync(`cd "${backupPath}" && zip -r "${zipPath}" .`);
        
        // Read ZIP file
        const fileBuffer = await fsPromises.readFile(zipPath);
        
        // Clean up temp ZIP
        await fsPromises.unlink(zipPath);
        
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${download}.zip"`,
          },
        });
      } catch (error) {
        console.error('Error creating ZIP:', error);
        return NextResponse.json({ error: 'Error al crear ZIP' }, { status: 500 });
      }
    }

    // Default: list backups
    const backups = await getBackupFiles();
    return NextResponse.json({ 
      success: true, 
      data: backups 
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    return NextResponse.json(
      { success: false, error: 'Error al listar respaldos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { database = true, code = true, images = true } = body;

    if (!database && !code && !images) {
      return NextResponse.json(
        { success: false, error: 'Selecciona al menos un tipo de respaldo' },
        { status: 400 }
      );
    }

    const backupDir = await createBackup({ database, code, images });
    const backups = await getBackupFiles();

    await createBackupNotification(
      'Respaldo completado',
      `El respaldo se ha creado exitosamente: ${path.basename(backupDir)}`,
      'success'
    );

    return NextResponse.json({
      success: true,
      message: 'Respaldo creado exitosamente',
      data: backups
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    
    await createBackupNotification(
      'Error en respaldo',
      'Ha ocurrido un error al crear el respaldo. Revisa los logs del sistema.',
      'error'
    );
    
    return NextResponse.json(
      { success: false, error: 'Error al crear respaldo' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const backupId = searchParams.get('id');

    if (!backupId) {
      return NextResponse.json(
        { success: false, error: 'ID de respaldo requerido' },
        { status: 400 }
      );
    }

    const backupPath = path.join(BACKUP_DIR, backupId);
    
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json(
        { success: false, error: 'Respaldo no encontrado' },
        { status: 404 }
      );
    }

    await fsPromises.rm(backupPath, { recursive: true, force: true });

    return NextResponse.json({
      success: true,
      message: 'Respaldo eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar respaldo' },
      { status: 500 }
    );
  }
}
