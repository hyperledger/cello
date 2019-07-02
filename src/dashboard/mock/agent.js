import Mock from 'mockjs';
import faker from 'faker';
import { paginator } from './_utils';

const agents = Mock.mock({
  'data|11': [{
    id: function () {
      return Mock.Random.guid()
    },
    name: function () {
      return faker.company.companyName();
    },
    created_at: '@datetime',
    worker_api: function () { return Mock.Random.ip() },
    capacity: function () { return Math.ceil(Math.random()*10) },
    node_capacity: function () { return Math.ceil(Math.random()*10) },
    status: function () { return Mock.Random.pick(['inactive', 'active']) },
    log_level: function () { return Mock.Random.pick(['info', 'debug']) },
    type: function () { return Mock.Random.pick(['docker', 'kubernetes']) },
    schedulable: function () { return Mock.Random.pick([true, false]) },
    organization_id: function () { return Mock.Random.guid() },
  }],
});

function getAgents(req, res) {
  const { page = 1, per_page = 10 } = req.query;
  const result = paginator(agents.data, parseInt(page), parseInt(per_page));
  res.send({
    total: result.total,
    data: result.data,
  });
}

export default {
  'GET /api/agents': getAgents,
};
