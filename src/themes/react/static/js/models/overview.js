
/* Copyright IBM Corp, All Rights Reserved.

 SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by yuehaitao on 2017/1/18.
 */
import {queryStat} from '../services/overview'

export default {
    namespace: 'overview',
    state: {
        loading: false,
        host: {
            status: [],
            type: []
        },
        cluster: {
            status: [],
            type: []
        },
        name: 'test',
    },
    subscriptions: {
        setup({ dispatch, history }) {
            history.listen(location => {
                if (location.pathname == '/overview' || location.pathname == "/") {
                    dispatch({type: 'queryStat', payload: {res: 'host'}})
                    dispatch({type: 'queryStat', payload: {res: 'cluster'}})
                }
            })
        }
    },
    effects: {
        *queryStat({ payload }, {call, put}) {
            yield put({type: 'showLoading'})
            const data = yield call(queryStat, payload)
            const statType = payload.res
            let payloadData = {}
            if (data) {
                payloadData[statType] = data
                yield put({
                    type: 'queryStatSuccess',
                    payload: payloadData
                })
            }
        }
    },
    reducers: {
        showLoading(state) {
            return { ...state, loading: true}
        },
        queryStatSuccess(state, action) {
            return { ...state, ...action.payload, loading: false }
        }
    }
}
