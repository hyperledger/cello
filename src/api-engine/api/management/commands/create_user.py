import logging

from django.core.exceptions import ObjectDoesNotExist
from django.core.management.base import BaseCommand
from api.models import UserProfile

LOG = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Create user"

    def add_arguments(self, parser):
        parser.add_argument("--username", help="Username", required=True)
        parser.add_argument(
            "--is_superuser", action="store_true", required=True
        )
        parser.add_argument(
            "--password", help="Password of new user", required=True
        )
        parser.add_argument("--email", help="Email of new user", required=True)
        parser.add_argument("--role", help="role of new user", required=True)
        parser.add_argument(
            "--force",
            help="whether force create user",
            required=False,
            action="store_true",
        )

    def handle(self, *args, **options):
        username = options.get("username")
        password = options.get("password")
        role = options.get("role")
        email = options.get("email")
        is_superuser = options.get("is_superuser", False)
        force = options.get("force", False)

        try:
            user = UserProfile.objects.get(email=email)
        except ObjectDoesNotExist:
            user = UserProfile(
                username=username,
                role=role,
                email=email,
                is_superuser=is_superuser,
            )
            user.set_password(password)
            user.save()
        else:
            if force:
                user.username = username
                user.role = role
                user.is_superuser = is_superuser
                user.set_password(password)
                user.save()
        self.stdout.write(
            self.style.SUCCESS("Create user successfully %s" % user.id)
        )
