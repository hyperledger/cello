import Mock from 'mockjs';
import faker from 'faker';
import paginator from 'cello-paginator';

const organizations = Mock.mock({
  'data|11': [
    {
      id() {
        return Mock.Random.guid();
      },
      name() {
        return faker.company.companyName();
      },
      created_at: '@datetime',
    },
  ],
});

function getOrgs(req, res) {
  const { page = 1, per_page: perPage = 10 } = req.query;
  const result = paginator(organizations.data, parseInt(page, 10), parseInt(perPage, 10));
  res.send({
    total: result.total,
    data: result,
  });
}

export default {
  'GET /api/v1/organizations': getOrgs,
  organizations
};
