export default {
  namespace: 'global',

  state: {
    collapsed: false,
    notices: [],
  },

  effects: {
  },

  reducers: {
  },

  subscriptions: {
    setup({ history }) {
      // Subscribe history(url) change, trigger `load` action if pathname is `/`
      return history.listen(({ pathname, search }) => {
        if (typeof window.ga !== 'undefined') {
          window.ga('send', 'pageview', pathname + search);
        }
      });
    },
  },
};
