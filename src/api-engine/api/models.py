#
# SPDX-License-Identifier: Apache-2.0
#
import os
import shutil
from pathlib import Path

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
    NodeStatus,
)
from api.common.enums import (
    UserRole,
    NetworkType,
    FabricNodeType,
    FabricVersions,
)
from api.utils.common import make_uuid, random_name

SUPER_USER_TOKEN = getattr(settings, "ADMIN_TOKEN", "")
MAX_CAPACITY = getattr(settings, "MAX_AGENT_CAPACITY", 100)
MAX_NODE_CAPACITY = getattr(settings, "MAX_NODE_CAPACITY", 600)
MEDIA_ROOT = getattr(settings, "MEDIA_ROOT")


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


class Organization(models.Model):
    id = models.UUIDField(
        primary_key=True,
        help_text="ID of organization",
        default=make_uuid,
        editable=True,
    )
    name = models.CharField(
        default="", max_length=64, help_text="Name of organization"
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
    organization = models.ForeignKey(
        "Organization",
        null=True,
        on_delete=models.CASCADE,
        help_text="Organization of user",
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
    def is_common_user(self):
        return self.role == UserRole.User.name.lower()

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
    govern = models.ForeignKey(
        Govern,
        help_text="Govern of agent",
        null=True,
        on_delete=models.CASCADE,
    )
    organization = models.ForeignKey(
        "Organization",
        null=True,
        on_delete=models.CASCADE,
        help_text="Organization of agent",
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
    node_capacity = models.IntegerField(
        help_text="Capacity of node",
        default=6,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(MAX_NODE_CAPACITY),
        ],
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


class Network(models.Model):
    id = models.UUIDField(
        primary_key=True,
        help_text="ID of network",
        default=make_uuid,
        editable=True,
    )
    govern = models.ForeignKey(
        Govern, help_text="Govern of node", null=True, on_delete=models.CASCADE
    )
    version = models.CharField(
        help_text="""
    Version of network.
    Fabric supported versions: %s
    """
        % (FabricVersions.values()),
        max_length=64,
        default="",
    )
    created_at = models.DateTimeField(
        help_text="Create time of network", auto_now_add=True
    )

    class Meta:
        ordering = ("-created_at",)


def get_compose_file_path(instance, file):
    return os.path.join(
        "org/%s/agent/docker/compose_files/%s"
        % (str(instance.organization.id), str(instance.id)),
        "docker-compose.yml",
    )


class Node(models.Model):
    id = models.UUIDField(
        primary_key=True,
        help_text="ID of node",
        default=make_uuid,
        editable=True,
    )
    name = models.CharField(help_text="Node name", max_length=64, default="")
    network_type = models.CharField(
        help_text="Network type of node",
        choices=NetworkType.to_choices(True),
        default=NetworkType.Fabric.name.lower(),
        max_length=64,
    )
    network_version = models.CharField(
        help_text="""
    Version of network for node.
    Fabric supported versions: %s
    """
        % (FabricVersions.values()),
        max_length=64,
        default="",
    )
    type = models.CharField(
        help_text="""
    Node type defined for network.
    Fabric available types: %s
    """
        % (FabricNodeType.names()),
        max_length=64,
    )
    urls = JSONField(
        help_text="URL configurations for node",
        null=True,
        blank=True,
        default=dict,
    )
    user = models.ForeignKey(
        UserModel,
        help_text="User of node",
        null=True,
        on_delete=models.CASCADE,
    )
    govern = models.ForeignKey(
        Govern, help_text="Govern of node", null=True, on_delete=models.CASCADE
    )
    organization = models.ForeignKey(
        Organization,
        help_text="Organization of node",
        null=True,
        on_delete=models.CASCADE,
    )
    agent = models.ForeignKey(
        Agent, help_text="Agent of node", null=True, on_delete=models.CASCADE
    )
    network = models.ForeignKey(
        Network,
        help_text="Network which node joined.",
        on_delete=models.CASCADE,
        null=True,
    )
    created_at = models.DateTimeField(
        help_text="Create time of network", auto_now_add=True
    )
    status = models.CharField(
        help_text="Status of node",
        choices=NodeStatus.to_choices(True),
        max_length=64,
        default=NodeStatus.Deploying.name.lower(),
    )
    compose_file = models.FileField(
        help_text="Compose file for node, if agent type is docker.",
        max_length=256,
        upload_to=get_compose_file_path,
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ("-created_at",)

    def get_compose_file_path(self):
        return "%s/org/%s/agent/docker/compose_files/%s/docker-compose.yml" % (
            MEDIA_ROOT,
            str(self.organization.id),
            str(self.id),
        )

    def save(
        self,
        force_insert=False,
        force_update=False,
        using=None,
        update_fields=None,
    ):
        if self.name == "":
            self.name = random_name(self.type)
        super(Node, self).save(
            force_insert, force_update, using, update_fields
        )

    def delete(self, using=None, keep_parents=False):
        if self.compose_file:
            compose_file_path = Path(self.compose_file.path)
            if os.path.isdir(os.path.dirname(compose_file_path)):
                shutil.rmtree(os.path.dirname(compose_file_path))

        super(Node, self).delete(using, keep_parents)


class Port(models.Model):
    node = models.ForeignKey(
        Node, help_text="Node of port", on_delete=models.CASCADE, null=True
    )
    external = models.IntegerField(help_text="External port", default=0)
    internal = models.IntegerField(help_text="Internal port", default=0)

    class Meta:
        ordering = ("external",)
