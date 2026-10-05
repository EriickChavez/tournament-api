/**
 * Puerto para saber si hay una llave construida a partir de una fase de grupos. Lo cumple el
 * repositorio de llaves, así que phases no depende del módulo de llaves.
 */
export interface BracketDependencyChecker {
    existsBySourcePhaseId(sourcePhaseId: string): Promise<boolean>;
}