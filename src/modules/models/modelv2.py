import datetime
from mongoengine import Document, StringField, \
    BooleanField, DateTimeField, IntField, \
    ReferenceField, DictField, ListField, CASCADE, DENY
from marshmallow import Schema, fields
from modules.models.host import Host as HostModel


BLOCKCHAIN_NETWORK_STATUS = ('creating', 'running', 'error', 'stopped', 'deleting')
ORGANIZATION_TYPE = ('peer', 'orderer')

FABRIC_SERVICE_TYPE = ('ca', 'peer', 'orderer', 'couchdb')

class BlockchainNetwork(Document):

    id = StringField(required=True, primary_key=True)
    name = StringField(default="")
    description = StringField(default="")
    fabric_version = StringField(default="v1.1")
    orderer_orgs = ListField(StringField(), required=True)
    peer_orgs = ListField(StringField(), required=True)
    healthy = BooleanField(default=False)
    create_ts = DateTimeField(default=datetime.datetime.utcnow())
    status = StringField(choices=BLOCKCHAIN_NETWORK_STATUS)
    host = ReferenceField(HostModel, reverse_delete_rule=DENY)
    consensus_type = StringField(default="kafka")
    db_type = StringField()



class ServiceEndpoint(Document):
    id = StringField(required=True, primary_key=True)
    service_ip = StringField(required=True)
    service_port = IntField(required=True)
    service_name = StringField(default="")
    service_type = StringField(choices=FABRIC_SERVICE_TYPE)
    peer_port_proto = StringField(default="")
    org_name = StringField(default="")
    healthy = BooleanField(default=False)
    network = ReferenceField(BlockchainNetwork, reverse_delete_rule=CASCADE)

class ServiceEndpointSchema(Schema):
    id = fields.String()
    service_ip = fields.String()
    service_port = fields.Integer()
    service_name = fields.String()
    service_type = fields.String()
    peer_port_proto = fields.String()
    org_name = fields.String()
    healthy = fields.Boolean()

class BlockchainNetworkSchema(Schema):
    id = fields.String()
    name = fields.String()
    description = fields.String()
    fabric_version = fields.String()
    orderer_orgs = fields.List(fields.String())
    peer_orgs = fields.List(fields.String())
    healthy = fields.Boolean()
    create_ts = fields.DateTime()
    host_id = fields.Method("get_host_id")
    consensus_type = fields.String()
    status = fields.String()
    db_type = fields.String()

    def get_host_id(self, network):
        return str(network.host.id)

class Organization(Document):
    id = StringField(required=True, primary_key=True)
    name = StringField(required=True)
    description = StringField(default="")
    type = StringField(choices=ORGANIZATION_TYPE)
    domain = StringField(required=True)
    enableNodeOUs = BooleanField(default=True)
    ca = DictField(default={})
    peerNum = IntField(default=0)
    ordererHostnames = ListField()
    network = ReferenceField(BlockchainNetwork)
    host = ReferenceField(HostModel, reverse_delete_rule=DENY)


class OrganizationSchema(Schema):
    id = fields.String()
    name = fields.String()
    description = fields.String()
    type = fields.String()
    domain = fields.String()
    enableNodeOUs = fields.Boolean()
    ca = fields.Dict()
    peerNum = fields.Integer()
    ordererHostnames = fields.List(fields.String())
    blockchain_network_id = fields.Method("get_network_id")
    host_id = fields.Method("get_host_id")

    def get_network_id(self, org):
        if org.network is not None:
            return str(org.network.id)
        else:
            return ""

    def get_host_id(self, org):
        return str(org.host.id)

class OperatorLog(Document):
    # id = StringField(required=True, primary_key=True)
    opDate = DateTimeField(default=datetime.datetime.utcnow())
    opName = StringField(required=True)
    opObject = StringField(required=True)
    opResult = DictField(default={})
    operator = StringField(required=True)
    opDetails = DictField(default=None)


class OperatorLogSchema(Schema):
    # id = fields.String()
    opDate = fields.DateTime()
    opName = fields.String()
    opObject = fields.String()
    opResult = fields.Dict()
    operator = fields.String()
    opDetails = fields.Dict()



