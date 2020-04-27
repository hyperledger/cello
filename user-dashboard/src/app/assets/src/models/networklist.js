import { queryNetworks, NetworksList  } from '../services/network_api';


export default {
    namespace: 'networklist',

    state: {
        blockchain_networks: [],
    },

    effects: {
        *fetch({ payload }, { call, put }) {
            const response = yield call(queryNetworks, payload);
            yield put({
                type: 'save',
                payload: response,
            });
        },
        *NetworksList({ payload }, { call, put }) {
            const response = yield call(NetworksList, payload);
            yield put({
                type: 'network',
                payload: response,
            });
        },
    },

    reducers: {
        save(state, action) {
            return {
                ...state,
                blockchain_networks: action.payload,
            };
        },
        network(state, action) {
            return {
                ...state,
                blockchain_networks: action.payload,
            };
        },
    },
};
