import { listNode, getNode, registerUserToNode, deleteNode, operateNode } from '@/services/node';

export default {
  namespace: 'node',

  state: {
    node: {},
    nodes: [],
    pagination: {
      total: 0,
      current: 1,
      pageSize: 10,
    },
  },

  effects: {
    *listNode({ payload, callback }, { call, put, select }) {
      const response = yield call(listNode, payload);
      const pagination = yield select(state => state.node.pagination);
      const pageSize = payload ? payload.per_page || pagination.pageSize : pagination.pageSize;
      const current = payload ? payload.page || pagination.current : pagination.current;

      pagination.total = response.total;
      pagination.pageSize = pageSize;
      pagination.current = current;
      yield put({
        type: 'save',
        payload: {
          pagination,
          nodes: response.data,
        },
      });
      if (callback) {
        callback();
      }
    },
    *getNode({ payload, callback }, { call, put }) {
      const response = yield call(getNode, payload);
      yield put({
        type: 'save',
        payload: {
          node: response,
        },
      });
      if (callback) {
        callback({
          ...response,
        });
      }
    },
    *registerUserToNode({ payload, callback }, { call }) {
      const response = yield call(registerUserToNode, payload);
      if (callback) {
        callback({
          payload,
          ...response,
        });
      }
    },
    *deleteNode({ payload, callback }, { call }) {
      const response = yield call(deleteNode, payload);
      if (callback) {
        callback({
          payload,
          ...response,
        });
      }
    },
    *operateNode({ payload, callback }, { call }) {
      const response = yield call(operateNode, payload);
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
        node: {},
        nodes: [],
        pagination: {
          total: 0,
          current: 1,
          pageSize: 10,
        },
      };
    },
  },
};
