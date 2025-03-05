/**
 * Parse total pages
 * @param {Number} totalCount - Total counts
 * @param {Number} limit - Limit per page
 */
const parseTotalPages = (totalCount, limit) => {
    return Math.ceil(totalCount / limit);
};

/**
 * Parse query limit
 * @param {Number} queryLimit - The limit from the query
 */
const parseLimit = queryLimit => {
    return parseInt(queryLimit && parseInt(queryLimit) !== 0 ? queryLimit : 10);
};

/**
 * Parse current page
 * @param {Number} queryPage - The current page from the query
 */
const parseCurrentPage = queryPage => {
    return parseInt(queryPage && parseInt(queryPage) !== 0 ? queryPage : 1);
};

/**
 * Pagination Object
 * @param {Number} totalCount - Total counts
 * @param {Number} page - Current Page
 * @param {Number} queryLimit - Limit
 */
const pagination = (totalCount, page, queryLimit = 10) => {
    const limit = parseLimit(queryLimit);
    const currentPage = parseCurrentPage(page);
    const totalPages = parseTotalPages(totalCount, limit);
    // Returns data for pagination
    return {
        totalCount,
        totalPages,
        currentPage: currentPage,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
        prevPage: currentPage <= totalPages && currentPage !== 1 ? currentPage - 1 : null,
    };
};

// Export the functions using CommonJS syntax
module.exports = {
    parseTotalPages,
    parseLimit,
    parseCurrentPage,
    pagination,
};
