export interface CompetitionStateRepository {
    /** true si la categoría tiene algún partido en curso o terminado. */
    hasPlayedMatches(categoryId: string): Promise<boolean>;
    /** Ids de las categorías del torneo con algún partido en curso o terminado. */
    findStartedCategoryIds(tournamentId: string): Promise<string[]>;
}