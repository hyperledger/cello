from flask import Flask, jsonify, request
import docker
import sys
import logging
import os

app = Flask(__name__)
PASS_CODE = 'OK'
FAIL_CODE = 'Fail'

docker_url = os.getenv("DOCKER_URL")

client = docker.DockerClient(docker_url)
res = {'code': '', 'data': {}, 'msg': ''}

@app.route('/api/v1/networks', methods=['GET'])
def get_network():
    container_list = client.containers.list()
    containers = {}
    for container in container_list:
        containers[container.id]={
        "id":container.id,
        "short_id":container.short_id,
        "name":container.name,
        "status":container.status,
        "image":str(container.image),
        "attrs":container.attrs
        }
    res = {'code':PASS_CODE, 'data':containers, 'msg':''}
    return jsonify({'res':res})

@app.route('/api/v1/nodes', methods=['POST'])
def create_node():

    env = {
    'HLF_NODE_MSP': request.form.get('msp'),
    'HLF_NODE_TLS':request.form.get('tls'),
    'HLF_NODE_BOOTSTRAP_BLOCK':request.form.get('bootstrap_block'),
    'HLF_NODE_PEER_CONFIG':request.form.get('peer_config_file'),
    'HLF_NODE_ORDERER_CONFIG':request.form.get('orderer_config_file'),
    }


    try:
        # same as `docker run -dit yeasy/hyperledge-fabric:2.2.0 -e VARIABLES``
        container = client.containers.run(request.form.get('img'), request.form.get('cmd'), detach=True, tty=True, stdin_open=True, name=request.form.get('name'), environment=env)
    except:
        res['code'] = FAIL_CODE
        res['data'] = sys.exc_info()[0]
        res['msg'] = 'creation failed'
        logging.debug(res)
        raise

    res['code'] = PASS_CODE
    res['data']['status'] = 'created'
    res['data']['id'] = container.id
    res['data']['public-grpc'] = '127.0.0.1:7050' # TODO: read the info from config file
    res['data']['public-raft'] = '127.0.0.1:7052'
    res['msg'] = 'node created'
    return jsonify(res)

@app.route('/api/v1/nodes/<id>', methods=['GET', 'POST'])
def operate_node(id):
    container = client.containers.get(id)
    if request.method == 'POST':
        act = request.form.get('action') # only with POST

        try:
            if act == 'start':
                container.start()
                res['msg'] = 'node started'
            elif act == 'restart':
                container.restart()
                res['msg'] = 'node restarted'
            elif act == 'stop':
                container.stop()
                res['msg'] = 'node stopped'
            elif act == 'delete':
                container.remove()
                res['msg'] = 'node deleted'
            elif act == 'update':

                env = {}

                if 'msp' in request.form:
                    env['HLF_NODE_MSP'] = request.form.get('msp')
                
                if 'tls' in request.form:
                    env['HLF_NODE_TLS'] = request.form.get('tls')

                if 'bootstrap_block' in request.form:
                    env['HLF_NODE_BOOTSTRAP_BLOCK'] = request.form.get('bootstrap_block')
                
                if 'peer_config_file' in request.form:
                    env['HLF_NODE_PEER_CONFIG'] = request.form.get('peer_config_file')

                if 'orderer_config_file' in request.form:
                    env['HLF_NODE_ORDERER_CONFIG'] = request.form.get('orderer_config_file')

                container.exec_run(request.form.get('cmd'), detach=True, tty=True, stdin=True, environment=env)
                container.restart()
                res['msg'] = 'node updated'

            else:
                res['msg'] = 'undefined action'
        except:
            res['code'] = FAIL_CODE
            res['data'] = sys.exc_info()[0]
            res['msg'] = act + 'failed'
            logging.debug(res)
            raise
    else:
        # GET
        res['data']['status'] = container.status

    res['code'] = PASS_CODE
    return jsonify(res)


if __name__ == '__main__':
    app.run(host = "0.0.0.0", port=5001)
