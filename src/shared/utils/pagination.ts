import { z } from 'zod';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type PaginationParams = z.infer<typeof paginationQuerySchema>;

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface Paginated<T> {
    items: T[];
    total: number;
}

export function buildPaginationMeta(params: PaginationParams, total: number): PaginationMeta {
    return {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / params.limit),
    };
}

export function toOffset(params: PaginationParams): number {
    return (params.page - 1) * params.limit;
}