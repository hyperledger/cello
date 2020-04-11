import { stringify } from 'qs';
import request from '../utils/irequest';

export async function queryLogList(params) {
    let url = `/v2/operator_logs?start=${params.STime}&end=${params.ETime}`;
    
    if (typeof(params.nameForSel) !== 'undefined' && params.nameForSel !== '') {
        url += `&opName=${params.nameForSel}`;
    }
    if (typeof(params.objectForSel) !== 'undefined' && params.objectForSel !== '') {
        url += `&opObject=${params.objectForSel}`;
    }
    if (typeof(params.operatorForSel) !== 'undefined' && params.operatorForSel !== '') {
        url += `&operator=${params.operatorForSel}`;
    }
    return request(url);
}

