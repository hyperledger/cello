from django.core.paginator import Paginator
from django.db.models import Func


class Round(Func):
    function = "ROUND"
    arity = 2


def paginate_list(data=None, page=1, per_page=10, limit=None):
    if not data:
        data = []

    total = len(data)

    if per_page != -1:
        p = Paginator(data, per_page)
        last_page = p.page_range[-1]
        page = page if page <= last_page else last_page
        data = p.page(page)
        total = p.count
    else:
        if limit:
            data = data[:limit]

    return data, total
