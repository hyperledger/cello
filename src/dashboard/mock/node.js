import Mock from 'mockjs';
import faker from 'faker';
import { paginator } from './_utils';

const nodes = Mock.mock({
  'data|11': [{
    id () {
      return Mock.Random.guid()
    },
    name () {
      return faker.company.companyName();
    },
    created_at: '@datetime',
    type () { return Mock.Random.pick(['ca', 'orderer', 'peer']) },
    network_type () { return Mock.Random.pick(['fabric']) },
    network_version () { return Mock.Random.pick(['1.4.2', '1.5']) },
    status () { return Mock.Random.pick(['deploying', 'running', 'stopped', 'deleting', 'error', 'deleted']) },
    agent_id () { return Mock.Random.guid() },
    network_id () { return Mock.Random.guid() },
    ca () {return {
      admin_name: Mock.mock('@name'),
      admin_password: Mock.mock(/[a-z0-9]{6}/),
      hosts: [
        faker.company.companyName(),
        faker.company.companyName(),
      ],
    }},
  }],
});

function getNodes(req, res) {
  const { page = 1, per_page: perPage = 10 } = req.query;
  const result = paginator(nodes.data, parseInt(page, 10), parseInt(perPage, 10));

  res.send({
    total: result.total,
    data: result.data,
  });
}

function registerUserToNode(req, res) {
  const message = req.body;

  if (!message.name) {
    res.send({
      code: 20001,
      detail: 'name is required'
    });
  }

  if (!message.user_type) {
    res.send({
      code: 20001,
      detail: 'user_type is required'
    });
  }

  if (!message.secret) {
    res.send({
      code: 20001,
      detail: 'secret is required'
    });
  }

  res.send({id: Mock.Random.guid()});
}

function deleteNode(req, res) {
  nodes.data.forEach((val, index) => {
    if (val.id === req.params.id) {
      nodes.data.splice(index, 1);
    }
  });

  res.send({});
}

function operateNode(req, res) {
  const message = req.query;
  nodes.data.forEach((val, index) => {
    if (val.id === req.params.id) {
      if (message.action === 'start' || message.action === 'restart') {
        nodes.data[index].status = 'running';
      } else if (message.action === 'stop') {
        nodes.data[index].status = 'stopped';
      }
    }
  });
  res.send({});
}

export default {
  'GET /api/nodes': getNodes,
  'POST /api/nodes/:id/users': registerUserToNode,
  'DELETE /api/nodes/:id': deleteNode,
  'POST /api/nodes/:id/operations': operateNode,
};
