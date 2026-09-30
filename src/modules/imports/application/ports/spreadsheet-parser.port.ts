export type CellValue = string | number | boolean | Date | null;

export interface SheetRow {
    /** Número de fila tal como lo ve el usuario en Excel (el encabezado es la 1). */
    rowNumber: number;
    cells: Record<string, CellValue>;
}

export interface SheetSpec {
    name: string;
    requiredColumns: string[];
    optionalColumns: string[];
    maxRows: number;
}

export interface SpreadsheetParser {
    /** Devuelve las filas con datos de cada hoja, indexadas por nombre de hoja. */
    parse(buffer: Buffer, specs: SheetSpec[]): Promise<Record<string, SheetRow[]>>;
}