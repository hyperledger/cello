import logging
from modules.models import modelv2

from common import log_handler, LOG_LEVEL

logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)


class organizationHandler(object):

    def _schema(self, doc, many=False):
        org_schema = modelv2.OrganizationSchema(many=many)
        return org_schema.dump(doc).data

    def schema(self, doc, many=False):
        return self._schema(doc, many)

    def create(self, id, name, description,
               type, domain, peerNum, ca, host, ordererHostnames):
        org = modelv2.Organization(id=id,
                                    name=name,
                                    description=description,
                                    type=type,
                                    domain=domain,
                                    peerNum=peerNum,
                                    ca=ca,
                                    host=host,
                                    ordererHostnames=ordererHostnames
                                    )
        org.save()
        return self._schema(org)

    def update(self, id, peers_num):
        ins = modelv2.Organization.objects.get(id=id)
        if 'network' in ins:
            network = ins['network']
            networkid = network.id
            try:
                from .blockchain_network import BlockchainNetworkHandler
                network_handler = BlockchainNetworkHandler()
                network_handler.addpeertonetwork(networkid, id, peers_num)
            except Exception:
                logger.warning("addpeertonetwork faild=")
                return None
        exist_peers = ins['peerNum']
        peerNum = exist_peers + peers_num
        ins.update(set__peerNum=peerNum)

        return ins

    def list(self, filter_data={}):
        """ List orgs with given criteria

        :param filter_data: Image with the filter properties
        :return: iteration of serialized doc
        """
        logger.info("filter data {}".format(filter_data))
        organizations = modelv2.Organization.objects(__raw__=filter_data)
        return self._schema(organizations, many=True)

    def get_by_networkid(self, id):
        """ List orgs with given criteria

        :param filter_data: Image with the filter properties
        :return: iteration of serialized doc
        """
        logger.info("filter data {}".format(id))

        network = modelv2.BlockchainNetwork.objects.get(id=id)
        organization = modelv2.Organization.objects(network=network)
        return self.endports_schema(organization, many=True)

    def get_by_id(self, id):
        """ Get a organization

        :param id: id of the doc
        :return: serialized result or obj
        """
        try:
            ins = modelv2.Organization.objects.get(id=id)
        except Exception:
            logger.warning("No host found with id=" + id)
            return None

        return ins

    # def update(self, id, d):
    #     """ Update a host's property
    #
    #     TODO: may check when changing host type
    #
    #     :param id: id of the host
    #     :param d: dict to use as updated values
    #     :return: serialized result or obj
    #     """
    #     logger.debug("Get a host with id=" + id)
    #     h_old = self.get_by_id(id)
    #     if not h_old:
    #         logger.warning("No host found with id=" + id)
    #         return {}
    #
    #     if h_old.status == "pending":
    #         return {}
    #
    #     if "worker_api" in d and not d["worker_api"].startswith("tcp://"):
    #         d["worker_api"] = "tcp://" + d["worker_api"]
    #
    #     if "capacity" in d:
    #         d["capacity"] = int(d["capacity"])
    #     if d["capacity"] < ClusterModel.objects(host=h_old).count():
    #         logger.warning("Cannot set cap smaller than running clusters")
    #         return {}
    #     if "log_server" in d and "://" not in d["log_server"]:
    #         d["log_server"] = "udp://" + d["log_server"]
    #     if "log_type" in d and d["log_type"] == CLUSTER_LOG_TYPES[0]:
    #         d["log_server"] = ""
    #     if "autofill" in d:
    #         d["autofill"] = d["autofill"] == "on"
    #     if "schedulable" in d:
    #         d["schedulable"] = d["schedulable"] == "on"
    #     self.db_set_by_id(id, **d)
    #     h_new = self.get_by_id(id)
    #     return self._schema(h_new)

    def delete(self, id):
        """ Delete a organization instance

        :param id: id of the organization to delete
        :return:
        """
        logger.debug("Delete a organization with id={0}".format(id))

        try:
            org = modelv2.Organization.objects.get(id=id)
        except Exception:
            logger.warning("Cannot delete non-existed host")
            return False

        org.delete()
        return True
