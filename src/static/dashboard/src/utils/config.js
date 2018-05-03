const apiBase = '/api';
export default {
  urls: {
    status: `${apiBase}/stat`,
    host: {
      list: `${apiBase}/hosts`,
      crud: `${apiBase}/host`,
      operate: `${apiBase}/host_op`,
    },
    cluster: {
      list: `${apiBase}/clusters`,
      crud: `${apiBase}/cluster`,
      operate: `${apiBase}/cluster_op`,
    },
    user: {
      list: `${apiBase}/user/list`,
      create: `${apiBase}/user/create`,
      delete: `${apiBase}/user/delete`,
      search: `${apiBase}/user/search`,
      update: `${apiBase}/user/update`,
    },
  },
};
