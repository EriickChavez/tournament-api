/**
 * Puerto para saber si el campeonato de una categoría está cerrado. Lo cumple el repositorio
 * de cierres, así phases no depende del módulo category-closures.
 */
export interface CategoryClosureChecker {
    isClosed(categoryId: string): Promise<boolean>;
}