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
  },
};
