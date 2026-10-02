export type BracketStage = 'play_in' | 'main' | 'third_place';

export interface BracketSeed {
    teamId: string;
    /** 1 = mejor clasificado. */
    seed: number;
}

export type BracketSlot =
    | { kind: 'team'; teamId: string; seed: number }
    | { kind: 'winner' | 'loser'; nodeKey: string };

export interface BracketNodeDraft {
    /** Identificador temporal para referenciar nodos entre sí antes de guardarlos. */
    key: string;
    stage: BracketStage;
    /** play_in: 0. main: 1 = primera ronda, hasta la final. third_place: la ronda de la final. */
    round: number;
    /** Orden dentro de la ronda, desde 0. */
    position: number;
    home: BracketSlot;
    away: BracketSlot;
}

/**
 * Orden estándar de un cuadro de potencia de 2: los cruces consecutivos se enfrentan en la
 * ronda siguiente y el 1 y el 2 solo se encuentran en la final. order(8) = [1,8,4,5,2,7,3,6].
 */
export function standardSeedOrder(size: number): number[] {
    let order = [1];
    while (order.length < size) {
        const total = order.length * 2;
        order = order.flatMap((seed) => [seed, total + 1 - seed]);
    }
    return order;
}

/** Mayor potencia de 2 menor o igual a n. */
function largestPowerOfTwo(n: number): number {
    let power = 1;
    while (power * 2 <= n) power *= 2;
    return power;
}

/**
 * Arma el cuadro de eliminación directa a partir de los clasificados ordenados por seed.
 * - Seeding estándar (mejor vs peor).
 * - Si no son potencia de 2, los peor rankeados juegan una ronda previa (repechaje) y los
 *   mejores pasan directo a la primera ronda; el ganador del repechaje ocupa el lugar del mejor seed.
 * - Cada nodo guarda el origen de sus equipos (equipo directo, ganador o perdedor de otro nodo).
 */
export function buildBracket(
    seeds: BracketSeed[],
    options: { thirdPlace: boolean },
): BracketNodeDraft[] {
    if (seeds.length < 2) throw new Error('A bracket needs at least 2 teams.');

    const bySeed = new Map<number, BracketSeed>();
    for (const item of seeds) {
        if (bySeed.has(item.seed)) throw new Error(`Duplicate seed ${item.seed}.`);
        bySeed.set(item.seed, item);
    }
    const total = seeds.length;
    for (let s = 1; s <= total; s += 1) {
        if (!bySeed.has(s)) throw new Error(`Seeds must be consecutive from 1 to ${total}.`);
    }
    const seedTeam = (seed: number): BracketSlot => {
        const item = bySeed.get(seed);
        if (!item) throw new Error(`Missing seed ${seed}.`);
        return { kind: 'team', teamId: item.teamId, seed: item.seed };
    };

    const size = largestPowerOfTwo(total); // tamaño del cuadro principal
    const direct = 2 * size - total; // seeds que pasan directo: 1..direct
    const playInMatches = total - size;

    const nodes: BracketNodeDraft[] = [];

    // Repechaje: mejor vs peor entre los seeds direct+1 .. total.
    const playInKeyBySlotSeed = new Map<number, string>();
    for (let k = 0; k < playInMatches; k += 1) {
        const better = direct + 1 + k;
        const worse = total - k;
        const key = `play_in:${k}`;
        nodes.push({
            key,
            stage: 'play_in',
            round: 0,
            position: k,
            home: seedTeam(better),
            away: seedTeam(worse),
        });
        // El ganador hereda el lugar del mejor seed en el cuadro principal.
        playInKeyBySlotSeed.set(better, key);
    }

    const slotForSeed = (seed: number): BracketSlot => {
        const playInKey = playInKeyBySlotSeed.get(seed);
        return playInKey ? { kind: 'winner', nodeKey: playInKey } : seedTeam(seed);
    };

    // Primera ronda del cuadro principal.
    const order = standardSeedOrder(size);
    for (let i = 0; i < size / 2; i += 1) {
        nodes.push({
            key: `main:1:${i}`,
            stage: 'main',
            round: 1,
            position: i,
            home: slotForSeed(order[2 * i] as number),
            away: slotForSeed(order[2 * i + 1] as number),
        });
    }

    // Rondas siguientes: el ganador de los nodos 2j y 2j+1 se enfrentan.
    let round = 1;
    let nodesInRound = size / 2;
    while (nodesInRound > 1) {
        round += 1;
        nodesInRound /= 2;
        for (let j = 0; j < nodesInRound; j += 1) {
            nodes.push({
                key: `main:${round}:${j}`,
                stage: 'main',
                round,
                position: j,
                home: { kind: 'winner', nodeKey: `main:${round - 1}:${2 * j}` },
                away: { kind: 'winner', nodeKey: `main:${round - 1}:${2 * j + 1}` },
            });
        }
    }

    // Tercer lugar: los perdedores de las semifinales (solo si hay semifinales).
    if (options.thirdPlace && size >= 4) {
        const semifinalRound = round - 1;
        nodes.push({
            key: 'third_place:0',
            stage: 'third_place',
            round,
            position: 0,
            home: { kind: 'loser', nodeKey: `main:${semifinalRound}:0` },
            away: { kind: 'loser', nodeKey: `main:${semifinalRound}:1` },
        });
    }

    return nodes;
}