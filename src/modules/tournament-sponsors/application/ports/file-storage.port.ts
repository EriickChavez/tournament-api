export interface StoredFile {
    url: string;
    key: string;
}

export interface FileStorage {
    upload(input: {
        buffer: Buffer;
        mimeType: string;
        key: string;
    }): Promise<StoredFile>;
    delete(key: string): Promise<void>;
}