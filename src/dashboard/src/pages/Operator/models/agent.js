import {
  listAgent,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  applyAgent,
  releaseAgent,
} from '@/services/agent';

export default {
  namespace: 'agent',

  state: {
    agent: {},
    agents: [],
    pagination: {
      total: 0,
      current: 1,
      pageSize: 10,
    },
    currentAgent: {},
  },

  effects: {
    *listAgent({ payload, callback }, { call, put, select }) {
      const response = yield call(listAgent, payload);
      const pagination = yield select(state => state.agent.pagination);
      const pageSize = payload ? payload.per_page || pagination.pageSize : pagination.pageSize;
      const current = payload ? payload.page || pagination.current : pagination.current;

      pagination.total = response.total;
      pagination.pageSize = pageSize;
      pagination.current = current;
      yield put({
        type: 'save',
        payload: {
          pagination,
          agents: response.data.data,
        },
      });
      if (callback) {
        callback();
      }
    },
    *getAgent({ payload, callback }, { call, put }) {
      const response = yield call(getAgent, payload);
      yield put({
        type: 'save',
        payload: {
          agent: response,
        },
      });
      if (callback) {
        callback({
          ...response,
        });
      }
    },
    *createAgent({ payload, callback }, { call }) {
      const response = yield call(createAgent, payload.formData);
      if (callback) {
        callback({
          payload,
          ...response,
        });
      }
    },
    *applyAgent({ payload, callback }, { call }) {
      const response = yield call(applyAgent, payload.data);
      if (callback) {
        callback({
          payload,
          ...response,
        });
      }
    },
    *updateAgent({ payload, callback }, { call }) {
      const response = yield call(updateAgent, payload.data);
      if (callback) {
        callback({
          action: payload.action,
          ...response,
        });
      }
    },
    *deleteAgent({ payload, callback }, { call }) {
      const response = yield call(deleteAgent, payload);
      if (callback) {
        callback({
          payload,
          ...response,
        });
      }
    },
    *releaseAgent({ payload, callback }, { call }) {
      const response = yield call(releaseAgent, payload);
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
        agent: {},
        agents: [],
        pagination: {
          total: 0,
          current: 1,
          pageSize: 10,
        },
        currentAgent: {},
      };
    },
  },
};
