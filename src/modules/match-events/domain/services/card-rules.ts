export type CardDecision = 'ok' | 'second_yellow' | 'sent_off';

/**
 * Reglas de tarjetas por jugador y partido.
 * - Expulsado (roja, o dos amarillas): no admite más tarjetas.
 * - Segunda amarilla: se acepta y el sistema genera la roja.
 * - Roja directa: se permite incluso con una amarilla previa.
 */
export function evaluateCardRule(existingCardTypes: string[], next: string): CardDecision {
    const yellows = existingCardTypes.filter((t) => t === 'tarjeta_amarilla').length;
    const hasRed = existingCardTypes.includes('tarjeta_roja');

    if (hasRed || yellows >= 2) return 'sent_off';
    if (next === 'tarjeta_amarilla' && yellows === 1) return 'second_yellow';
    return 'ok';
}