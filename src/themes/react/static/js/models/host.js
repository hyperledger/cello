/**
 * Created by yuehaitao on 2017/1/18.
 */
import {getHosts, createHost, deleteHost, updateHost, opHost} from '../services/host'
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
                if (location.pathname === '/hosts' || location.pathname === '/chains/active') {
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
        },
        *createHost({payload}, {call, put}) {
            const data = yield call(createHost, payload)
            if (data && data.status === "OK") {
                yield put({
                    type: 'hideModal'
                })
                message.success("Create host successful")
                yield put({
                    type: 'getHosts'
                })
            } else {
                yield put({
                    type: 'hideModal'
                })
                message.error("Create host failed")
            }
        },
        *deleteHost({payload}, {select, call, put}) {
            const data = yield call(deleteHost, payload)
            if (data && data.status === "OK") {
                message.success("Delete Host successful")
                yield put({
                    type: 'getHosts'
                })
            } else {
                message.error("Delete Host failed")
            }
        },
        *updateHost({payload}, {call, put}) {
            const data = yield call(updateHost, payload)
            if (data && data.status === "OK") {
                yield put({
                    type: 'hideModal'
                })
                message.success("Update host successful")
                yield put({
                    type: 'getHosts'
                })
            } else {
                yield put({
                    type: 'hideModal'
                })
                message.error("Update host failed")
            }
        },
        *opHost({payload}, {select, call, put}) {
            const host = yield select(state => state.host)
            let {hosts} = host
            hosts.map((host, i) => {
                if (host.id === payload.id) {
                    host.status = "operating"
                }
            })
            yield put({
                type: 'getHostsSuccess',
                payload: {
                    hosts
                }
            })
            const data = yield call(opHost, payload)
            if (data && data.status === "OK") {
                message.success("Operation host successful")
                yield put({
                    type: 'getHosts'
                })
            } else {
                message.error("Operation host failed")
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
