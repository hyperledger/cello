from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from api.utils.db_functions import make_uuid


class User(AbstractUser):
    roles = []

    id = models.UUIDField(
        primary_key=True,
        help_text="ID of user",
        default=make_uuid,
        editable=True,
    )
    username = models.CharField(default="", max_length=128, unique=True)

    def __str__(self):
        return self.username


class Profile(models.Model):
    user = models.OneToOneField(
        User, related_name="profile", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "%s's profile" % self.user

    class Meta:
        ordering = ("-created_at",)


def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


post_save.connect(create_user_profile, sender=User)

# Create your models here.
