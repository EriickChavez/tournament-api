import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import type { FileStorage, StoredFile } from '../../application/ports/file-storage.port.js';

const PUBLIC_DIR = join(process.cwd(), 'public', 'tournament-sponsors');
const PUBLIC_URL_PREFIX = '/uploads/tournament-sponsors';

export class LocalDiskTournamentSponsorFileStorage implements FileStorage {
    async upload(input: { buffer: Buffer; mimeType: string; key: string }): Promise<StoredFile> {
        const isPdf = input.mimeType === 'application/pdf';
        const extension = isPdf ? 'pdf' : 'webp';
        const relativePath = `${input.key}.${extension}`;
        const absolutePath = join(PUBLIC_DIR, relativePath);

        await mkdir(dirname(absolutePath), { recursive: true });
        await rm(absolutePath, { force: true });

        if (isPdf) {
            await writeFile(absolutePath, input.buffer);
        } else {
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