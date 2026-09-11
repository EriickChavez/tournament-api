export interface StoredFile {
    url: string;
    key: string;
}

export interface FileStorage {
    upload(input: {
        buffer: Buffer;
        mimeType: string;
        /**
         * Nombre base sugerido, SIN extensión — el adapter decide y agrega
         * la extensión final según el mimeType (logo -> .webp, pdf -> .pdf).
         */
        key: string;
    }): Promise<StoredFile>;
    delete(key: string): Promise<void>;
}