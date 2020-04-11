import { stringify } from 'qs';
import request from '../utils/irequest';

export async function queryOrgList(params) {
    return request('/v2/organizations');
}
export async function queryOneOrg(params) {
    return request(`/v2/organizations/${params}`);
}


//export async function queryPeerOrg(params) {
//    return request(`http://192.168.7.21:8071/v2/organizations${stringify(params)}`);
//    return request('http://'+ window.location.hostname +`:8071/v2/organizations/${stringify(params)}`);
//}



export async function createOrg(params) {
    try {
        const res = request('/v2/organizations', {
            method: 'POST',
            body: params,
        });
        
        return res;
    }
    catch (e) {
        throw e;
    }
    /*
    return request('/v2/organizations', {
        method: 'POST',
        body: params,
    });*/
}

export async function updateOrg(params) {
    return request(`/v2/organizations/${params.organization.id}`, {
        method:'PUT',
        body: params,
    });
}

export async function deleteOrg(params) {
    return request(`/v2/organizations/${params.orgid}`, {method:['DELETE']});
}

export async function searchOrgById(params) {
    return request(`/v2/organizations/${params.Id}`, {method:['GET']});
}

export async function searchOrgByName(params) {
    return request(`/api/search_org?${stringify(params)}`);
}

