import Mock from 'mockjs';
import faker from 'faker';
import paginator from 'cello-paginator';
// import organizations from './organization';

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
        },
      ],
      create_ts: '@datetime',
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

function createChannel(req, res) {
  const message = req.body;
  const channel = {
    id: message.id,
    name: message.name,
    network: {
      id() {
        return Mock.Random.guid();
      },
      name() {
        return faker.company.companyName();
      },
      organizations: [
        {
          id() {
            return Mock.Random.guid();
          },
          name() {
            return faker.company.companyName();
          },
        },
      ],
      network: {
        id() {
          return Mock.Random.guid();
        },
        name() {
          return faker.company.companyName();
        },
      },
    },
  };
  channels.data.push(channel);

  res.send({ success: true });
}

export default {
  'GET /api/v1/channels': getChannels,
  'POST /api/v1/channels': createChannel,
};
