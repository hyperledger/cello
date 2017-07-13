import { login } from '../services/app'
import { parse } from 'qs'

export default {
    namespace: 'app',
    state: {
        logging: false,
        loginFail: false
    },
    subscriptions: {
        setup ({ dispatch }) {
        },
    },
    effects: {
        *login({payload}, {call, put}) {
            yield put({type: 'showLogging'})
            try {
                const data = yield call(login, payload)
                if (data && data.data.success) {
                    window.location.href = data.data.next;
                } else {
                    yield put({type: 'setLoginFail'})
                    yield put({type: 'hideLogging'})
                }
            } catch (e) {
                yield put({type: 'setLoginFail'})
                yield put({type: 'hideLogging'})
            }
        }
    },
    reducers: {
        showLogging(state) {
            return {...state, logging: true, loginFail: false}
        },
        hideLogging(state) {
            return {...state, logging: false}
        },
        setLoginFail(state) {
            return {...state, loginFail: true}
        }
    },
}
