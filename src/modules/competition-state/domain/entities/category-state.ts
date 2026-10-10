/**
 * Estado de una categoría dentro del torneo:
 * - not_started: ningún partido en curso ni terminado.
 * - in_progress: al menos un partido en curso o terminado y el campeonato sigue abierto.
 * - finished: el campeonato está cerrado.
 */
export type CategoryState = 'not_started' | 'in_progress' | 'finished';

/**
 * Estado del torneo a partir del de sus categorías. Si hay mezcla (unas terminadas y otras sin
 * empezar) se considera en curso: el torneo ya empezó pero aún no termina del todo.
 */
export function deriveTournamentState(states: CategoryState[]): CategoryState {
    if (states.length === 0) return 'not_started';
    if (states.every((state) => state === 'not_started')) return 'not_started';
    if (states.every((state) => state === 'finished')) return 'finished';
    return 'in_progress';
}