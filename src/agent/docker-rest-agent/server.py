from flask import Flask, jsonify, request
import docker
import sys
import logging

app = Flask(__name__)
PASS_CODE = 'OK'
FAIL_CODE = 'Fail'

client = docker.from_env()
res = {'code': '', 'data': {}, 'msg': ''}

@app.route('/api/v1/networks', methods=['GET'])
def get_network():
    return jsonify({'networks': client.containers.list()})

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
    app.run(port=5001, debug=True)
