/**
 * Puerto para saber si todavía se puede modificar la plantilla (equipos y jugadores) de una
 * categoría. Lo cumple el módulo competition-state; así teams, players e imports no dependen de él.
 */
export interface CompetitionGuard {
    /**
     * Alta, baja o traslado de equipos y jugadores: solo mientras la categoría no ha empezado
     * ni está cerrada. Lanza si ya empezó o ya terminó.
     */
    assertRosterOpen(categoryId: string): Promise<void>;
    /**
     * Corregir datos de equipos o jugadores que ya existen (nombre, dorsal...): se permite
     * durante el torneo y se bloquea al cerrar el campeonato. Lanza si ya terminó.
     */
    assertRosterEditable(categoryId: string): Promise<void>;
}