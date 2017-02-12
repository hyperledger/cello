/**
 * Created by yuehaitao on 2017/1/18.
 */
export default {
    namespace: 'host',
    state: {
        hosts: []
    },
    subscriptions: {
        setup({dispatch, history}) {
            history.listen(location => {
                if (location.pathname == '/hosts') {
                    dispatch({type: 'queryHostList'})
                }
            })
        }
    },
    effects: {
        *queryHostList({
           payload
        }, {call, put}) {
            console.log("query host list")
        }
    },
    reducers: {
    }
}
