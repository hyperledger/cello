import logging

from server.celery import app


LOG = logging.getLogger(__name__)


@app.task(name="example_task")
def example_task():
    LOG.info("example task")
    return True
