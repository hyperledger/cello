/**
 * Created by yuehaitao on 2017/4/4.
 */
import {message} from 'antd'
import {list, create, deleteCluster, operation} from '../services/cluster'

export default {
    namespace: 'cluster',
    state: {
        loading: false,
        activeClusters: [],
        inuseClusters: [],
        clusters: [],
        modalVisible: false,
        filter: 'active'
    },
    subscriptions: {
        setup ({ dispatch, history }) {
            history.listen(location => {
                if (location.pathname === '/chains') {
                    dispatch({
                        type: 'list'
                    })
                }
            })
        },
    },
    effects: {
        *list({payload}, {call, put}) {
            yield put({type: 'showLoading'})
            const data = yield call(list, payload)
            if (data && data.status === "OK") {
                yield put({
                    type: 'setClusters',
                    payload: {
                        clusters: data.data
                    }
                })
            }
            yield put({type: 'hideLoading'})
        },
        *create({payload}, {call, put}) {
            const data = yield call(create, payload)
            if (data && data.status === "OK") {
                yield put({
                    type: 'hideModal'
                })
                message.success("create chain success")
                yield put({
                    type: 'list'
                })
            } else {
                message.error('create chain failed')
            }
        },
        *deleteCluster({payload}, {call, put}) {
        	const data = yield call(deleteCluster, payload)
            if (data && data.status === "OK") {
                message.success("Delete cluster successful")
                yield put({
                    type: 'list'
                })
            } else {
                message.error("Delete cluster failed")
            }
        },
        *operation({payload}, {call, put}) {
        	const data = yield call(operation, payload)
            if (data && data.status === "OK") {
        	    message.success("Operation cluster successful")
                yield put({
                    type: 'list'
                })
            } else {
        	    message.error("Operation cluster failed")
            }
        },
    },
    reducers: {
        showLoading(state) {
            return {...state, loading: true}
        },
        hideLoading(state) {
            return {...state, loading: false}
        },
        setClusters(state, action) {
            return {...state, ...action.payload}
        },
        showModal(state) {
            return {...state, modalVisible: true}
        },
        hideModal(state) {
            return {...state, modalVisible: false}
        },
        changeFilter(state, action) {
            return {...state, ...action.payload}
        }
    }
}
