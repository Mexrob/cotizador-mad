import pandas as pd
import os
import sys
from sqlalchemy import create_engine, text
import warnings
warnings.filterwarnings('ignore')

DATABASE_URL = "postgresql://cotizador:changeme123@localhost:5434/productos_import"
engine = create_engine(DATABASE_URL)

FILES = [
    'foil.xlsx',
    'Alhú.xlsx',
    'ceramica.xlsx',
    'vidrio.xlsx',
    'Europa Básica.xlsx',
    'Europa Sincro .xlsx',
    'Alto brillo.xlsx',
    'Super mate.xlsx',
    'Ventanas.xlsx',
    'Enchape.xlsx'
]

def normalize_columns(df):
    # Check if first row contains actual headers in Unnamed columns
    if 'Unnamed: 0' in df.columns:
        first_row = df.iloc[0]
        # Check if it's a header row
        if 'Categoria' in str(first_row.get('Unnamed: 0', '')):
            new_cols = list(first_row.values)
            df = df.iloc[1:].copy()
            df.columns = new_cols
    
    df.columns = [str(c).strip() if pd.notna(c) else f'col_{i}' for i, c in enumerate(df.columns)]
    df = df.dropna(how='all')
    return df

def get_val(value, default=None):
    # Handle pandas Series or DataFrame first (before pd.isna)
    if isinstance(value, (pd.Series, pd.DataFrame)):
        if isinstance(value, pd.Series) and len(value) > 0:
            return value.iloc[0] if not pd.isna(value.iloc[0]) else default
        return default
    if pd.isna(value):
        return default
    return value

def to_float_val(value):
    val = get_val(value)
    if val is None:
        return None
    try:
        return float(val)
    except:
        return None

def to_int_val(value):
    val = get_val(value)
    if val is None:
        return None
    try:
        return int(float(val))
    except:
        return None

def convert_mm(value, unit='mm'):
    val = get_val(value)
    if val is None:
        return None
    try:
        v = float(val)
        if unit == 'cm':
            return v * 10
        elif unit == 'm':
            return v * 1000
        return v
    except:
        return None

def create_catalogs():
    """Create initial categories and product lines"""
    with engine.connect() as conn:
        # Create categories
        categories = [
            ('DOOR', 'Puerta', 'Puertas y frentes'),
            ('WINDOW', 'Ventana', 'Ventanas'),
        ]
        for code, name, desc in categories:
            try:
                conn.execute(text("""
                    INSERT INTO categories (id, name, description, status, "createdAt", "updatedAt")
                    VALUES (:id, :name, :description, 'ACTIVE', NOW(), NOW())
                    ON CONFLICT (id) DO NOTHING
                """), {'id': code, 'name': name, 'description': desc})
            except Exception as e:
                print(f"  Category error: {e}")
        
        # Create product lines
        lines = [
            ('FOIL', 'FOIL', 'Línea Foil'),
            ('ALHU', 'ALHÚ', 'Línea Aluminum'),
            ('CERAMICA', 'CERÁMICA', 'Línea Cerámica'),
            ('VIDRIO', 'VIDRIO', 'Línea Vidrio'),
            ('EUROPA_BASICA', 'Europa Básica', 'Europa Básica'),
            ('EUROPA_SINCRO', 'Europa Sincro', 'Europa Sincro'),
            ('ALTO_BRILLO', 'Alto Brillo', 'Alto Brillo'),
            ('SUPER_MATE', 'Super Mate', 'Super Mate'),
            ('VENTANAS', 'Ventanas', 'Ventanas'),
            ('ENCHAPE', 'Enchape', 'Enchape'),
        ]
        for code, name, desc in lines:
            try:
                conn.execute(text("""
                    INSERT INTO product_lines (id, name, description, "isActive", "sortOrder", "createdAt", "updatedAt")
                    VALUES (:id, :name, :description, true, 0, NOW(), NOW())
                    ON CONFLICT (id) DO NOTHING
                """), {'id': code, 'name': name, 'description': desc})
            except Exception as e:
                print(f"  Line error: {e}")
        
        conn.commit()

def generate_uuid():
    """Generate a simple UUID-like string"""
    import uuid
    return str(uuid.uuid4())

