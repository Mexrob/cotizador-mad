import pandas as pd
import uuid
from sqlalchemy import create_engine, text
import warnings
warnings.filterwarnings('ignore')

DATABASE_URL = 'postgresql://cotizador:changeme123@localhost:5434/cotizador_mad'
engine = create_engine(DATABASE_URL)

FILES_DIR = '/home/ubuntu/cotizador-mad/productos'
FILES = [
    'vidrio_filtrado.xltx'
]

LINE_MAP = {}

def get_line_id(line_name):
    if line_name not in LINE_MAP:
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT id FROM product_lines WHERE LOWER(name) LIKE :name"
            ), {'name': f'%{line_name.lower()}%'})
            row = result.fetchone()
            if row:
                LINE_MAP[line_name] = row[0]
            else:
                print(f"WARNING: Line not found: {line_name}")
                LINE_MAP[line_name] = None
    return LINE_MAP.get(line_name)

def get_val(value, default=None):
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

def insert_products(products):
    if not products:
        return 0
    
    with engine.connect() as conn:
        for p in products:
            p['id'] = str(uuid.uuid4())
            try:
                conn.execute(text("""
                    INSERT INTO products (
                        id, name, "categoryId", categoria, coleccion, linea,
                        "tonoColor", "precioBaseM2", "tiempoEntrega",
                        "puertaAnchoMin", "puertaAnchoMax", "puertaAltoMin", "puertaAltoMax",
                        "createdAt", "updatedAt"
                    ) VALUES (
                        :id, :name, :categoryId, :categoria, :coleccion, :linea,
                        :tonoColor, :precioBaseM2, :tiempoEntrega,
                        :puertaAnchoMin, :puertaAnchoMax, :puertaAltoMin, :puertaAltoMax,
                        NOW(), NOW()
                    )
                """), p)
            except Exception as e:
                print(f"  Insert error: {e}")
        conn.commit()
    return len(products)

def import_vidrio_filtrado(df, file_name):
    print("  - VIDRIO FILTRADO")
    products = []
    line_id = get_line_id('Vidrio')
    category_id = 'cmkd638kv0001ph295kbpodhi'
    
    for _, row in df.iterrows():
        tono = get_val(row.get('Tono o Color'))
        coleccion = get_val(row.get('Colección'), 'Line')
        categoria = get_val(row.get('Categoria'), 'Puerta')
        
        products.append({
            'name': f"VIDRIO - {tono or 'N/A'} (Filtrado)",
            'categoryId': category_id,
            'categoria': categoria,
            'coleccion': coleccion,
            'linea': line_id,
            'tonoColor': tono,
            'precioBaseM2': to_float(row.get('Precio Base por m²')) or 0,
            'tiempoEntrega': to_int(row.get('Tiempo de Entrega (días habiles)')) or 7,
            'puertaAnchoMin': to_float(row.get('Ancho Mín (mm)')),
            'puertaAnchoMax': to_float(row.get('Ancho Máx (mm)')),
            'puertaAltoMin': to_float(row.get('Alto Mín (mm)')),
            'puertaAltoMax': to_float(row.get('Alto Máx (mm)')),
        })
    return insert_products(products)

def main():
    print("=" * 60)
    print("IMPORTACIÓN DE PRODUCTOS - VIDRIO FILTRADO")
    print("=" * 60)
    print(f"\nBase de datos: cotizador_mad")
    print(f"Archivos a importar: {len(FILES)}\n")
    
    total_products = 0
    
    file_handlers = {
        'vidrio_filtrado.xltx': import_vidrio_filtrado,
    }
    
    for file_name in FILES:
        try:
            print(f"Procesando: {file_name}")
            file_path = f"{FILES_DIR}/{file_name}"
            df = pd.read_excel(file_path)
            
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
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM products"))
        print(f"\nTotal en BD: {result.scalar()}")

if __name__ == '__main__':
    main()
