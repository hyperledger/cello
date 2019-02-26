#
# SPDX-License-Identifier: Apache-2.0
#

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres.fields import JSONField
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from api.common.enums import (
    HostStatus,
    LogLevel,
    HostType,
    K8SCredentialType,
    separate_upper_class,
)
from api.common.enums import UserRole
from api.utils.common import make_uuid, random_name

SUPER_USER_TOKEN = getattr(settings, "ADMIN_TOKEN", "")
MAX_CAPACITY = getattr(settings, "MAX_AGENT_CAPACITY", 100)


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
        choices=UserRole.to_choices(True),
        default=UserRole.User.name.lower(),
        help_text="Role of User",
        max_length=64,
    )
    govern = models.ForeignKey(
        "Govern",
        null=True,
        on_delete=models.CASCADE,
        help_text="Govern of user",
    )
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Create time of user"
    )

    class Meta:
        ordering = ("-created_at",)


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
    def is_administrator(self):
        return self.role == UserRole.Administrator.name.lower()

    @property
    def is_operator(self):
        return self.role == UserRole.Operator.name.lower()

    @property
    def user_id(self):
        return self.user_model.id


class Agent(models.Model):
    id = models.UUIDField(
        primary_key=True,
        help_text="ID of agent",
        default=make_uuid,
        editable=True,
    )
    name = models.CharField(
        help_text="Agent name, can be generated automatically.",
        max_length=64,
        default=random_name("agent"),
    )
    worker_api = models.CharField(
        help_text="Worker api of agent", max_length=128, default=""
    )
    user = models.ForeignKey(
        UserModel,
        help_text="User of agent",
        null=True,
        on_delete=models.CASCADE,
    )
    status = models.CharField(
        help_text="Status of agent",
        choices=HostStatus.to_choices(True),
        max_length=10,
        default=HostStatus.Active.name.lower(),
    )
    log_level = models.CharField(
        help_text="Log level of agent",
        choices=LogLevel.to_choices(True),
        max_length=10,
        default=LogLevel.Info.name.lower(),
    )
    type = models.CharField(
        help_text="Type of agent",
        choices=HostType.to_choices(True),
        max_length=32,
        default=HostType.Docker.name.lower(),
    )
    schedulable = models.BooleanField(
        help_text="Whether agent can be scheduled", default=True
    )
    capacity = models.IntegerField(
        help_text="Capacity of agent",
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(MAX_CAPACITY)],
    )
    created_at = models.DateTimeField(
        help_text="Create time of agent", auto_now_add=True
    )

    class Meta:
        ordering = ("-created_at",)


class KubernetesConfig(models.Model):
    credential_type = models.CharField(
        help_text="Credential type of k8s",
        choices=K8SCredentialType.to_choices(separate_class_name=True),
        max_length=32,
        default=separate_upper_class(K8SCredentialType.CertKey.name),
    )
    enable_ssl = models.BooleanField(
        help_text="Whether enable ssl for api", default=False
    )
    ssl_ca = models.TextField(
        help_text="Ca file content for ssl", default="", blank=True
    )
    nfs_server = models.CharField(
        help_text="NFS server address for k8s",
        default="",
        max_length=256,
        blank=True,
    )
    parameters = JSONField(
        help_text="Extra parameters for kubernetes",
        default=dict,
        null=True,
        blank=True,
    )
    cert = models.TextField(
        help_text="Cert content for k8s", default="", blank=True
    )
    key = models.TextField(
        help_text="Key content for k8s", default="", blank=True
    )
    username = models.CharField(
        help_text="Username for k8s credential",
        default="",
        max_length=128,
        blank=True,
    )
    password = models.CharField(
        help_text="Password for k8s credential",
        default="",
        max_length=128,
        blank=True,
    )
    agent = models.ForeignKey(
        Agent,
        help_text="Agent of kubernetes config",
        on_delete=models.CASCADE,
        null=True,
    )
