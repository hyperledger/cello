
#
#
# SPDX-License-Identifier: Apache-2.0
#
from unittest.mock import patch
from flask_testing import TestCase
import sys
import os
import logging
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'src'))
from dashboard import app
from common import log_handler, LOG_LEVEL

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

MOCK_HOST="1.1.1.1:1111"

def check_daemon_stub(worker_api, timeout=5):
    return True

def docker_stub(worker_api):
    return "docker"

def swarm_stub(worker_api):
    return "swarm"

def setup_container_host_stub(*args, **kargs):
    return True

def cleanup_stub(*args, **kargs):
    return True

@patch("agent.docker.host.check_daemon", check_daemon_stub)
@patch("agent.docker.host.setup_container_host", check_daemon_stub)
@patch("agent.docker.host.cleanup_host", cleanup_stub)
class HostCreateTest(TestCase):
    def create_app(self):
        """
        Create a flask web app
        :return: flask web app object
        """
        app.config['TESTING'] = True
        app.config['LOGIN_DISABLED'] = True
        app.config['PRESERVE_CONTEXT_ON_EXCEPTION'] = False
        return app

    def _remove_all_hosts(self):
        res = self.client.get('/api/hosts')
        hosts = res.data.decode('utf-8')
        hosts = json.loads(hosts)
        for h in hosts['data']:
            self.client.delete('/api/host', data=dict(id=h['id']))

    @patch("resources.host_api.detect_daemon_type", swarm_stub)
    @patch("agent.docker.host.detect_daemon_type", swarm_stub)
    def test_swarm_host_create_on_swarm(self):
        '''
        create a swarm host successfully if it's really a swarm host
        '''
        self._remove_all_hosts()
        res = self._test_host_create("swarm")
        self.assert200(res, "create {} swarm host test failed".format("swarm"))

    @patch("resources.host_api.detect_daemon_type", docker_stub)
    @patch("agent.docker.host.detect_daemon_type", docker_stub)
    def test_swarm_host_create_on_docker(self):
        '''
        create a swarm host failed if it's a docker host
        '''
        self._remove_all_hosts()
        res = self._test_host_create("swarm")
        self.assert400(res, "create {} swarm host should failed if it's a docker host".format("swarm"))

    @patch("resources.host_api.detect_daemon_type", docker_stub)
    @patch("agent.docker.host.detect_daemon_type", docker_stub)
    def test_docker_host_create_docker(self):
        '''
        create a docker host successfully if it's really a docker host
        '''
        self._remove_all_hosts()
        res = self._test_host_create("docker")
        self.assert200(res, "create {} docker host test failed".format("docker"))

    @patch("resources.host_api.detect_daemon_type", swarm_stub)
    @patch("agent.docker.host.detect_daemon_type", swarm_stub)
    def test_docker_host_create_on_swarm(self):
        '''
        create a docker host failed if it's a swarm host
        '''
        self._remove_all_hosts()
        res = self._test_host_create("docker")
        self.assert400(res, "create {} docker host should failed if it's a swarm host".format("docker"))

    @patch("resources.host_api.detect_daemon_type", docker_stub)
    @patch("agent.docker.host.detect_daemon_type", docker_stub)
    def test_docker_host_create_auto_detect(self):
        '''
        create a docker host and do not specify the host_type
        '''
        self._remove_all_hosts()
        res = self._test_host_create("docker")
        self.assert200(res, "create {} host test without host_type specified failed".format("docker"))

    def _test_host_create(self, host_type):
        """
        Test create a host with host_type
        """
        return self.client.post("/api/host",
                                data=dict(
                                    name="test_host",
                                    worker_api=MOCK_HOST,
                                    capacity=5,
                                    log_type="local",
                                    log_server="",
                                    log_level="INFO",
                                    host_type=host_type
                                ),
                                follow_redirects=True)
