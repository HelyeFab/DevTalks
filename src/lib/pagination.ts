import { NextRequest } from 'next/server';

/**
 * Interface for pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Interface for pagination results
 */
export interface PaginationResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION: PaginationParams = {
  page: 1,
  limit: 10,
  orderDirection: 'desc'
};

/**
 * Extract pagination parameters from a request URL
 */
export function getPaginationFromRequest(request: NextRequest): PaginationParams {
  const url = new URL(request.url);

  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const orderBy = url.searchParams.get('orderBy') || undefined;
  const orderDirection = url.searchParams.get('orderDirection') as 'asc' | 'desc' | undefined;

  return {
    page: isNaN(page) || page < 1 ? 1 : page,
    limit: isNaN(limit) || limit < 1 || limit > 100 ? 10 : limit,
    orderBy,
    orderDirection: orderDirection === 'asc' || orderDirection === 'desc' ? orderDirection : 'desc'
  };
}

/**
 * Apply pagination to an array of items
 */
export function paginateArray<T>(
  items: T[],
  pagination: PaginationParams
): PaginationResult<T> {
  const total = items.length;
  const totalPages = Math.ceil(total / pagination.limit);
  const start = (pagination.page - 1) * pagination.limit;
  const end = start + pagination.limit;
  const paginatedItems = items.slice(start, end);

  return {
    items: paginatedItems,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasMore: pagination.page < totalPages
    }
  };
}

/**
 * Generate pagination metadata for Firestore queries
 */
export function getPaginationMeta(
  page: number,
  limit: number,
  total: number
) {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages
  };
}
