from requests import put, get, post
import base64
import docker
import json

client = docker.from_env()

with open('msp.zip', 'rb') as node_msp, open('tls.zip', 'rb') as tls, open('block.zip', 'rb') as block, open('peer_config.zip', 'rb') as peer_config, open('orderer_config.zip', 'rb') as orderer_config:

    data = {
                'msp':base64.b64encode(node_msp.read()),
                'tls':base64.b64encode(tls.read()),
                'bootstrap_block':base64.b64encode(block.read()),
                'peer_config_file':base64.b64encode(peer_config.read()),
                'orderer_config_file':base64.b64encode(orderer_config.read()),
                'img': 'yeasy/hyperledger-fabric:2.2.0',
                'cmd': 'bash /tmp/init.sh "peer node start"',
                'name': 'cello-hlf-peer'
    }

# Test creating a node
n = post('http://localhost:5001/api/v1/nodes', data=data)
print(n.text)
txt = json.loads(n.text)
nid = txt['data']['id']

# Test starting a node
data = {'action': 'start'}
response = post('http://localhost:5001/api/v1/nodes/'+nid, data=data)
print(response.text)

# Test restarting a node
data = {'action': 'restart'}
response = post('http://localhost:5001/api/v1/nodes/'+nid, data=data)
print(response.text)

# Test stopping a node
data = {'action': 'stop'}
response = post('http://localhost:5001/api/v1/nodes/'+nid, data=data)
print(response.text)

# Test deleting a node
data = {'action': 'delete'}
response = post('http://localhost:5001/api/v1/nodes/'+nid, data=data)
print(response.text)
