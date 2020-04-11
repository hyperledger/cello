import { stringify } from 'qs';
import request from '../utils/request';


export async function loadInstantChainCode(params) {
    //  console.log(request(`/v2/channels/${params}/InstantiatedChaincodes`));
    return request(`/v2/channels/${params}/InstantiatedChaincodes`,{method:'GET'});
    //  return request('/v2/channels', {method:'GET'});
}


export async function queryOrInvoke(params) {
    const chaincode={chaincode_operation:params.chaincode_operation};
    
    return request(`/v2/channels/${params.channel_id}/chaincodeOperation`, {     //${params.id}/
        method: 'POST',
        body: chaincode,
    });
}
