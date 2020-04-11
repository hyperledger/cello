import { Modal} from "antd/lib/index";
import { queryLogList } from "../services/log";

export default {
    namespace: 'loglist',

    state: {
        logs: [],
    },

    effects: {
        *fetch({ payload }, { call, put }) {
            const result = yield call(queryLogList, payload);

            if (!result.success) {

            }
            yield put({
                type: 'queryList',
                payload: result.operator_logs,
            });
        },
    },

    reducers: {
        queryList(state, action) {
            return {
                ...state,
                logs: action.payload,
            };
        },
    },
};
