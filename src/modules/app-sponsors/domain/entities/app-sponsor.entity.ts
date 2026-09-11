export interface AppSponsor {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  /**
   * Storage key del logo cuando el archivo vive en nuestro storage (subido
   * como archivo). Es `null` cuando `logoUrl` apunta a una URL externa —
   * en ese caso no hay nada que borrar cuando el sponsor se reemplaza o
   * elimina.
   */
  logoStorageKey: string | null;
  websiteUrl: string | null;
  pdfUrl: string | null;
  /** Mismo criterio que logoStorageKey, pero para el pdf opcional. */
  pdfStorageKey: string | null;
  order: number;
  isActive: boolean;
  /** Fecha en formato YYYY-MM-DD, o null si no hay límite. */
  startDate: string | null;
  /** Fecha en formato YYYY-MM-DD, o null si no hay límite. */
  endDate: string | null;
  createdByAdminId: string | null;
  createdAt: Date;
  updatedByAdminId: string | null;
  updatedAt: Date;
}