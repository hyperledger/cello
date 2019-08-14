function paginator(items, page, perPage) {

  let targetPage = page;
  const totalPages = Math.ceil(items.length / perPage);

  if (totalPages < page) {
    targetPage = totalPages;
  }

  const offset = (targetPage - 1) * perPage;
  const paginatedItems = items.slice(offset).slice(0, perPage);

  return {
    targetPage,
    perPage,
    prePage: targetPage - 1 ? targetPage - 1 : null,
    nextPage: (totalPages > targetPage) ? targetPage + 1 : null,
    total: items.length,
    totalPages,
    data: paginatedItems
  };
}

module.exports = {
  paginator,
};
