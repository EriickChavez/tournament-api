import ExcelJS from 'exceljs';
import type {
    CellValue,
    SheetRow,
    SheetSpec,
    SpreadsheetParser,
} from '../../application/ports/spreadsheet-parser.port.js';
import { InvalidImportFileError } from '../../domain/errors/import.errors.js';

/** ExcelJS devuelve objetos para fórmulas, texto enriquecido e hipervínculos; se aplanan a primitivos. */
function normalize(value: unknown): CellValue {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        if ('result' in obj) return normalize(obj.result); // fórmula: valor calculado
        if (Array.isArray(obj.richText)) {
            return (obj.richText as { text?: string }[]).map((part) => part.text ?? '').join('');
        }
        if ('text' in obj) return normalize(obj.text); // hipervínculo: texto visible
    }
    return null;
}

export class ExcelJsSpreadsheetParser implements SpreadsheetParser {
    async parse(buffer: Buffer, specs: SheetSpec[]): Promise<Record<string, SheetRow[]>> {
        const workbook = new ExcelJS.Workbook();
        try {
            // exceljs declara su propio tipo `Buffer` (basado en ArrayBuffer), que choca con
            // el Buffer<ArrayBufferLike> de @types/node recientes. En runtime es el mismo objeto.
            await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
        } catch {
            throw new InvalidImportFileError('The file is not a valid .xlsx workbook.');
        }

        const result: Record<string, SheetRow[]> = {};

        for (const spec of specs) {
            const sheet = workbook.getWorksheet(spec.name);
            if (!sheet) throw new InvalidImportFileError(`Sheet "${spec.name}" was not found.`);

            // Las columnas se ubican por nombre de encabezado, no por posición.
            const columnIndexByName = new Map<string, number>();
            sheet.getRow(1).eachCell((cell, colNumber) => {
                const name = normalize(cell.value);
                if (typeof name === 'string' && name.trim() !== '') {
                    columnIndexByName.set(name.trim().toLowerCase(), colNumber);
                }
            });

            const missing = spec.requiredColumns.filter((c) => !columnIndexByName.has(c));
            if (missing.length > 0) {
                throw new InvalidImportFileError(
                    `Sheet "${spec.name}" is missing column(s): ${missing.join(', ')}.`,
                );
            }

            const columns = [...spec.requiredColumns, ...spec.optionalColumns].filter((c) =>
                columnIndexByName.has(c),
            );
            const rows: SheetRow[] = [];

            sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (rowNumber === 1) return;

                const cells: Record<string, CellValue> = {};
                let hasData = false;
                for (const column of columns) {
                    const index = columnIndexByName.get(column);
                    if (index === undefined) continue;
                    const value = normalize(row.getCell(index).value);
                    cells[column] = value;
                    if (value !== null && !(typeof value === 'string' && value.trim() === '')) {
                        hasData = true;
                    }
                }
                if (hasData) rows.push({ rowNumber, cells });
            });

            if (rows.length > spec.maxRows) {
                throw new InvalidImportFileError(
                    `Sheet "${spec.name}" has more than ${spec.maxRows} rows.`,
                );
            }
            result[spec.name] = rows;
        }

        return result;
    }
}