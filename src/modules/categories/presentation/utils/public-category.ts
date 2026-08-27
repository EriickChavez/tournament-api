import type { Category } from '../../domain/entities/category.entity.js';

export function toPublicCategory(category: Category) {
    return {
        id: category.id,
        tournamentId: category.tournamentId,
        title: category.title,
        minAge: category.minAge,
        maxAge: category.maxAge,
        description: category.description,
        order: category.order,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
    };
}
