#
# SPDX-License-Identifier: Apache-2.0
#
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError
from api.utils.common import make_uuid


SUPER_USER_TOKEN = getattr(settings, "ADMIN_TOKEN", "")


class Govern(models.Model):
    id = models.UUIDField(
        primary_key=True,
        help_text="ID of govern",
        default=make_uuid,
        editable=True,
    )
    name = models.CharField(
        default="", max_length=64, help_text="Name of govern"
    )
    created_at = models.DateTimeField(auto_now_add=True)


class UserModel(models.Model):
    id = models.UUIDField(
        primary_key=True,
        help_text="ID of user",
        default=make_uuid,
        editable=True,
    )
    name = models.CharField(
        default="", help_text="Name of user", max_length=128
    )
    role = models.CharField(
        default="", help_text="Role of User", max_length=64
    )
    govern = models.ForeignKey(
        "Govern",
        null=True,
        on_delete=models.CASCADE,
        help_text="Govern of user",
    )


class Token(models.Model):
    token = models.TextField(default="")
    user = models.ForeignKey(UserModel, on_delete=models.CASCADE)
    expire_date = models.DateTimeField(null=True)


class User(AbstractUser):
    username = models.CharField(default="", max_length=128, unique=True)
    token = models.CharField(default="", max_length=128)
    role = models.CharField(default="", max_length=64)
    user_model = UserModel()

    def __str__(self):
        return self.username

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True

    @property
    def user_id(self):
        return self.user_model.id
