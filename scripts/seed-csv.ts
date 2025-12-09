
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const csvPath = path.join(process.cwd(), 'productos - mad.csv')
    const fileContent = fs.readFileSync(csvPath, 'utf-8')

    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    })

    console.log(`Found ${records.length} records in CSV`)

    for (const record of records) {
        // 1. Upsert Category
        const categoryName = record['Categoria']
        const category = await prisma.category.upsert({
            where: { id: 'cat-' + categoryName.toLowerCase().replace(/\s+/g, '-') }, // Simple ID generation for stability
            update: {},
            create: {
                id: 'cat-' + categoryName.toLowerCase().replace(/\s+/g, '-'),
                name: categoryName,
                description: 'Imported from CSV',
            },
        })

        // 2. Upsert Product
        // Using "Colección" + "Categoria" as unique identifier logic for now, or just "Colección" if it's unique enough.
        // The CSV has "MAD" as Colección for all rows shown.
        // Let's use a combination or just a fixed slug.
        const collection = record['Colección']
        const productName = `${categoryName} ${collection}`
        const productSku = `${collection}-${categoryName}`.toUpperCase().replace(/\s+/g, '-')

        // Parse dimensions
        const minW = parseFloat(record['Ancho Mínimo (cm)']) * 10 // cm to mm
        const maxW = parseFloat(record['Ancho Máximo (cm)']) * 10
        const minH = parseFloat(record['Alto Mínimo (cm)']) * 10
        const maxH = parseFloat(record['Alto Máximo (cm)']) * 10
        const leadTime = parseInt(record['Tiempo de Entrega (días)']) || 7

        const product = await prisma.product.upsert({
            where: { sku: productSku },
            update: {
                minWidth: minW,
                maxWidth: maxW,
                minHeight: minH,
                maxHeight: maxH,
                leadTime: leadTime,
            },
            create: {
                name: productName,
                sku: productSku,
                categoryId: category.id,
                minWidth: minW,
                maxWidth: maxW,
                minHeight: minH,
                maxHeight: maxH,
                leadTime: leadTime,
                basePrice: 0, // Base price is 0, price comes from Tones
                isCustomizable: true,
            },
        })

        // 3. Upsert ProductLine
        const lineName = record['Linea']
        const lineCode = lineName.toUpperCase().replace(/\s+/g, '-')
        const line = await prisma.productLine.upsert({
            where: { name: lineName },
            update: {},
            create: {
                name: lineName,
                code: lineCode,
                isActive: true,
            },
        })

        // Link Product to Line (Optional, but good for wizard)
        // If the product supports multiple lines, we might need a many-to-many or just update the default line.
        // For now, let's update the product to point to this line if it's not set, or maybe we need a relation table?
        // The schema has `lineId` on Product, which implies a product belongs to one line?
        // Wait, `ProductTone` belongs to `ProductLine`. `Product` has `lineId`.
        // If a Product (Puerta MAD) has multiple Lines (Vidrio, etc), then `Product` -> `ProductLine` is 1-to-many?
        // Schema: `line ProductLine? @relation(...)`. So Product has ONE line?
        // If "Puerta MAD" can have "Vidrio" line AND other lines, then the schema might be restrictive if we treat "Puerta MAD" as a single Product.
        // However, looking at the CSV, "Linea" varies (Vidrio).
        // If we have multiple lines for the same "Puerta MAD", we might need to rethink the "Product" definition.
        // Maybe "Puerta MAD - Vidrio" is the Product?
        // OR, the Wizard selects a "Product" (generic) then a "Line".
        // If `Product` has `lineId`, it defaults to a specific line.
        // Let's assume for this wizard, we want to show "Puerta MAD" as the product, and then "Vidrio" as a line option.
        // But `Product` -> `lineId` suggests a default or single line.
        // Let's check `ProductTone`. It links to `ProductLine`.
        // The Wizard fetches `product-lines`.
        // If we want to link "Puerta MAD" to multiple lines, we might need to rely on `ProductLine` being independent of `Product` in the schema,
        // OR `Product` is just a container and we fetch Lines separately.
        // In `product-configurator.tsx`:
        // `fetchProducts` gets products.
        // `fetchLines` gets ALL lines.
        // It doesn't seem to filter lines by product currently.
        // So we can just create the Lines.

        // 4. Upsert ProductTone
        const toneName = record['Tono o Color']
        const priceString = record['Precio Base por m²'].replace(/[$,]/g, '')
        const priceAdjustment = parseFloat(priceString)

        const faces = record['Caras']
        const supportsTwoCars = faces.includes('2')

        const veta = record['Veta / Orientación']
        const supportsHorizontal = veta !== 'no aplica' // Simplified logic, adjust if needed
        const supportsVertical = veta !== 'no aplica'

        await prisma.productTone.upsert({
            where: {
                lineId_name: {
                    lineId: line.id,
                    name: toneName,
                },
            },
            update: {
                priceAdjustment: priceAdjustment,
                supportsTwoCars: supportsTwoCars,
                supportsHorizontalGrain: supportsHorizontal,
                supportsVerticalGrain: supportsVertical,
            },
            create: {
                name: toneName,
                lineId: line.id,
                priceAdjustment: priceAdjustment,
                supportsTwoCars: supportsTwoCars,
                supportsHorizontalGrain: supportsHorizontal,
                supportsVerticalGrain: supportsVertical,
            },
        })

        // 5. Upsert HandleModel
        const handleStr = record['Jaladera']
        const handlePriceStr = record['Precio Jaladera'].replace(/[$,]/g, '')
        const handlePrice = parseFloat(handlePriceStr)

        if (handleStr && handleStr !== 'no aplica') {
            const handles = handleStr.split(',').map((s: string) => s.trim())
            for (const handleModelName of handles) {
                await prisma.handleModel.upsert({
                    where: { name: handleModelName },
                    update: {
                        price: handlePrice,
                    },
                    create: {
                        name: handleModelName,
                        model: handleModelName,
                        finish: 'Standard', // Default
                        price: handlePrice,
                    },
                })
            }
        }
    }

    console.log('Seeding completed successfully')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
