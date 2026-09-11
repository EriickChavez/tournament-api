import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import type { FileStorage, StoredFile } from '../../application/ports/file-storage.port.js';

// Carpeta física donde se guardan los archivos, relativa a la raíz del
// proyecto (cwd del proceso) — igual criterio que LocalDiskFileStorage de
// branding, ver ese módulo para más contexto.
const PUBLIC_DIR = join(process.cwd(), 'public', 'app-sponsors');

// Prefijo con el que se sirve esa carpeta vía express.static (ver montaje en
// app.ts). Deliberadamente distinto de `/sponsors`, que ya es la ruta de la
// API pública para listar patrocinadores.
const PUBLIC_URL_PREFIX = '/uploads/app-sponsors';

export class LocalDiskAppSponsorFileStorage implements FileStorage {
    async upload(input: { buffer: Buffer; mimeType: string; key: string }): Promise<StoredFile> {
        const isPdf = input.mimeType === 'application/pdf';
        const extension = isPdf ? 'pdf' : 'webp';
        const relativePath = `${input.key}.${extension}`;
        const absolutePath = join(PUBLIC_DIR, relativePath);

        await mkdir(dirname(absolutePath), { recursive: true });
        await rm(absolutePath, { force: true });

        if (isPdf) {
            // Los pdfs se guardan tal cual llegan, sin conversión.
            await writeFile(absolutePath, input.buffer);
        } else {
            // El logo siempre se normaliza a webp, igual que branding.
            await sharp(input.buffer).webp({ quality: 80 }).toFile(absolutePath);
        }

        return {
            url: `${PUBLIC_URL_PREFIX}/${relativePath}`,
            key: relativePath,
        };
    }

    async delete(key: string): Promise<void> {
        const absolutePath = join(PUBLIC_DIR, key);
        await rm(absolutePath, { force: true });
    }
}