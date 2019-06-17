#
# SPDX-License-Identifier: Apache-2.0
#
"""api_engine URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import os

from django.conf import settings
from django.urls import path, include
from rest_framework import permissions
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework.routers import DefaultRouter
from rest_framework_jwt.views import obtain_jwt_token, verify_jwt_token
from django.conf.urls.static import static

from api.routes.network.views import NetworkViewSet
from api.routes.agent.views import AgentViewSet
from api.routes.node.views import NodeViewSet
from api.routes.organization.views import OrganizationViewSet
from api.routes.user.views import UserViewSet
from api.routes.file.views import FileViewSet

DEBUG = getattr(settings, "DEBUG")
API_VERSION = os.getenv("API_VERSION")
WEBROOT = os.getenv("WEBROOT")
WEBROOT = "/".join(WEBROOT.split("/")[1:]) + "/"


swagger_info = openapi.Info(
    title="Cello API Engine Service",
    default_version=API_VERSION,
    description="""
    This is swagger docs for Cello API engine.
    """,
)

SchemaView = get_schema_view(
    validators=["ssv", "flex"],
    public=True,
    permission_classes=(permissions.AllowAny,),
)

# define and register routers of api
router = DefaultRouter(trailing_slash=False)
router.register("networks", NetworkViewSet, base_name="network")
router.register("agents", AgentViewSet, base_name="agent")
router.register("nodes", NodeViewSet, base_name="node")
router.register("organizations", OrganizationViewSet, base_name="organization")
router.register("users", UserViewSet, base_name="user")
router.register("files", FileViewSet, base_name="file")
# router.register("clusters", ClusterViewSet, base_name="cluster")

urlpatterns = router.urls

urlpatterns += [
    path("auth", obtain_jwt_token),
    path("token-verify", verify_jwt_token),
    path("docs/", SchemaView.with_ui("swagger", cache_timeout=0), name="docs"),
    path("redoc/", SchemaView.with_ui("redoc", cache_timeout=0), name="redoc"),
]

if DEBUG:
    urlpatterns = [path(WEBROOT, include(urlpatterns))]
    urlpatterns += static(
        settings.MEDIA_URL, document_root=settings.MEDIA_ROOT
    )
