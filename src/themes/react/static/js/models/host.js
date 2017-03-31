/**
 * Created by yuehaitao on 2017/1/18.
 */
import {getHosts} from '../services/host'
import {message} from 'antd'

export default {
    namespace: 'host',
    state: {
        loadingHosts: false,
        hosts: [],
        modalVisible: false,
        modalType: 'create',
        currentHost: {}
    },
    subscriptions: {
        setup({dispatch, history}) {
            history.listen(location => {
                if (location.pathname === '/hosts') {
                    dispatch({type: 'getHosts'})
                }
            })
        }
    },
    effects: {
        *getHosts({payload}, {call, put}) {
            yield put({type: 'showLoadingHosts'})
            try {
                const data = yield call(getHosts)
                if (data && data.status === "OK") {
                    yield put({type: 'getHostsSuccess', payload: {
                        hosts: data.data
                    }})
                } else {
                    message.error("get hosts list failed")
                    yield put({type: 'hideLoadingHosts'})
                }
            } catch (e) {
                message.error("get hosts list failed")
                yield put({type: 'hideLoadingHosts'})
            }
        }
    },
    reducers: {
        showLoadingHosts(state) {
            return {...state, loadingHosts: true}
        },
        hideLoadingHosts(state) {
            return {...state, loadingHosts: false}
        },
        getHostsSuccess(state, action) {
            return {...state, ...action.payload, loadingHosts: false}
        },
        showModal(state, action) {
            return {...state, ...action.payload, modalVisible: true}
        },
        hideModal(state) {
            return {...state, modalVisible: false}
        }
    }
}
