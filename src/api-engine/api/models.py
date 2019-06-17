#
# SPDX-License-Identifier: Apache-2.0
#
import os
import shutil
import tarfile
from zipfile import ZipFile
from pathlib import Path

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres.fields import JSONField
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.dispatch import receiver
from django.db.models.signals import post_save

from api.common.enums import (
    HostStatus,
    LogLevel,
    HostType,
    K8SCredentialType,
    separate_upper_class,
    NodeStatus,
    FileType,
)
from api.common.enums import (
    UserRole,
    NetworkType,
    FabricNodeType,
    FabricVersions,
)
from api.utils.common import make_uuid, random_name, hash_file

SUPER_USER_TOKEN = getattr(settings, "ADMIN_TOKEN", "")
MAX_CAPACITY = getattr(settings, "MAX_AGENT_CAPACITY", 100)
MAX_NODE_CAPACITY = getattr(settings, "MAX_NODE_CAPACITY", 600)
MEDIA_ROOT = getattr(settings, "MEDIA_ROOT")
LIMIT_K8S_CONFIG_FILE_MB = 100
# Limit file upload size less than 100Mb
LIMIT_FILE_MB = 100
MIN_PORT = 1
MAX_PORT = 65535


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


class UserProfile(AbstractUser):
    id = models.UUIDField(
        primary_key=True,
        help_text="ID of user",
        default=make_uuid,
        editable=True,
    )
    role = models.CharField(
        choices=UserRole.to_choices(True),
        default=UserRole.User.value,
        max_length=64,
    )
    organization = models.ForeignKey(
        Organization, null=True, on_delete=models.CASCADE
    )

    class Meta:
        verbose_name = "User Info"
        verbose_name_plural = verbose_name
        ordering = ["-date_joined"]

    def __str__(self):
        return self.username

    @property
    def is_administrator(self):
        return self.role == UserRole.Administrator.name.lower()

    @property
    def is_operator(self):
        return self.role == UserRole.Operator.name.lower()

    @property
    def is_common_user(self):
        return self.role == UserRole.User.name.lower()


def get_agent_config_file_path(instance, file):
    file_ext = file.split(".")[-1]
    filename = "%s.%s" % (hash_file(instance.config_file), file_ext)

    return os.path.join("config_files/%s" % str(instance.id), filename)


def validate_agent_config_file(file):
    file_size = file.size
    if file_size > LIMIT_K8S_CONFIG_FILE_MB * 1024 * 1024:
        raise ValidationError(
            "Max file size is %s MB" % LIMIT_K8S_CONFIG_FILE_MB
        )


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
    image = models.CharField(
        help_text="Image name for deploy agent", max_length=64, default=""
    )
    ip = models.GenericIPAddressField(help_text="Agent IP Address")
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
    config_file = models.FileField(
        help_text="Config file for agent",
        max_length=256,
        blank=True,
        upload_to=get_agent_config_file_path,
    )
    created_at = models.DateTimeField(
        help_text="Create time of agent", auto_now_add=True
    )

    def delete(self, using=None, keep_parents=False):
        if self.config_file:
            if os.path.isfile(self.config_file.path):
                os.remove(self.config_file.path)
                shutil.rmtree(
                    os.path.dirname(self.config_file.path), ignore_errors=True
                )

        super(Agent, self).delete(using, keep_parents)

    class Meta:
        ordering = ("-created_at",)


@receiver(post_save, sender=Agent)
def extract_file(sender, instance, created, *args, **kwargs):
    if created:
        if instance.config_file:
            file_format = instance.config_file.name.split(".")[-1]
            if file_format in ["tgz", "gz"]:
                tar = tarfile.open(instance.config_file.path)
                tar.extractall(path=os.path.dirname(instance.config_file.path))
            elif file_format == "zip":
                with ZipFile(instance.config_file.path, "r") as zip_file:
                    zip_file.extractall(
                        path=os.path.dirname(instance.config_file.path)
                    )


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
        UserProfile,
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
    external = models.IntegerField(
        help_text="External port",
        default=0,
        validators=[MinValueValidator(MIN_PORT), MaxValueValidator(MAX_PORT)],
    )
    internal = models.IntegerField(
        help_text="Internal port",
        default=0,
        validators=[MinValueValidator(MIN_PORT), MaxValueValidator(MAX_PORT)],
    )

    class Meta:
        ordering = ("external",)


def get_file_path(instance, file):
    """
    Get the file path where will be stored in
    :param instance: database object of this db record
    :param file: file object.
    :return: path of file system which will store the file.
    """
    file_ext = file.split(".")[-1]
    filename = "%s.%s" % (hash_file(instance.file), file_ext)

    return os.path.join(
        "files/%s/%s" % (str(instance.organization.id), str(instance.id)),
        filename,
    )


def validate_file(file):
    """
    Validate file of upload
    :param file: file object
    :return: raise exception if validate failed
    """
    file_size = file.size
    if file_size > LIMIT_FILE_MB * 1024 * 1024:
        raise ValidationError("Max file size is %s MB" % LIMIT_FILE_MB)


class File(models.Model):
    id = models.UUIDField(
        primary_key=True,
        help_text="ID of file",
        default=make_uuid,
        editable=True,
    )
    organization = models.ForeignKey(
        Organization,
        help_text="Organization of file",
        null=True,
        on_delete=models.CASCADE,
    )
    name = models.CharField(help_text="File name", max_length=64, default="")
    file = models.FileField(
        help_text="File", max_length=256, blank=True, upload_to=get_file_path
    )
    created_at = models.DateTimeField(
        help_text="Create time of agent", auto_now_add=True
    )
    type = models.CharField(
        choices=FileType.to_choices(True),
        max_length=32,
        help_text="File type",
        default=FileType.Certificate.name.lower(),
    )

    class Meta:
        ordering = ("-created_at",)
