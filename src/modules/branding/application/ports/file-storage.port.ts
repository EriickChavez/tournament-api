export interface StoredFile {
    url: string;
    key: string;
}

export interface FileStorage {
    upload(input: {
        buffer: Buffer;
        mimeType: string;
        /**
         * Ruta base sugerida, SIN extensión — ej. `torneos/mi-slug/mi-slug-logo`.
         * El adapter decide y agrega la extensión final (ej. LocalDiskFileStorage
         * siempre convierte a `.webp`, sin importar el mimeType de entrada).
         */
        key: string;
    }): Promise<StoredFile>;
    delete(key: string): Promise<void>;
}