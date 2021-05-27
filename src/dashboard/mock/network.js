import Mock from 'mockjs';
import faker from 'faker';
import paginator from 'cello-paginator';

const networks = Mock.mock({
  'data|11': [
    {
      id() {
        return Mock.Random.guid();
      },
      name() {
        return faker.company.companyName();
      },
      created_at: '@datetime',
      type: 'fabric',
      organizations: ['org1', 'org2'],
      version() {return Mock.Random.pick(['v1.4', 'v2.2']);},
      status: 'OK',
      consensus() {return Mock.Random.pick(['etcdraft', 'solo']);},
      db() {return Mock.Random.pick(['couchdb', 'leveldb']);}
    },
  ],
});

function getNets(req, res) {
  const { page = 1, per_page: perPage = 10 } = req.query;
  const result = paginator(networks.data, parseInt(page, 10), parseInt(perPage, 10));
  res.send({
    total: result.total,
    data: result.data,
  });
}

export default {
  'GET /api/networks': getNets,
  networks
};
