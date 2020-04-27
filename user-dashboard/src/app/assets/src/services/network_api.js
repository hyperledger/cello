import { stringify } from 'qs';
import request from '../utils/irequest';

export async function queryNetworks(params) {
    return request(`/v2/blockchain_networks/${params}`, {method: 'GET',});
}

export async function NetworksList() {
    return request('/v2/blockchain_networks', {method: 'GET',});
}