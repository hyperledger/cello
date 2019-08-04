import Mock from 'mockjs';
import faker from 'faker';
import { paginator } from './_utils';

const agents = Mock.mock({
  'data|11': [{
    id () {
      return Mock.Random.guid()
    },
    name () {
      return faker.company.companyName();
    },
    created_at: '@datetime',
    ip () { return Mock.Random.ip() },
    capacity () { return Math.ceil(Math.random()*10) },
    node_capacity () { return Math.ceil(Math.random()*10) },
    status () { return Mock.Random.pick(['inactive', 'active']) },
    log_level () { return Mock.Random.pick(['info', 'debug']) },
    type () { return Mock.Random.pick(['docker', 'kubernetes']) },
    schedulable () { return Mock.Random.pick([true, false]) },
    organization_id () { return Mock.Random.guid() },
    image () { return Mock.Random.pick(['financial', 'sales', 'customer', 'marketing', 'network']) },
    config_file: 'https://github.com/hyperledger/cello/archive/master.zip',
  }],
});

function getAgents(req, res) {
  const { page = 1, per_page: perPage = 10 } = req.query;
  const result = paginator(agents.data, parseInt(page, 10), parseInt(perPage, 10));
  res.send({
    total: result.total,
    data: result.data,
  });
}

function createAgent(req, res) {
  const message = req.body;

  if (!message.capacity) {
    res.send({
      code: 20001,
      detail: 'capacity is required'
    });
  }

  if (!message.node_capacity) {
    res.send({
      code: 20001,
      detail: 'node_capacity is required'
    });
  }

  if (!message.type) {
    res.send({
      code: 20001,
      detail: 'type is required'
    });
  }

  if (!message.ip) {
    res.send({
      code: 20001,
      detail: 'ip is required'
    });
  }

  const id = Mock.Random.guid();

  agents.data.push({
    id,
    name: message.name,
    created_at: new Date(),
    ip: message.ip,
    capacity: message.capacity,
    node_capacity: message.node_capacity,
    status: 'active',
    log_level: message.log_level,
    type: message.type,
    schedulable: message.schedulable === 'true',
    organization_id: '',
    image: message.image,
    config_file: req.files.length > 0 ? 'https://github.com/hyperledger/cello/archive/master.zip' : '',
  });
  res.send({id});
}

function getOneAgent(req, res) {
  const agent = agents.data.filter(item => item.id === req.params.id);

  if (agent.length > 0) {
    res.send(agent[0]);
  } else {
    res.send({
      code: 20005,
      detail: 'The agent not found.'
    })
  }
}

function updateAgentForOperator(req, res) {
  const message = req.body;

  agents.data.forEach((val, index) => {
    if (val.id === req.params.id) {
      if (message.name) {
        agents.data[index].name = message.name;
      }

      if (message.capacity) {
        agents.data[index].capacity = message.capacity;
      }

      if (message.log_level) {
        agents.data[index].log_level = message.log_level;
      }

      if (message.schedulable) {
        agents.data[index].schedulable = message.schedulable === 'true';
      }
    }
  });

  res.send({});
}

function updateAgentForOrgAdmin(req, res) {
  const message = req.body;

  agents.data.forEach((val, index) => {
    if (val.id === req.params.id) {
      if (message.name) {
        agents.data[index].name = message.name;
      }

      if (message.capacity) {
        agents.data[index].capacity = message.capacity;
      }

      if (message.log_level) {
        agents.data[index].log_level = message.log_level;
      }
    }
  });

  res.send({});
}

export default {
  'GET /api/agents': getAgents,
  'POST /api/agents': createAgent,
  'GET /api/agents/:id': getOneAgent,
  'PUT /api/agents/:id': updateAgentForOperator,
  'PATCH /api/agents/:id': updateAgentForOrgAdmin,
};
