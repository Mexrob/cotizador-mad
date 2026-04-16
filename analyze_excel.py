#!/usr/bin/env python3
"""
Script para analizar el contenido del archivo Excel COTIZADOR MODULE 2025.xlsx
"""

import xml.etree.ElementTree as ET
import zipfile
import sys

def parse_shared_strings(zip_ref):
    """Extrae las cadenas compartidas del archivo Excel"""
    try:
        with zip_ref.open('xl/sharedStrings.xml') as f:
            tree = ET.parse(f)
            root = tree.getroot()
            ns = {'ss': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            strings = []
            for si in root.findall('.//ss:si', ns):
                t = si.find('.//ss:t', ns)
                if t is not None and t.text:
                    strings.append(t.text)
            return strings
    except:
        return []

def parse_sheet(zip_ref, sheet_name, shared_strings):
    """Extrae datos de una hoja específica"""
    try:
        with zip_ref.open(f'xl/worksheets/{sheet_name}') as f:
            tree = ET.parse(f)
            root = tree.getroot()
            ns = {'ss': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            
            rows_data = []
            for row in root.findall('.//ss:row', ns):
                row_data = []
                for cell in row.findall('.//ss:c', ns):
                    value = cell.find('.//ss:v', ns)
                    cell_type = cell.get('t', 'n')  # t=tipo, n=número por defecto
                    
                    if value is not None and value.text:
                        if cell_type == 's':  # string compartida
                            idx = int(value.text)
                            if idx < len(shared_strings):
                                row_data.append(shared_strings[idx])
                            else:
                                row_data.append(value.text)
                        else:
                            row_data.append(value.text)
                    else:
                        row_data.append('')
                
                if any(row_data):  # Solo agregar filas con datos
                    rows_data.append(row_data)
            
            return rows_data
    except Exception as e:
        print(f"Error parsing {sheet_name}: {e}", file=sys.stderr)
        return []

def main():
    excel_file = 'COTIZADOR MODULE 2025.xlsx'
    
    try:
        with zipfile.ZipFile(excel_file, 'r') as zip_ref:
            # Extraer strings compartidas
            shared_strings = parse_shared_strings(zip_ref)
            print(f"Total de strings compartidas: {len(shared_strings)}\n")
            
            # Analizar cada hoja
            for sheet_num in range(1, 4):
                sheet_name = f'sheet{sheet_num}.xml'
                print(f"\n{'='*80}")
                print(f"HOJA {sheet_num}")
                print(f"{'='*80}\n")
                
                rows = parse_sheet(zip_ref, sheet_name, shared_strings)
                
                if rows:
                    print(f"Total de filas con datos: {len(rows)}")
                    print(f"\nPrimeras 20 filas:\n")
                    for i, row in enumerate(rows[:20], 1):
                        # Limpiar None y vacíos
                        clean_row = [str(cell) if cell else '' for cell in row]
                        if any(clean_row):
                            print(f"Fila {i}: {clean_row}")
                else:
                    print("No hay datos en esta hoja")
    
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
