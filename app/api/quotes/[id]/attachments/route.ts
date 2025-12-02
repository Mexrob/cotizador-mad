import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { generateUniqueFilename, validateFile } from '@/lib/file-utils'

export const dynamic = 'force-dynamic'

// POST - Upload file
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Get quote and verify ownership
        const quote = await prisma.quote.findUnique({
            where: { id: params.id },
            select: {
                id: true,
                userId: true,
                attachments: true,
                quoteNumber: true,
                customerName: true,
                totalAmount: true
            }
        })

        if (!quote) {
            return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
        }

        // Check permissions
        if (session.user.role !== 'ADMIN' && quote.userId !== session.user.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        // Check attachment limit (max 10 files)
        if (quote.attachments && quote.attachments.length >= 10) {
            return NextResponse.json(
                { error: 'Límite de archivos alcanzado (máximo 10)' },
                { status: 400 }
            )
        }

        // Get file from form data
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
        }

        // Validate file
        const validation = validateFile(file)
        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 })
        }

        // Create directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'quotes', params.id)
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        // Generate unique filename
        const uniqueFilename = generateUniqueFilename(file.name)
        const filePath = path.join(uploadDir, uniqueFilename)

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer()
        const buffer = new Uint8Array(bytes)
        await writeFile(filePath, buffer)

        // Generate URL (relative to public folder)
        const fileUrl = `/uploads/quotes/${params.id}/${uniqueFilename}`

        // Update quote attachments
        const updatedAttachments = [...(quote.attachments || []), fileUrl]
        await prisma.quote.update({
            where: { id: params.id },
            data: { attachments: updatedAttachments }
        })

        // Create notification for admins
        // Only if the uploader is NOT an admin (i.e., it's the client)
        if (session.user.role !== 'ADMIN') {
            const admins = await prisma.user.findMany({
                where: { role: 'ADMIN' },
                select: { id: true }
            })

            if (admins.length > 0) {
                await prisma.notification.createMany({
                    data: admins.map(admin => ({
                        userId: admin.id,
                        title: 'Nuevo comprobante de pago',
                        message: `El cliente ${quote.customerName} ha subido un archivo a la cotización #${quote.quoteNumber}`,
                        type: 'payment_proof',
                        link: `/quotes/${quote.id}`,
                        isRead: false
                    }))
                })
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                url: fileUrl,
                filename: file.name,
                size: file.size,
                type: file.type
            }
        })
    } catch (error) {
        console.error('File upload error:', error)
        return NextResponse.json(
            { error: 'Error al subir el archivo' },
            { status: 500 }
        )
    }
}

// DELETE - Remove file
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Get quote and verify ownership
        const quote = await prisma.quote.findUnique({
            where: { id: params.id },
            select: { id: true, userId: true, attachments: true }
        })

        if (!quote) {
            return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
        }

        // Check permissions
        if (session.user.role !== 'ADMIN' && quote.userId !== session.user.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        // Get file URL from request body
        const { fileUrl } = await request.json()

        if (!fileUrl) {
            return NextResponse.json({ error: 'No se proporcionó la URL del archivo' }, { status: 400 })
        }

        // Verify file belongs to this quote
        if (!quote.attachments || !quote.attachments.includes(fileUrl)) {
            return NextResponse.json({ error: 'Archivo no encontrado en esta cotización' }, { status: 404 })
        }

        // Delete file from filesystem
        const filePath = path.join(process.cwd(), 'public', fileUrl)
        try {
            if (existsSync(filePath)) {
                await unlink(filePath)
            }
        } catch (err) {
            console.error('Error deleting file from filesystem:', err)
            // Continue even if file deletion fails
        }

        // Update quote attachments
        const updatedAttachments = quote.attachments.filter(url => url !== fileUrl)
        await prisma.quote.update({
            where: { id: params.id },
            data: { attachments: updatedAttachments }
        })

        return NextResponse.json({
            success: true,
            message: 'Archivo eliminado correctamente'
        })
    } catch (error) {
        console.error('File deletion error:', error)
        return NextResponse.json(
            { error: 'Error al eliminar el archivo' },
            { status: 500 }
        )
    }
}
