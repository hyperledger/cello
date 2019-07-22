function paginator(items, page, perPage) {

  const offset = (page - 1) * perPage;
  const paginatedItems = items.slice(offset).slice(0, perPage);
  const totalPages = Math.ceil(items.length / perPage);

  return {
    page,
    perPage,
    prePage: page - 1 ? page - 1 : null,
    nextPage: (totalPages > page) ? page + 1 : null,
    total: items.length,
    totalPages,
    data: paginatedItems
  };
}

module.exports = {
  paginator,
};
