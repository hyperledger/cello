import Mock from 'mockjs';
import faker from 'faker';
import paginator from 'cello-paginator';
import organizations from './organization';

const channels = Mock.mock({
  'data|11': [
    {
      id() {
        return Mock.Random.guid();
      },
      name() {
        return faker.name.findName();
      },
      network: {
        id() {
          return Mock.Random.guid();
        },
        name() {
          return faker.company.companyName();
        },
      },
      organizations: [
        {
          id() {
            return Mock.Random.guid();
          },
          name() {
            return faker.company.companyName();
          },
        }
      ]
    },
  ],
});

function getChannels(req, res) {
  const { page = 1, per_page: perPage = 10 } = req.query;
  const result = paginator(channels.data, parseInt(page, 10), parseInt(perPage, 10));
  res.send({
    total: result.total,
    data: result.data,
  });
}


export default {
  'GET /api/v1/channels': getChannels,
//  'POST /api/v1/networks': createNet,
};
