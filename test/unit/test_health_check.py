
import sys
import os
import logging
import datetime
import unittest
import json
import requests
from unittest.mock import patch

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from common import log_handler, LOG_LEVEL
from common import FabricV1Network

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

absolute_path = os.path.dirname(os.path.abspath(__file__))

class TestHealthCheck(unittest.TestCase):
    @patch('requests.get')
    def test_helth_check_o(self, mock_get):
        cluster = {'worker_api': 'tcp://192.168.56.101:2375',
            'mapped_ports': {'rest': 7050, 'ecap': 7054, 'grpc': 7051,
            'tlscaa': 7059, 'tlscap': 7058, 'tcap': 7056, 'ecaa': 7055,
            'cli': 7052, 'tcaa': 7057, 'event': 7053}, 'user_id': '',
            'network_type': 'fabric-1.0', 'containers': {
            '5a004d2d292d3700135fbe53_peer1-org1':
            '86beb192e91c2422c221168121d6620648c5a3cf1151a521166dd936d97f7c72',
            '5a004d2d292d3700135fbe53_peer0-org1':
            '592df48bb610948a6874221eea6083243408d8677b804da8802f49c72640bf4a',
            '5a004d2d292d3700135fbe53_fabric-cli':
            '0ae10c90756b44824fcd033d8270bcffe19e87433577236c69a6ec6f85fbeb6d',
            '5a004d2d292d3700135fbe53_orderer':
            '094c549a37288283963257f3c38bb7d37a3d79e4bd4b4e4b725e15a601a59278',
            '5a004d2d292d3700135fbe53fabric-ca':
            'b394432693243cd77c000d529757384230cf3590a827b83f6b6d8be92c6a3224',
            '5a004d2d292d3700135fbe53_peer0-org2':
            '53e037814c9a48c1e57fdb8077d74f28e187e307db4ae17d18d571f6e50bf066',
            '5a004d2d292d3700135fbe53_peer1-org2':
            '2fdca0c24295005c39c797f951bbbd5970ab283192e68d23393e2c6f622ba532'}
            , 'host_id': '5a004d27292d3700135fbe52', 'status': 'running',
            'release_ts': '', 'create_ts': datetime.datetime(2017,11, 6, 19,
                                            53, 17, 352000), 'apply_ts': '',
            'service_url': {'rest': '192.168.56.101:7050',
            'ecap': '192.168.56.101:7054', 'grpc': '192.168.56.101:7051',
            'tlscaa': '192.168.56.101:7059', 'tlscap': '192.168.56.101:7058',
            'tcap': '192.168.56.101:7056', 'ecaa': '192.168.56.101:7055',
            'cli': '192.168.56.101:7052', 'tcaa': '192.168.56.101:7057',
            'event': '192.168.56.101:7053'}, 'name': 'test_host_0',
            'health': 'OK', 'duration': '', 'consensus_plugin': 'solo',
            'consensus_mode': '', 'size': 4, 'id': '5a004d2d292d3700135fbe53'}

        cluster_id = '5a004d27292d3700135fbe52'
        '''
        result = FabricV1Network.health_check(cluster, cluster_id)
        self.assertEqual(result, "OK")
        '''
        with open(absolute_path+'/ok_response.json') as o_fh:
            o_data = json.load(o_fh)
            mock_get.return_value.json.return_value = o_data
            o_result = FabricV1Network.health_check(cluster, cluster_id)
            self.assertEqual(o_result, 'OK')

    @patch('requests.get')
    def test_helth_check_f(self, mock_get):
        cluster = {'worker_api': 'tcp://192.168.56.101:2375',
            'mapped_ports': {'rest': 7050, 'ecap': 7054, 'grpc': 7051,
            'tlscaa': 7059, 'tlscap': 7058, 'tcap': 7056, 'ecaa': 7055,
            'cli': 7052, 'tcaa': 7057, 'event': 7053}, 'user_id': '',
            'network_type': 'fabric-1.0', 'containers': {
            '5a004d2d292d3700135fbe53_peer1-org1':
            '86beb192e91c2422c221168121d6620648c5a3cf1151a521166dd936d97f7c72',
            '5a004d2d292d3700135fbe53_peer0-org1':
            '592df48bb610948a6874221eea6083243408d8677b804da8802f49c72640bf4a',
            '5a004d2d292d3700135fbe53_fabric-cli':
            '0ae10c90756b44824fcd033d8270bcffe19e87433577236c69a6ec6f85fbeb6d',
            '5a004d2d292d3700135fbe53_orderer':
            '094c549a37288283963257f3c38bb7d37a3d79e4bd4b4e4b725e15a601a59278',
            '5a004d2d292d3700135fbe53fabric-ca':
            'b394432693243cd77c000d529757384230cf3590a827b83f6b6d8be92c6a3224',
            '5a004d2d292d3700135fbe53_peer0-org2':
            '53e037814c9a48c1e57fdb8077d74f28e187e307db4ae17d18d571f6e50bf066',
            '5a004d2d292d3700135fbe53_peer1-org2':
            '2fdca0c24295005c39c797f951bbbd5970ab283192e68d23393e2c6f622ba532'}
            , 'host_id': '5a004d27292d3700135fbe52', 'status': 'running',
            'release_ts': '', 'create_ts': datetime.datetime(2017, 11, 6, 19,
            53, 17, 352000), 'apply_ts': '',
            'service_url': {'rest': '192.168.56.101:7050',
            'ecap': '192.168.56.101:7054', 'grpc': '192.168.56.101:7051',
            'tlscaa': '192.168.56.101:7059', 'tlscap': '192.168.56.101:7058',
            'tcap': '192.168.56.101:7056', 'ecaa': '192.168.56.101:7055',
            'cli': '192.168.56.101:7052', 'tcaa': '192.168.56.101:7057',
            'event': '192.168.56.101:7053'}, 'name': 'test_host_0',
            'health': 'OK', 'duration': '', 'consensus_plugin': 'solo',
            'consensus_mode': '', 'size': 4, 'id': '5a004d2d292d3700135fbe53'}

        cluster_id = '5a004d27292d3700135fbe52'

        with open(absolute_path+'/fail_response.json') as f_fh:
            f_data = json.load(f_fh)
            mock_get.return_value.json.return_value = f_data
            f_result = FabricV1Network.health_check(cluster, cluster_id)
            self.assertEqual(f_result, False)

if __name__ == '__main__':
    unittest.main()