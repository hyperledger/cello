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
from django.urls import path
from rest_framework import permissions
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework.routers import DefaultRouter
from api.routes.network.views import NetworkViewSet
from api.routes.host.views import HostViewSet
from api.routes.node.views import NodeViewSet


swagger_info = openapi.Info(
    title="Cello API Engine Service",
    default_version="v1",
    description="""
    This is swagger docs for Cello API engine.
    """,
)

SchemaView = get_schema_view(
    validators=["ssv", "flex"],
    public=True,
    permission_classes=(permissions.AllowAny,),
)

router = DefaultRouter()
router.register("networks", NetworkViewSet, base_name="network")
router.register("hosts", HostViewSet, base_name="host")
router.register("nodes", NodeViewSet, base_name="node")

urlpatterns = router.urls

urlpatterns += [
    path("docs/", SchemaView.with_ui("swagger", cache_timeout=0), name="docs"),
    path("redoc/", SchemaView.with_ui("redoc", cache_timeout=0), name="redoc"),
]
