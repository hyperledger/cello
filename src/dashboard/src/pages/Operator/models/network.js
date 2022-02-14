import {
  listNetwork,
  createNetwork,
  updateNetwork,
  deleteNetwork,
} from '@/services/network';

export default {
  namespace: 'network',

  state: {
    networks: [],
    pagination: {
      total: 0,
      current: 1,
      pageSize: 10,
    },
    currentNetwork: {},
  },

  effects: {
    *listNetwork({ payload, callback }, { call, put, select }) {
      const response = yield call(listNetwork, payload);
      const pagination = yield select(state => state.network.pagination);
      const pageSize = payload ? payload.per_page || pagination.pageSize : pagination.pageSize;
      const current = payload ? payload.page || pagination.current : pagination.current;

      pagination.total = response.total;
      pagination.pageSize = pageSize;
      pagination.current = current;
      yield put({
        type: 'save',
        payload: {
          pagination,
          networks: response.data.data,
        },
      });
      if (callback) {
        callback();
      }
    },
    *createNetwork({ payload, callback }, { call }) {
      const response = yield call(createNetwork, payload);
      if (callback) {
        callback({
          ...response,
        });
      }
    },
    *deleteNetwork({ payload, callback }, { call }) {
      const response = yield call(deleteNetwork, payload);
      if (callback) {
        callback({
          payload,
          ...response,
        });
      }
    },
  },
  reducers: {
    save(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
    clear() {
      return {
        networks: [],
        pagination: {
          total: 0,
          current: 1,
          pageSize: 10,
        },
        currentNetwork: {},
      };
    },
  },
};
