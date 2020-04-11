import { stringify } from 'qs';
import request from '../utils/request';



export async function queryChainCode() {
    return request('/v2/chaincodes', {method:'GET'});
    // return request(`/api/getChaincode?${stringify(params)}`);installChainCode
}

export async function queryOneChainCode(params) {
    return request(`/v2/chaincodes/${params}`, {method:'GET'});
    // return request(`/api/getChaincode?${stringify(params)}`);installChainCode
}

export async function installChainCode(params) {
    const install=params.install;
    const id = params.id;
    console.log(params);
    return request(`/v2/chaincodes/${id}/install`, {
        method: 'POST',
        body: {
            install,
        },
    });
}
// return request(`/api/getChaincode?${stringify(params)}`);


export async function instantiateCC(params) {
    const instantiate=params.instantiate;
    const id = params.id;
    console.log(instantiate);
    return request(`/v2/chaincodes/${id}/instantiate`, {
        method: 'POST',
        body: {
            instantiate,
        },
    });
}

export async function deleteChainCode(params) {
    return request(`/v2/chaincodes/${params}`, {
        method: 'DELETE',
    });
}



export async function removeChainCode(params) {
    return request(`/v2/chaincodes/${params}`, {
        method: 'POST',
        body: {
            ...params,
            method: 'delete',
        },
    });
}

export async function createChainCode(params) {
    return request('/api/createChaincode', {
        method: 'POST',
        body:  params,
    });
}
export async function addChainCode(params) {
    return request('/api/rule', {
        method: 'POST',
        body: {
            ...params,
            method: 'post',
        },
    });
}

export async function upgradeCC(params) {
    const upgrade=params.upgrade;
    const id = params.id;
    console.log(upgrade);
    return request(`/v2/chaincodes/${id}/upgrade`, {
        method: 'POST',
        body: {
            upgrade,
        },
    });
}


