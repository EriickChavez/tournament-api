// Requiere agregar la dependencia: `npm install sharp`
import { mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import type { FileStorage, StoredFile } from '../../application/ports/file-storage.port.js';

// Carpeta física donde se guardan los archivos. Relativa a la raíz del
// proyecto (cwd del proceso) — ajusta si el server corre desde otro lugar.
const PUBLIC_BRANDING_DIR = join(process.cwd(), 'public', 'branding');

// Prefijo con el que se sirve esa carpeta vía express.static (ver nota de
// montaje en app.ts). La URL resultante queda como `/branding/<key>.webp`.
const PUBLIC_URL_PREFIX = '/branding';

export class LocalDiskFileStorage implements FileStorage {
    async upload(input: { buffer: Buffer; mimeType: string; key: string }): Promise<StoredFile> {
        const relativePath = `${input.key}.webp`;
        const absolutePath = join(PUBLIC_BRANDING_DIR, relativePath);

        await mkdir(dirname(absolutePath), { recursive: true });

        // Se elimina explícitamente el archivo anterior (si existe) antes de
        // escribir el nuevo. El path es siempre el mismo por slug, así que en
        // la práctica esto es un reemplazo, no una acumulación de archivos.
        await rm(absolutePath, { force: true });

        // Se convierte a webp sin importar el formato de entrada (png/jpeg/webp).
        await sharp(input.buffer).webp({ quality: 80 }).toFile(absolutePath);

        return {
            url: `${PUBLIC_URL_PREFIX}/${relativePath}`,
            key: relativePath,
        };
    }

    async delete(key: string): Promise<void> {
        const absolutePath = join(PUBLIC_BRANDING_DIR, key);
        await rm(absolutePath, { force: true });
    }
}