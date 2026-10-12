/**
 * Quién puede operar la cédula de un partido (iniciar, finalizar, reabrir, eventos):
 * el owner siempre; los demás solo si están asignados. Si el partido no tiene árbitros
 * asignados, cualquier admin puede (compatible con el flujo actual del panel).
 */
export function canOperateMatch(input: {
    isOwner: boolean;
    assignedUserIds: string[];
    userId: string;
}): boolean {
    return (
        input.isOwner ||
        input.assignedUserIds.length === 0 ||
        input.assignedUserIds.includes(input.userId)
    );
}