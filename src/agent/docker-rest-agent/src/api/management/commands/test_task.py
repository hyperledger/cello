from django.core.management import BaseCommand
from api.tasks import example_task
from django_celery_beat.models import IntervalSchedule, PeriodicTask


class Command(BaseCommand):
    help = "Test Task"

    def handle(self, *args, **options):
        interval = IntervalSchedule.objects.first()
        PeriodicTask.objects.create(
            interval=interval, name="example", task="server.tasks.example_task"
        )
        # example_task.delay()
