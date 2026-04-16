import pandas as pd
import uuid
from sqlalchemy import create_engine, text
import warnings
warnings.filterwarnings('ignore')

# Database connection - main database
DATABASE_URL = 'postgresql://cotizador:changeme123@localhost:5434/cotizador_mad'
engine = create_engine(DATABASE_URL)

# Files to import
FILES_DIR = '/home/ubuntu/cotizador-mad/productos'
FILES = [
    'vidrio_filtrado.xltx'
] # Disabled
'''FILES = [
    'foil.xlsx',
    'Alhú.xlsx',
    'ceramica.xlsx',
    'vidrio.xlsx',
    'Europa Básica.xlsx',
    'Europa Sincro .xlsx',
    'Alto brillo.xlsx',
    'Super mate.xlsx',
    'Ventanas.xlsx',
    'Enchape.xlsx',
    'vidrio_filtrado.xltx'
]

# Line mapping - Excel name to DB ID
LINE_MAP = {}

# Category mapping - name to ID
CATEGORY_MAP = {
    'Puerta': 'cmkd638kv0001ph295kbpodhi',
    'DOOR': 'cmkd638kv0001ph295kbpodhi',
    'Ventanas': 'cmm6029go0001scv3crien8bi',
    'WINDOW': 'cmm6029go0001scv3crien8bi'
}

def get_category_id(category_name):
    """Get category ID from database by name"""
    return CATEGORY_MAP.get(category_name, CATEGORY_MAP['Puerta'])

def get_line_id(line_name):
    """Get line ID from database by name"""
    if line_name not in LINE_MAP:
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT id FROM product_lines WHERE LOWER(name) = :name"
            ), {'name': line_name.lower()})
            row = result.fetchone()
            if row:
                LINE_MAP[line_name] = row[0]
            else:
                print(f"WARNING: Line not found: {line_name}")
                LINE_MAP[line_name] = None
    return LINE_MAP.get(line_name)

def normalize_columns(df):
    """Normalize column names from Excel"""
    # Check if first row contains actual headers
    if 'Unnamed: 0' in df.columns:
        first_row = df.iloc[0]
        if 'Categoria' in str(first_row.get('Unnamed: 0', '')):
            new_cols = list(first_row.values)
            df = df.iloc[1:].copy()
            df.columns = new_cols
    
    df.columns = [str(c).strip() if pd.notna(c) else f'col_{i}' for i, c in enumerate(df.columns)]
    df = df.dropna(how='all')
    return df

def get_val(value, default=None):
    """Safely get value from pandas"""
    # Handle pandas Series or DataFrame first
    if isinstance(value, (pd.Series, pd.DataFrame)):
        if isinstance(value, pd.Series) and len(value) > 0:
            return value.iloc[0] if not pd.isna(value.iloc[0]) else default
        return default
    if pd.isna(value):
        return default
    return value

def to_float(value):
    val = get_val(value)
    if val is None:
        return None
    try:
        return float(val)
    except:
        return None

def to_int(value):
    val = get_val(value)
    if val is None:
        return None
    try:
        return int(float(val))
    except:
        return None

def convert_mm(value, unit='mm'):
    """Convert dimensions to mm"""
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

def insert_products(products):
    """Insert products into database"""
    if not products:
        return 0
    
    with engine.connect() as conn:
        for p in products:
            p['id'] = str(uuid.uuid4())
            # Ensure orientation is never None
            if p.get('orientation') is None:
                p['orientation'] = 'N/A'
                
            try:
                conn.execute(text("""
                    INSERT INTO products (
                        id, name, description, "categoryId", "lineId",
                        "colorToneText", "woodGrainText", faces, "edgeBanding",
                        "handleType", "basePrice", "minWidth", "maxWidth",
                        "minHeight", "maxHeight", orientation, status,
                        "dimensionUnit", "weightUnit", "isCustomizable",
                        "leadTime", "minQuantity", "collection",
                        "createdAt", "updatedAt"
                    ) VALUES (
                        :id, :name, :description, :categoryId, :lineId,
                        :colorToneText, :woodGrainText, :faces, :edgeBanding,
                        :handleType, :basePrice, :minWidth, :maxWidth,
                        :minHeight, :maxHeight, :orientation, :status,
                        'mm', 'kg', true,
                        :leadTime, 1, :collection,
                        NOW(), NOW()
                    )
                """), p)
            except Exception as e:
                print(f"  Insert error: {e}")
        conn.commit()
    return len(products)

def import_foil(df, file_name):
    """Import foil.xlsx"""
    print("  - FOIL")
    products = []
    line_id = get_line_id('Foil')
    
    for _, row in df.iterrows():
        caras = get_val(row.get('Caras'), 1)
        tono = get_val(row.get('Tono o Color'))
        veta = get_val(row.get('Veta / Orientación'))
        
        products.append({
            'name': f"FOIL - {tono or 'N/A'} - {veta or 'N/A'}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Luna')}",
            'categoryId': get_category_id(get_val(row.get('Categoria'), 'Puerta')),
            'lineId': line_id,
            'colorToneText': tono,
            'woodGrainText': veta,
            'faces': 1 if caras == 1 else 2,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int(row.get('Tiempo de Entrega (días habiles)')) or 15,
            'minWidth': convert_mm(row.get('Ancho Mínimo (mm)')),
            'maxWidth': convert_mm(row.get('Ancho Máximo (mm)')),
            'minHeight': convert_mm(row.get('Alto Mínimo (mm)')),
            'maxHeight': convert_mm(row.get('Alto Máximo (mm)')),
            'orientation': veta if veta else 'N/A',
            'status': 'ACTIVE',
            'collection': get_val(row.get('Colección')),
        })
    return insert_products(products)

def import_alhu(df, file_name):
    """Import Alhú.xlsx"""
    print("  - ALHÚ")
    products = []
    line_id = get_line_id('Alhú')
    
    for _, row in df.iterrows():
        tono_vidrio = get_val(row.get('Tono Vidrio'))
        tono_aluminio = get_val(row.get('Tono Aluminio'))
        
        products.append({
            'name': f"ALHÚ - {tono_vidrio or 'N/A'} - {tono_aluminio or 'N/A'}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Line')}",
            'categoryId': get_category_id(get_val(row.get('Categoria'), 'Puerta')),
            'lineId': line_id,
            'colorToneText': tono_vidrio,
            'woodGrainText': get_val(row.get('Veta / Orientación')),
            'faces': 2,
            'edgeBanding': 'No aplica',
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float(row.get('Precio Base por m²')) or 4440,
            'leadTime': to_int(row.get('Tiempo de Entrega (días hábiles)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (mm)')),
            'maxWidth': convert_mm(row.get('Ancho Máximo (mm)')),
            'minHeight': convert_mm(row.get('Alto Mínimo (mm)')),
            'maxHeight': convert_mm(row.get('Alto Máximo (mm)')),
            'orientation': 'N/A',
            'status': 'ACTIVE',
            'collection': get_val(row.get('Colección')),
        })
    return insert_products(products)

def import_ceramica(df, file_name):
    """Import ceramica.xlsx"""
    print("  - CERÁMICA")
    products = []
    line_id = get_line_id('Céramica')
    
    for _, row in df.iterrows():
        tono = get_val(row.get('Tono o Color'))
        
        products.append({
            'name': f"CERÁMICA - {tono or 'N/A'}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Line')}",
            'categoryId': get_category_id(get_val(row.get('Categoria'), 'Puerta')),
            'lineId': line_id,
            'colorToneText': tono,
            'woodGrainText': get_val(row.get('Veta / Orientación')),
            'faces': 2,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int(row.get('Tiempo de Entrega (días habiles)')) or 15,
            'minWidth': convert_mm(row.get('Ancho Mínimo (mm)')),
            'maxWidth': convert_mm(row.get('Ancho Máximo (mm)')),
            'minHeight': convert_mm(row.get('Alto Mínimo (mm)')),
            'maxHeight': convert_mm(row.get('Alto Máximo (mm)')),
            'orientation': 'N/A',
            'status': 'ACTIVE',
            'collection': get_val(row.get('Colección')),
        })
    return insert_products(products)

def import_vidrio(df, file_name):
    """Import vidrio.xlsx"""
    print("  - VIDRIO")
    products = []
    line_id = get_line_id('Vidrio')
    
    for _, row in df.iterrows():
        tono = get_val(row.get('Tono o Color'))
        
        products.append({
            'name': f"VIDRIO - {tono or 'N/A'}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Line')}",
            'categoryId': get_category_id(get_val(row.get('Categoria'), 'Puerta')),
            'lineId': line_id,
            'colorToneText': tono,
            'woodGrainText': get_val(row.get('Veta / Orientación')),
            'faces': 2,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int(row.get('Tiempo de Entrega (días habiles)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (mm)')),
            'maxWidth': convert_mm(row.get('Ancho Máximo (mm)')),
            'minHeight': convert_mm(row.get('Alto Mínimo (mm)')),
            'maxHeight': convert_mm(row.get('Alto Máximo (mm)')),
            'orientation': 'N/A',
            'status': 'ACTIVE',
            'collection': get_val(row.get('Colección')),
        })
    return insert_products(products)

def import_europa_basica(df, file_name):
    """Import Europa Básica.xlsx"""
    print("  - EUROPA BÁSICA")
    products = []
    line_id = get_line_id('Europa Básica')
    
    for _, row in df.iterrows():
        tono = get_val(row.get('Tono o Color'))
        veta = get_val(row.get('Veta / Orientación'))
        
        products.append({
            'name': f"EUROPA BÁSICA - {tono or 'N/A'} - {veta or 'N/A'}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Line')}",
            'categoryId': get_category_id(get_val(row.get('Categoria'), 'Puerta')),
            'lineId': line_id,
            'colorToneText': tono,
            'woodGrainText': veta,
            'faces': to_int(row.get('Caras')) or 2,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int(row.get('Tiempo de Entrega (días)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (mm)')),
            'maxWidth': convert_mm(row.get('Ancho Máximo (mm)')),
            'minHeight': convert_mm(row.get('Alto Mínimo (mm)')),
            'maxHeight': convert_mm(row.get('Alto Máximo (mm)')),
            'orientation': veta or 'N/A',
            'status': 'ACTIVE',
            'collection': get_val(row.get('Colección')),
        })
    return insert_products(products)

def import_europa_sincro(df, file_name):
    """Import Europa Sincro .xlsx"""
    print("  - EUROPA SINCRO")
    products = []
    line_id = get_line_id('Europa Sincro')
    
    for _, row in df.iterrows():
        tono = get_val(row.get('Tono o Color'))
        veta = get_val(row.get('Veta / Orientación'))
        
        products.append({
            'name': f"EUROPA SINCRO - {tono or 'N/A'} - {veta or 'N/A'}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Line')}",
            'categoryId': get_category_id(get_val(row.get('Categoria'), 'Puerta')),
            'lineId': line_id,
            'colorToneText': tono,
            'woodGrainText': veta,
            'faces': to_int(row.get('Caras')) or 2,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int(row.get('Tiempo de Entrega (días)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (cm)'), 'cm'),
            'maxWidth': convert_mm(row.get('Ancho Máximo (cm)'), 'cm'),
            'minHeight': convert_mm(row.get('Alto Mínimo (cm)'), 'cm'),
            'maxHeight': convert_mm(row.get('Alto Máximo (cm)'), 'cm'),
            'orientation': veta or 'N/A',
            'status': 'ACTIVE',
            'collection': get_val(row.get('Colección')),
        })
    return insert_products(products)

def import_alto_brillo(df, file_name):
    """Import Alto brillo.xlsx"""
    print("  - ALTO BRILLO")
    products = []
    line_id = get_line_id('Alto Brillo')
    
    for _, row in df.iterrows():
        tono = get_val(row.get('Tono o Color'))
        
        products.append({
            'name': f"ALTO BRILLO - {tono or 'N/A'}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Line')}",
            'categoryId': get_category_id(get_val(row.get('Categoria'), 'Puerta')),
            'lineId': line_id,
            'colorToneText': tono,
            'woodGrainText': get_val(row.get('Veta / Orientación')),
            'faces': to_int(row.get('Caras')) or 2,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int(row.get('Tiempo de Entrega (días)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (cm)'), 'cm'),
            'maxWidth': convert_mm(row.get('Ancho Máximo (cm)'), 'cm'),
            'minHeight': convert_mm(row.get('Alto Mínimo (cm)'), 'cm'),
            'maxHeight': convert_mm(row.get('Alto Máximo (cm)'), 'cm'),
            'orientation': 'N/A',
            'status': 'ACTIVE',
            'collection': get_val(row.get('Colección')),
        })
    return insert_products(products)

def import_super_mate(df, file_name):
    """Import Super mate.xlsx"""
    print("  - SUPER MATE")
    products = []
    line_id = get_line_id('Super Mate')
    
    for _, row in df.iterrows():
        tono = get_val(row.get('Tono o Color'))
        
        products.append({
            'name': f"SUPER MATE - {tono or 'N/A'}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Line')}",
            'categoryId': get_category_id(get_val(row.get('Categoria'), 'Puerta')),
            'lineId': line_id,
            'colorToneText': tono,
            'woodGrainText': get_val(row.get('Veta / Orientación')),
            'faces': to_int(row.get('Caras')) or 2,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int(row.get('Tiempo de Entrega (días)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (cm)'), 'cm'),
            'maxWidth': convert_mm(row.get('Ancho Máximo (cm)'), 'cm'),
            'minHeight': convert_mm(row.get('Alto Mínimo (cm)'), 'cm'),
            'maxHeight': convert_mm(row.get('Alto Máximo (cm)'), 'cm'),
            'orientation': 'N/A',
            'status': 'ACTIVE',
            'collection': get_val(row.get('Colección')),
        })
    return insert_products(products)

def import_ventanas(df, file_name):
    """Import Ventanas.xlsx"""
    print("  - VENTANAS")
    products = []
    line_id = get_line_id('Ventanas')
    
    for _, row in df.iterrows():
        tono = get_val(row.get('Tono o Color'))
        veta = get_val(row.get('Veta / Orientación'))
        
        # Fix: use correct column name
        precio_vidrio = row.get('PRECIO DE VIDIRIO CLARO DE 4MM') or row.get('PRECIO DE VIDRIO CLARO DE 4MM')
        
        products.append({
            'name': f"VENTANA - {tono or 'N/A'} - {veta or 'N/A'}",
            'description': f"Categoría: Ventana, Colección: {get_val(row.get('Colección'), 'Line')}, Precio vidrio: {precio_vidrio}",
            'categoryId': get_category_id('Ventanas'),
            'lineId': line_id,
            'colorToneText': tono,
            'woodGrainText': veta,
            'faces': to_int(row.get('Caras')) or 2,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int(row.get('Tiempo de Entrega (días)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (mm)')),
            'maxWidth': convert_mm(row.get('Ancho Máximo (mm)')),
            'minHeight': convert_mm(row.get('Alto Mínimo (mm)')),
            'maxHeight': convert_mm(row.get('Alto Máximo (mm)')),
            'orientation': veta if veta else 'N/A',
            'status': 'ACTIVE',
            'collection': get_val(row.get('Colección')),
        })
    return insert_products(products)

def import_vidrio_filtrado(df, file_name):
    """Import vidrio_filtrado.xltx"""
    print("  - VIDRIO FILTRADO")
    products = []
    line_id = get_line_id('Vidrio')
    
    for _, row in df.iterrows():
        tono = get_val(row.get('Tono o Color'))
        
        products.append({
            'name': f"VIDRIO - {tono or 'N/A'} (Filtrado)",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Line')}",
            'categoryId': get_category_id(get_val(row.get('Categoria'), 'Puerta')),
            'lineId': line_id,
            'colorToneText': tono,
            'woodGrainText': None,
            'faces': 2,
            'edgeBanding': None,
            'handleType': None,
            'basePrice': to_float(row.get('Precio Base por m²')) or 0,
            'leadTime': to_int(row.get('Tiempo de Entrega (días habiles)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mín (mm)')),
            'maxWidth': convert_mm(row.get('Ancho Máx (mm)')),
            'minHeight': convert_mm(row.get('Alto Mín (mm)')),
            'maxHeight': convert_mm(row.get('Alto Máx (mm)')),
            'orientation': 'N/A',
            'status': 'ACTIVE',
            'collection': get_val(row.get('Colección')),
        })
    return insert_products(products)

def import_enchape(df, file_name):
    """Import Enchape.xlsx"""
    print("  - ENCHAPE")
    products = []
    line_id = get_line_id('Enchape')
    
    for _, row in df.iterrows():
        tono = get_val(row.get('Tono o Color'))
        veta = get_val(row.get('Veta / Orientación'))
        
        if pd.isna(row.get('Categoria')):
            continue
            
        products.append({
            'name': f"ENCHAPE - {tono or 'N/A'} - {veta or 'N/A'}",
            'description': f"Categoría: {get_val(row.get('Categoria'), 'Puerta')}, Colección: {get_val(row.get('Colección'), 'Luna')}",
            'categoryId': get_category_id(get_val(row.get('Categoria'), 'Puerta')),
            'lineId': line_id,
            'colorToneText': tono,
            'woodGrainText': veta,
            'faces': to_int(row.get('Caras')) or 1,
            'edgeBanding': get_val(row.get('Cubrecanto')),
            'handleType': get_val(row.get('Jaladera')),
            'basePrice': to_float(row.get('Precio Base por ml')) or 0,
            'leadTime': to_int(row.get('Tiempo de Entrega (días)')) or 7,
            'minWidth': convert_mm(row.get('Ancho Mínimo (mm)')),
            'maxWidth': convert_mm(row.get('Ancho Máximo (mm)')),
            'minHeight': convert_mm(row.get('Alto Mínimo (m)'), 'm'),
            'maxHeight': convert_mm(row.get('Alto Máximo (mm)')),
            'orientation': veta if veta else 'N/A',
            'status': 'ACTIVE',
            'collection': get_val(row.get('Colección')),
        })
    return insert_products(products)

def main():
    print("=" * 60)
    print("IMPORTACIÓN DE PRODUCTOS A BASE DE DATOS PRINCIPAL")
    print("=" * 60)
    print(f"\nBase de datos: cotizador_mad")
    print(f"Archivos a importar: {len(FILES)}\n")
    
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
        'vidrio_filtrado.xltx': import_vidrio_filtrado,
    }
    
    for file_name in FILES:
        try:
            print(f"Procesando: {file_name}")
            file_path = f"{FILES_DIR}/{file_name}"
            df = pd.read_excel(file_path)
            df = normalize_columns(df)
            
            handler = file_handlers.get(file_name)
            if handler:
                count = handler(df, file_name)
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
