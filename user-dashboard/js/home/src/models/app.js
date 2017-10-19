import { getProfile, updateProfile } from '../services/app'
import {message} from 'antd'

export default {
    namespace: 'app',
    state: {
        profile: {},
        modalVisible: false
    },
    subscriptions: {
        setup ({ dispatch, history }) {
            history.listen(location => {
                if (location.pathname === "/" && window.apikey !== '') {
                    dispatch({
                        type: 'getProfile'
                    })
                }
            })
        },
    },
    effects: {
        *getProfile({payload}, {call, put}) {
            const data = yield call(getProfile, payload)
            if (data && data.success) {
                yield put({
                    type: 'setProfile',
                    payload: {
                        profile: data.result
                    }
                })
            }
        },
        *updateProfile({payload}, {call, put}) {
        	const data = yield call(updateProfile, payload)
            if (data && data.success) {
        	    message.success('Update profile success')
        	    yield put({
                    type: 'getProfile'
                })
            } else {
                message.error('Update profile failed')
            }
            yield call(payload.callback)
            yield put({
                type: 'hideModal'
            })
        },
    },
    reducers: {
        setProfile(state, action) {
            return {...state, ...action.payload}
        },
        showModal(state) {
            return {...state, modalVisible: true}
        },
        hideModal(state) {
            return {...state, modalVisible: false}
        }
    },
}
