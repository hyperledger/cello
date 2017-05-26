import logging
import time
from threading import Thread
from common import LOG_LEVEL, HOST_TYPES, FABRIC_VERSION, CONSENSUS_PLUGINS, \
    log_handler, CONSENSUS_MODES

from modules import host_handler, cluster_handler

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class StatHandler(object):
    """ Main handler to get the Statistics data
    """

    def __init__(self):
        pass

    def hosts(self):
        """
        Get hosts related statistic result

        :return: The stat result
        """
        result = {'status': [], 'type': []}
        actives = list(host_handler.list(filter_data={'status': 'active'}))
        inactive = list(host_handler.list(filter_data={'status': 'inactive'}))
        result['status'] = [
            {'name': 'active', 'y': len(actives)},
            {'name': 'inactive', 'y': len(inactive)}
        ]
        for host_type in HOST_TYPES:
            hosts = list(host_handler.list(filter_data={'type': host_type}))
            result['type'].append({
                'name': host_type,
                'y': len(hosts)
            })

        return result

    def clusters(self):
        """
        Get clusters related statistic result

        :return: The stat result
        """
        result = {'status': [], 'type': []}
        total_clusters = list(cluster_handler.list())
        free_clusters = list(cluster_handler.list(filter_data={
            'user_id': ''}))
        total_number = len(total_clusters)
        free_clusters_number = len(free_clusters)
        result['status'] = [
            {'name': 'free', 'y': free_clusters_number},
            {'name': 'used', 'y': total_number - free_clusters_number}
        ]
        for consensus_plugin in CONSENSUS_PLUGINS:
            if consensus_plugin == CONSENSUS_PLUGINS[0]:
                consensus_type = consensus_plugin
                clusters = list(cluster_handler.list(filter_data={
                    'consensus_plugin': consensus_plugin}))
                result['type'].append({
                    'name': consensus_type,
                    'y': len(clusters)
                })
            else:
                for consensus_mode in CONSENSUS_MODES:
                    consensus_type = consensus_plugin + "/" + consensus_mode
                    clusters = list(cluster_handler.list(filter_data={
                        'consensus_plugin': consensus_plugin,
                        'consensus_mode': consensus_mode
                    }))
                    result['type'].append({
                        'name': consensus_type,
                        'y': len(clusters)
                    })
        return result


stat_handler = StatHandler()
