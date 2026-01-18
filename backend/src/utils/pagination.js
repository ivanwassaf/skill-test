/**
 * Pagination Utility
 * Provides standardized pagination for list endpoints
 */

/**
 * Calculate pagination metadata
 * @param {number} page - Current page number (1-indexed)
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} Pagination metadata
 */
function getPaginationMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    currentPage: page,
    itemsPerPage: limit,
    totalItems: total,
    totalPages: totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null,
  };
}

/**
 * Calculate SQL offset for pagination
 * @param {number} page - Current page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {number} SQL OFFSET value
 */
function getOffset(page, limit) {
  return (page - 1) * limit;
}

/**
 * Parse and validate pagination parameters from request query
 * @param {Object} query - Express request query object
 * @param {Object} options - Configuration options
 * @param {number} options.defaultLimit - Default items per page (default: 10)
 * @param {number} options.maxLimit - Maximum items per page (default: 100)
 * @returns {Object} Validated pagination params
 */
function parsePaginationParams(query = {}, options = {}) {
  const defaultLimit = options.defaultLimit || 10;
  const maxLimit = options.maxLimit || 100;
  
  // Parse page (default: 1, min: 1)
  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }
  
  // Parse limit (default: defaultLimit, min: 1, max: maxLimit)
  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  }
  if (limit > maxLimit) {
    limit = maxLimit;
  }
  
  return {
    page,
    limit,
    offset: getOffset(page, limit),
  };
}

/**
 * Parse sorting parameters from request query
 * @param {Object} query - Express request query object
 * @param {Array<string>} allowedFields - Allowed fields for sorting
 * @param {string} defaultField - Default sort field
 * @param {string} defaultOrder - Default sort order ('ASC' or 'DESC')
 * @returns {Object} Validated sorting params
 */
function parseSortingParams(query = {}, allowedFields = [], defaultField = 'id', defaultOrder = 'ASC') {
  let sortBy = query.sortBy || defaultField;
  let sortOrder = (query.sortOrder || defaultOrder).toUpperCase();
  
  // Validate sortBy field
  if (!allowedFields.includes(sortBy)) {
    sortBy = defaultField;
  }
  
  // Validate sortOrder
  if (!['ASC', 'DESC'].includes(sortOrder)) {
    sortOrder = defaultOrder;
  }
  
  return {
    sortBy,
    sortOrder,
  };
}

/**
 * Build pagination response with data and metadata
 * @param {Array} data - List of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} Formatted response
 */
function buildPaginatedResponse(data, page, limit, total) {
  return {
    data,
    pagination: getPaginationMeta(page, limit, total),
  };
}

/**
 * Build SQL query with pagination and sorting
 * @param {string} baseQuery - Base SQL query
 * @param {Object} params - Pagination and sorting parameters
 * @param {number} params.limit - Items per page
 * @param {number} params.offset - SQL offset
 * @param {string} params.sortBy - Field to sort by
 * @param {string} params.sortOrder - Sort order (ASC/DESC)
 * @returns {string} Complete SQL query
 */
function buildPaginatedQuery(baseQuery, params) {
  const { limit, offset, sortBy, sortOrder } = params;
  return `${baseQuery} ORDER BY ${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`;
}

/**
 * Middleware to add pagination to request object
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
function paginationMiddleware(options = {}) {
  return (req, res, next) => {
    req.pagination = parsePaginationParams(req.query, options);
    next();
  };
}

/**
 * Parse filter parameters from request query
 * Safely extracts filtering parameters, excluding pagination/sorting
 * @param {Object} query - Express request query object
 * @param {Array<string>} allowedFilters - Allowed filter fields
 * @returns {Object} Filter parameters
 */
function parseFilterParams(query = {}, allowedFilters = []) {
  const filters = {};
  const excludeParams = ['page', 'limit', 'sortBy', 'sortOrder'];
  
  Object.keys(query).forEach(key => {
    if (!excludeParams.includes(key) && allowedFilters.includes(key)) {
      filters[key] = query[key];
    }
  });
  
  return filters;
}

/**
 * Build WHERE clause from filter parameters
 * @param {Object} filters - Filter parameters
 * @param {number} startIndex - Starting index for parameter placeholders
 * @returns {Object} WHERE clause and values
 */
function buildWhereClause(filters = {}, startIndex = 1) {
  const conditions = [];
  const values = [];
  let paramIndex = startIndex;
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      conditions.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  return {
    whereClause,
    values,
    nextParamIndex: paramIndex,
  };
}

module.exports = {
  getPaginationMeta,
  getOffset,
  parsePaginationParams,
  parseSortingParams,
  parseFilterParams,
  buildPaginatedResponse,
  buildPaginatedQuery,
  buildWhereClause,
  paginationMiddleware,
};
