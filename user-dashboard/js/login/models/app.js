import { login, register } from '../services/app'
import { parse } from 'qs'

export default {
    namespace: 'app',
    state: {
        logging: false,
        loginFail: false,
        registering: false,
        registerFail: false
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
                if (data && data.success) {
                    window.location.href = "/";
                } else {
                    yield put({type: 'setLoginFail'})
                    yield put({type: 'hideLogging'})
                }
            } catch (e) {
                yield put({type: 'setLoginFail'})
                yield put({type: 'hideLogging'})
            }
        },
        *register({payload}, {call, put}) {
            yield put({type: 'showRegistering'})
            try {
                const data = yield call(register, payload)
                if (data && data.success) {
                    window.location.href = "/";
                } else {
                    yield put({type: 'setRegisterFail'})
                    yield put({type: 'hideRegistering'})
                }
            } catch (e) {
                yield put({type: 'setRegisterFail'})
                yield put({type: 'hideRegistering'})
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
        },
        showRegistering(state) {
            return {...state, registering: true, registerFail: false}
        },
        hideLogging(state) {
            return {...state, registering: false}
        },
        setLoginFail(state) {
            return {...state, registerFail: true}
        }
    },
}
