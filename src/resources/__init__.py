
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
from .index import bp_index

from .host_api import bp_host_api
from .cluster_api import bp_cluster_api, front_rest_v2

from .cluster_view import bp_cluster_view
from .host_view import bp_host_view

from .stat import bp_stat_api, bp_stat_view
from .auth_api import bp_auth_api
from .login import bp_login
