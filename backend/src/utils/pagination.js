/**
 * Pagination Utility Functions
 * Provides reusable helpers for implementing server-side pagination
 */

/**
 * Extract and validate pagination parameters from request
 * @param {Object} req - Express request object
 * @returns {Object} - { page, pageSize, skip }
 */
export function getPaginationParams(req) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  
  // Validate page and pageSize
  const validPage = Math.max(1, page);
  const validPageSize = Math.max(1, Math.min(100, pageSize)); // Max 100 items per page
  
  const skip = (validPage - 1) * validPageSize;
  
  return { 
    page: validPage, 
    pageSize: validPageSize, 
    skip 
  };
}

/**
 * Extract sorting parameters from request
 * @param {Object} req - Express request object
 * @param {string} defaultSortBy - Default field to sort by
 * @param {string} defaultSortOrder - Default sort order ('asc' or 'desc')
 * @returns {Object} - { sortBy, sortOrder }
 */
export function getSortingParams(req, defaultSortBy = 'id', defaultSortOrder = 'desc') {
  const sortBy = req.query.sortBy || defaultSortBy;
  const sortOrder = req.query.sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';
  
  return { sortBy, sortOrder };
}

/**
 * Build standardized pagination response
 * @param {Array} data - Array of data items
 * @param {number} total - Total count of records
 * @param {number} page - Current page number
 * @param {number} pageSize - Number of items per page
 * @returns {Object} - Standardized pagination response
 */
export function buildPaginationResponse(data, total, page, pageSize) {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

/**
 * Extract search parameter from request
 * @param {Object} req - Express request object
 * @returns {string} - Search term or empty string
 */
export function getSearchParam(req) {
  return req.query.search?.trim() || '';
}
