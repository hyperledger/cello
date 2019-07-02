import Mock from 'mockjs';
import faker from 'faker';
import { paginator } from './_utils';

const organizations = Mock.mock({
  'data|11': [{
    id: function () {
      return Mock.Random.guid()
    },
    name: function () {
      return faker.company.companyName();
    },
    created_at: '@datetime',
  }],
});

function getOrgs(req, res) {
  const { page = 1, per_page = 10 } = req.query;
  const result = paginator(organizations.data, parseInt(page), parseInt(per_page));
  res.send({
    total: result.total,
    data: result.data,
  });
}

export default {
  'GET /api/organizations': getOrgs,
};