def insert_products(products):
    """Insert products with generated IDs"""
    if not products:
        return 0
    
    with engine.connect() as conn:
        for p in products:
            p['id'] = generate_uuid()
            # Ensure orientation is never None
            if p.get('orientation') is None:
                p['orientation'] = 'N/A'
            try:
                conn.execute(text("""
                    INSERT INTO products (
                        id, name, description, "categoryId", "lineId",
                        "colorToneText", "woodGrainText", faces, "edgeBanding",
                        "handleType", "basePrice", "leadTime", "minWidth", "maxWidth",
                        "minHeight", "maxHeight", orientation, status,
                        "dimensionUnit", "weightUnit", "isCustomizable",
                        "minQuantity", "createdAt", "updatedAt"
                    ) VALUES (
                        :id, :name, :description, :categoryId, :lineId,
                        :colorToneText, :woodGrainText, :faces, :edgeBanding,
                        :handleType, :basePrice, :leadTime, :minWidth, :maxWidth,
                        :minHeight, :maxHeight, :orientation, :status,
                        'mm', 'kg', true, 1, NOW(), NOW()
                    )
                """), p)
            except Exception as e:
                print(f"  Insert error: {e}")
        conn.commit()
    return len(products)

def import_foil(df):
    print("  - FOIL")
    products = []
    for _, row in df.iterrows():
        caras = get_val(row.get('Caras'), 1)
        tono = get_val(row.get('Tono o Color'))
        veta = get_val(row.get('Veta / Orientación'))
        products.append({
            'name': f"FOIL - {tono or 'N/A'} - {veta or 'N/A'}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Luna')}",
            'categoryId': 'DOOR',
            'lineId': 'FOIL',
            'colorToneText': tono,
            'woodGrainText': veta,
            'faces': 1 if caras == 1 else 2,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float_val(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int_val(row.get('Tiempo de Entrega (días habiles)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (mm)')),
            'maxWidth': convert_mm(row.get('Ancho Máximo (mm)')),
            'minHeight': convert_mm(row.get('Alto Mínimo (mm)')),
            'maxHeight': convert_mm(row.get('Alto Máximo (mm)')),
            'orientation': veta,
            'status': 'ACTIVE',
        })
    return insert_products(products)

def import_alhu(df):
    print("  - ALHÚ")
    products = []
    for _, row in df.iterrows():
        products.append({
            'name': f"ALHÚ - {get_val(row.get('Tono Vidrio'), 'N/A')} - {get_val(row.get('Tono Aluminio'), 'N/A')}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Line')}",
            'categoryId': 'DOOR',
            'lineId': 'ALHU',
            'colorToneText': get_val(row.get('Tono Vidrio')),
            'woodGrainText': get_val(row.get('Veta / Orientación')),
            'faces': 1 if to_int_val(row.get('Caras')) == 1 else 2,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float_val(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int_val(row.get('Tiempo de Entrega (días hábiles)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (mm)')),
            'maxWidth': convert_mm(row.get('Ancho Máximo (mm)')),
            'minHeight': convert_mm(row.get('Alto Mínimo (mm)')),
            'maxHeight': convert_mm(row.get('Alto Máximo (mm)')),
            'status': 'ACTIVE',
        })
    return insert_products(products)

def import_ceramica(df):
    print("  - CERÁMICA")
    products = []
    for _, row in df.iterrows():
        products.append({
            'name': f"CERÁMICA - {get_val(row.get('Tono o Color'), 'N/A')}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Line')}",
            'categoryId': 'DOOR',
            'lineId': 'CERAMICA',
            'colorToneText': get_val(row.get('Tono o Color')),
            'woodGrainText': get_val(row.get('Veta / Orientación')),
            'faces': 1 if to_int_val(row.get('Caras')) == 1 else 2,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float_val(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int_val(row.get('Tiempo de Entrega (días habiles)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (mm)')),
            'maxWidth': convert_mm(row.get('Ancho Máximo (mm)')),
            'minHeight': convert_mm(row.get('Alto Mínimo (mm)')),
            'maxHeight': convert_mm(row.get('Alto Máximo (mm)')),
            'status': 'ACTIVE',
        })
    return insert_products(products)

def import_vidrio(df):
    print("  - VIDRIO")
    products = []
    for _, row in df.iterrows():
        products.append({
            'name': f"VIDRIO - {get_val(row.get('Tono o Color'), 'N/A')}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Line')}",
            'categoryId': 'DOOR',
            'lineId': 'VIDRIO',
            'colorToneText': get_val(row.get('Tono o Color')),
            'woodGrainText': get_val(row.get('Veta / Orientación')),
            'faces': 1 if to_int_val(row.get('Caras')) == 1 else 2,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float_val(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int_val(row.get('Tiempo de Entrega (días habiles)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (mm)')),
            'maxWidth': convert_mm(row.get('Ancho Máximo (mm)')),
            'minHeight': convert_mm(row.get('Alto Mínimo (mm)')),
            'maxHeight': convert_mm(row.get('Alto Máximo (mm)')),
            'status': 'ACTIVE',
        })
    return insert_products(products)

def import_europa_basica(df):
    print("  - EUROPA BÁSICA")
    products = []
    for _, row in df.iterrows():
        products.append({
            'name': f"EUROPA BÁSICA - {get_val(row.get('Tono o Color'), 'N/A')} - {get_val(row.get('Veta / Orientación'), 'N/A')}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Line')}",
            'categoryId': 'DOOR',
            'lineId': 'EUROPA_BASICA',
            'colorToneText': get_val(row.get('Tono o Color')),
            'woodGrainText': get_val(row.get('Veta / Orientación')),
            'faces': to_int_val(row.get('Caras')) or 2,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float_val(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int_val(row.get('Tiempo de Entrega (días)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (mm)'), 'mm'),
            'maxWidth': convert_mm(row.get('Ancho Máximo (mm)'), 'mm'),
            'minHeight': convert_mm(row.get('Alto Mínimo (mm)'), 'mm'),
            'maxHeight': convert_mm(row.get('Alto Máximo (mm)'), 'mm'),
            'orientation': get_val(row.get('Veta / Orientación')),
            'status': 'ACTIVE',
        })
    return insert_products(products)

def import_europa_sincro(df):
    print("  - EUROPA SINCRO")
    products = []
    for _, row in df.iterrows():
        products.append({
            'name': f"EUROPA SINCRO - {get_val(row.get('Tono o Color'), 'N/A')} - {get_val(row.get('Veta / Orientación'), 'N/A')}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Line')}",
            'categoryId': 'DOOR',
            'lineId': 'EUROPA_SINCRO',
            'colorToneText': get_val(row.get('Tono o Color')),
            'woodGrainText': get_val(row.get('Veta / Orientación')),
            'faces': to_int_val(row.get('Caras')) or 2,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float_val(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int_val(row.get('Tiempo de Entrega (días)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (cm)'), 'cm'),
            'maxWidth': convert_mm(row.get('Ancho Máximo (cm)'), 'cm'),
            'minHeight': convert_mm(row.get('Alto Mínimo (cm)'), 'cm'),
            'maxHeight': convert_mm(row.get('Alto Máximo (cm)'), 'cm'),
            'orientation': get_val(row.get('Veta / Orientación')),
            'status': 'ACTIVE',
        })
    return insert_products(products)

def import_alto_brillo(df):
    print("  - ALTO BRILLO")
    products = []
    for _, row in df.iterrows():
        products.append({
            'name': f"ALTO BRILLO - {get_val(row.get('Tono o Color'), 'N/A')}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Line')}",
            'categoryId': 'DOOR',
            'lineId': 'ALTO_BRILLO',
            'colorToneText': get_val(row.get('Tono o Color')),
            'woodGrainText': get_val(row.get('Veta / Orientación')),
            'faces': to_int_val(row.get('Caras')) or 2,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float_val(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int_val(row.get('Tiempo de Entrega (días)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (cm)'), 'cm'),
            'maxWidth': convert_mm(row.get('Ancho Máximo (cm)'), 'cm'),
            'minHeight': convert_mm(row.get('Alto Mínimo (cm)'), 'cm'),
            'maxHeight': convert_mm(row.get('Alto Máximo (cm)'), 'cm'),
            'status': 'ACTIVE',
        })
    return insert_products(products)

def import_super_mate(df):
    print("  - SUPER MATE")
    products = []
    for _, row in df.iterrows():
        products.append({
            'name': f"SUPER MATE - {get_val(row.get('Tono o Color'), 'N/A')}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Line')}",
            'categoryId': 'DOOR',
            'lineId': 'SUPER_MATE',
            'colorToneText': get_val(row.get('Tono o Color')),
            'woodGrainText': get_val(row.get('Veta / Orientación')),
            'faces': to_int_val(row.get('Caras')) or 2,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float_val(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int_val(row.get('Tiempo de Entrega (días)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (cm)'), 'cm'),
            'maxWidth': convert_mm(row.get('Ancho Máximo (cm)'), 'cm'),
            'minHeight': convert_mm(row.get('Alto Mínimo (cm)'), 'cm'),
            'maxHeight': convert_mm(row.get('Alto Máximo (cm)'), 'cm'),
            'status': 'ACTIVE',
        })
    return insert_products(products)

def import_ventanas(df):
    print("  - VENTANAS")
    products = []
    for _, row in df.iterrows():
        products.append({
            'name': f"VENTANA - {get_val(row.get('Tono o Color'), 'N/A')} - {get_val(row.get('Veta / Orientación'), 'N/A')}",
            'description': f"Categoría: Ventana, Colección: {get_val(row.get('Colección'), 'Line')}, Precio vidrio: {get_val(row.get('PRECIO DE VIDIRIO CLARO DE 4MM'), 'N/A')}",
            'categoryId': 'WINDOW',
            'lineId': 'VENTANAS',
            'colorToneText': get_val(row.get('Tono o Color')),
            'woodGrainText': get_val(row.get('Veta / Orientación')),
            'faces': to_int_val(row.get('Caras')) or 2,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float_val(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int_val(row.get('Tiempo de Entrega (días)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (mm)')),
            'maxWidth': convert_mm(row.get('Ancho Máximo (mm)')),
            'minHeight': convert_mm(row.get('Alto Mínimo (mm)')),
            'maxHeight': convert_mm(row.get('Alto Máximo (mm)')),
            'orientation': get_val(row.get('Veta / Orientación')),
            'status': 'ACTIVE',
        })
    return insert_products(products)

def import_enchape(df):
    print("  - ENCHAPE")
    products = []
    for _, row in df.iterrows():
        if pd.isna(row.get('Categoria')):
            continue
        products.append({
            'name': f"ENCHAPE - {get_val(row.get('Tono o Color'), 'N/A')} - {get_val(row.get('Veta / Orientación'), 'N/A')}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Luna')}",
            'categoryId': 'DOOR',
            'lineId': 'ENCHAPE',
            'colorToneText': get_val(row.get('Tono o Color')),
            'woodGrainText': get_val(row.get('Veta / Orientación')),
            'faces': to_int_val(row.get('Caras')) or 1,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float_val(row.get('Precio Base por ml')) or 0,
            'leadTime': to_int_val(row.get('Tiempo de Entrega (días)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (mm)')),
            'maxWidth': convert_mm(row.get('Ancho Máximo (mm)')),
            'minHeight': convert_mm(row.get('Alto Mínimo (m)'), 'm'),
            'maxHeight': convert_mm(row.get('Alto Máximo (mm)')),
            'orientation': get_val(row.get('Veta / Orientación')),
            'status': 'ACTIVE',
        })
    return insert_products(products)

def main():
    print("=" * 60)
    print("IMPORTACIÓN DE PRODUCTOS A BASE DE DATOS")
    print("=" * 60)
    print(f"\nBase de datos: productos_import")
    print(f"Archivos a importar: {len(FILES)}\n")
    
    # Create catalogs first
    print("Creando catálogos (categorías y líneas)...")
    create_catalogs()
    print("✓ Catálogos creados\n")
    
    total_products = 0
    
    file_handlers = {
        'foil.xlsx': import_foil,
        'Alhú.xlsx': import_alhu,
        'ceramica.xlsx': import_ceramica,
        'vidrio.xlsx': import_vidrio,
        'Europa Básica.xlsx': import_europa_basica,
        'Europa Sincro .xlsx': import_europa_sincro,
        'Alto brillo.xlsx': import_alto_brillo,
        'Super mate.xlsx': import_super_mate,
        'Ventanas.xlsx': import_ventanas,
        'Enchape.xlsx': import_enchape,
    }
    
    for file_name in FILES:
        try:
            print(f"Procesando: {file_name}")
            df = pd.read_excel(file_name)
            df = normalize_columns(df)
            
            handler = file_handlers.get(file_name)
            if handler:
                count = handler(df)
                total_products += count
                print(f"  ✓ {count} productos importados")
            else:
                print(f"  ✗ Sin handler para este archivo")
        except Exception as e:
            print(f"  ✗ Error: {e}")
    
    print("\n" + "=" * 60)
    print(f"IMPORTACIÓN COMPLETADA")
    print(f"Total de productos importados: {total_products}")
    print("=" * 60)
    
    # Verify counts
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM products"))
        print(f"\nTotal en BD: {result.scalar()}")

if __name__ == '__main__':
    main()
