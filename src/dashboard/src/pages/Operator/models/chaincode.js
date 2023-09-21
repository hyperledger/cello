import { listChainCode, uploadChainCode, listNode, installChainCode } from '@/services/chaincode';

export default {
  namespace: 'chainCode',

  state: {
    nodes: [],
    chainCodes: [],
    pagination: {
      total: 0,
      current: 1,
      pageSize: 10,
    },
  },

  effects: {
    *listChainCode({ payload }, { call, put, select }) {
      const response = yield call(listChainCode, payload);
      const pagination = yield select(state => state.chainCode.pagination);
      const pageSize = payload ? payload.per_page || pagination.pageSize : pagination.pageSize;
      const current = payload ? payload.page || pagination.current : pagination.current;

      pagination.total = response.data.total;
      pagination.pageSize = pageSize;
      pagination.current = current;
      yield put({
        type: 'save',
        payload: {
          pagination,
          chainCodes: response.data.data,
        },
      });
    },
    *uploadChainCode({ payload, callback }, { call }) {
      const response = yield call(uploadChainCode, payload);
      if (callback) {
        callback(response);
      }
    },
    *listNode({ payload }, { call, put }) {
      const response = yield call(listNode, payload);
      yield put({
        type: 'save',
        payload: {
          nodes: response.data.data,
        },
      });
    },
    *installChainCode({ payload, callback }, { call }) {
      const response = yield call(installChainCode, payload);
      if (callback) {
        callback(response);
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
        nodes: [],
        chainCodes: [],
        pagination: {
          total: 0,
          current: 1,
          pageSize: 10,
        },
      };
    },
  },
};
