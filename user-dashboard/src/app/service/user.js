/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Service = require('egg').Service;
const Fabric_Client = require('../../packages/fabric-1.4/node_modules/fabric-client');
const Fabric_CA_Client = require('../../packages/fabric-1.4/node_modules/fabric-ca-client');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const roles = ['admin', 'operator', 'user'];
const bcrypt = require('bcryptjs');

class UserService extends Service {
    
    //time: 过期时间，单位：s
    async generateToken(userInfo){
        const { ctx,config } = this;
        let userName = userInfo.username;
        const networkId = userInfo.networkid;
        const userModel = await ctx.model.OrgUser.findOne({ username:userName, network_id: networkId });
        if(!userModel){
            return null;
        }
        let data = {id:userModel._id.toString(),username:userName};
        let time = 60*60*24*5;  //5天
        // const orgDomain = userName.split('@')[1];
        // let privCert;
        // let pubCert;
        //
        // let userCertificatePath;
        // if (userName.split('@')[0] === 'Admin') {
        //     userCertificatePath = 'admin';
        // }else{
        //     userCertificatePath = userName;
        // }
        //第一次登陆的Admin用户的证书存放在amdin目录中，其他用户的证书存放在username@域名目录中
        //const fabricFilePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDomain}/ca/${userCertificatePath}`;
        // const admin_sk = fs.readdirSync(fabricFilePath);
        // for(let each of admin_sk){
        //     if(each.split('-')[1] === 'priv'){
        //         privCert = each;
        //     }else if(each.split('-')[1] === 'pub'){
        //         pubCert = each;
        //     }
        // }
        // let datasRead = fs.readFileSync(`${fabricFilePath}/${privCert}`);
        let datasRead = fs.readFileSync('/opt/secret/private.key');
        let created = Math.floor(new Date().getTime()/1000);
        let token = jwt.sign({
            data,
            exp: created + time
        }, datasRead, {algorithm: 'RS256'});
        
        //存储到redis服务器
        //this.app.redis.set(token,userName);
        
        return token;
    }
    
    async verifyToken(token){
        // let networkId = ctx.req.user.networkid;
        // let userName = ctx.req.user.username;
        // const orgDomain = userName.split('@')[1];
        // let pubCert;
        // let userCertificatePath;
        // if (userName.split('@')[0] === 'Admin') {
        //     userCertificatePath = 'admin';
        // }else{
        //     userCertificatePath = userName;
        // }
        // const fabricFilePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDomain}/ca/${userCertificatePath}`;
        // const admin_sk = fs.readdirSync(fabricFilePath);
        // for(let each of admin_sk){
        //     if(each.split('-')[1] === 'pub'){
        //         pubCert = each;
        //     }
        // }
        // let datasRead = fs.readFileSync(`${fabricFilePath}/${pubCert}`);
        let res = '';
        let datasRead = fs.readFileSync('/opt/secret/public.key');
        try{
            const result = jwt.verify(token, datasRead, { algorithm: ['RS256'] }) || {};
            const { exp } = result;
            const current = Math.floor(new Date().getTime()/1000);
            if(current <= exp){
                res = result.data;
            }else{
                console.log("overdue");
                res = "overdue";
            }
        }catch (e) {
            console.log(e);
            res = "invalid"
        }
        return res;
    }
    
    async getToken(user){
        const {ctx} = this;
        const result = {};
        const userInfo = await ctx.service.user.login(user);
        if(userInfo == null){
            const message = "Please check if the username and password is right";
            console.log(message);
            result.message = message;
            result.success = false;
            return result;
        }
        //执行ctx.login之后，会将userinfo信息存入ctx.req.user中
        ctx.login(userInfo);
        const jwtToken = await ctx.service.user.generateToken(userInfo);
        let token = `JWT ${jwtToken}`;
        result.token = token;
        result.success = true;
        return result;
    }
    async comparePwd(fromUser, fromDatabase){
        return new Promise((resolve) => {
            bcrypt.compare(fromUser, fromDatabase, (err, res) => {
                resolve(res)
            })
        })
    }
    
    async doCrypto(password){
        return new Promise((resolve) => {
            bcrypt.genSalt(10, function(err, salt){
                bcrypt.hash(password, salt, function(err, hash){
                    resolve(hash)
                });
            });
        })
    }
    
    async getCookie(user){
        const { ctx } = this;
        const userInfo = await ctx.service.user.login(user);
        const result = {};
        if(userInfo == null){
            const message = "Please check if the username and password is right";
            console.log(message);
            result.message = message;
            result.success = false;
            return result;
        }
        let time = new Date().getTime();
        //let expiresTime = new Date(time + 10*365*24*60*60*1000);  //设置超期时间为10年
        let expiresTime = new Date(time + 60*1000);
        await ctx.login(userInfo);
        await ctx.cookies.set("name", user.username, {expires: expiresTime});
        let cookie = ctx.req.headers.cookie;
        //cookie = cookie + ";expires="+expiresTime;
        result.cookie = cookie;
        result.success = true;
        return result;
    }
    
    async login(user) {
        const { config, ctx } = this;
        const loginUrl = config.operator.url.login;
        const username = user.username;
        let password = user.password;
        
        const opName = 'orguser_login';
        const opObject = 'user';
        const opDate = new Date();
        const opDetails = "";
        const opSource = ctx.ip;
        
        if (username.indexOf('@') < 0) {
            return null;
        }
        
        const orgName = username.split('@')[1].split('.')[0];
        const networkId = await ctx.service.user.getNetworkIdByAdminUser(orgName);
        if((networkId === null) || (networkId === "")){
            console.log("Please create network first!");
            return null;
        }
        
        if (username.split('@')[0] === 'Admin') {
            const response = await ctx.curl(loginUrl, {
                method: 'POST',
                data: {
                    username,
                    password,
                },
                dataType: 'json',
            });
            if (response.status === 200) {
                /*
                const userModel = await ctx.model.User.findOne({ username });
                if (!userModel) {
                  await ctx.service.smartContract.copySystemSmartContract(response.data.id);
                  await ctx.model.User.create({
                    _id: response.data.id,
                    username,
                  });
                }
                */
                const orgName = username.split('@')[1].split('.')[0];
                const caVersion = await ctx.service.user.getCaVersionByNetworkId(networkId);
                const ca = await ctx.service.user.getCaInfoByUser(networkId, orgName);
                const caHost = ca.caHost;
                const caPort = ca.caPort;
                const mspId = orgName.charAt(0).toUpperCase() + orgName.slice(1) + 'MSP';
                const orgDoamin = username.split('@')[1];
                const caDockerStorePath = '/etc/hyperledger/fabric-ca-server-config/';
                const caStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca`;
                await ctx.enrollAdmin(caHost, caPort, mspId, caStorePath, caDockerStorePath, username, caVersion);
                
                const userModel = await ctx.model.OrgUser.findOne({ username:username, network_id: networkId });
                password = await this.doCrypto(password);
                if (!userModel) {
                    const date = new Date();
                    await ctx.model.OrgUser.create({
                        username: username,
                        password: password,
                        roles: 'org_admin',
                        active: 'true',
                        ancestors: '',
                        orgname: orgName,
                        network_id: networkId,
                        delegate_roles: 'org_admin',
                        affiliation_mgr: 'true',
                        revoker: 'true',
                        gencrl: 'true',
                        expiration_date: '8760h',
                        caVersion: caVersion,
                        information: [{
                            address: '',
                            phone: '',
                            email: '',
                            time: date
                        }]
                    });
                }
                await ctx.service.log.deposit(opName, opObject, opSource, username, opDate, 200, opDetails, {}, "");
                return {
                    username: user.username,
                    id: response.data.id,
                    role: roles[0],
                    networkid: networkId,
                };
            }
        } else {
            const orgUser = await ctx.model.OrgUser.findOne({ username, network_id: networkId });
            
            let isCorrect = await this.comparePwd(password, orgUser.password);
            if (!isCorrect || orgUser.active === "false") {
                return false;
            }
            
            let orgRole;
            if (orgUser) {
                if (orgUser.roles === 'org_admin') {
                    orgRole = roles[0];
                } else {
                    orgRole = roles[1];
                }
                await ctx.service.log.deposit(opName, opObject, opSource, username, opDate, 200, opDetails, {}, "");
                return {
                    username: orgUser.username,
                    id: orgUser._id,
                    role: orgRole,
                    networkid:networkId,
                };
            }
        }
        return null;
        
    }
    
    async getCaInfoByUser(networkId, orgName) {
        const { ctx } = this;
        let caHost;
        let caPort;
        let serviceEndPoints;
        const ca = {};
        
        const networkUrl = `http://operator-dashboard:8071/v2/blockchain_networks/${networkId}/serviceendpoints`;
        const networkResponse = await ctx.curl(networkUrl, {
            method: 'GET',
        });
        
        if (networkResponse.status === 200) {
            const serviceData = JSON.parse(networkResponse.data.toString());
            serviceEndPoints = serviceData;
            for (const each in serviceData.service_endpoints) {
                if (serviceData.service_endpoints[each].service_type === 'ca') {
                    const caOrg = serviceData.service_endpoints[each].service_name.split('.').slice(0)[1];
                    if (caOrg === orgName) {
                        caHost = serviceData.service_endpoints[each].service_ip;
                        caPort = serviceData.service_endpoints[each].service_port;
                        break;
                    }
                }
            }
        }
        ca.caHost = caHost;
        ca.caPort = caPort;
        ca.response = serviceEndPoints;
        return ca;
    }
    
    async getNetworkIdByAdminUser(orgName) {
        const { ctx } = this;
        const orgUrl = `http://operator-dashboard:8071/v2/organizations?name=${orgName}`;
        let networkId;
        const orgResponse = await ctx.curl(orgUrl, {
            method: 'GET',
        });
        
        if (orgResponse.status === 200) {
            const data = JSON.parse(orgResponse.data.toString());
            networkId = data.organizations[0].blockchain_network_id;
        }
        return networkId;
    }
    
    async getCaVersionByNetworkId(blockchain_network_id) {
        const { ctx, config } = this;
        const orgUrl = `http://operator-dashboard:8071/v2/blockchain_networks/${blockchain_network_id}`;
        let fabricVersion;
        const blockResponse = await ctx.curl(orgUrl, {
            method: 'GET',
        });
        
        if (blockResponse.status === 200) {
            const data = JSON.parse(blockResponse.data.toString());
            fabricVersion = data.blockchain_network.fabric_version;
        }
        fabricVersion = fabricVersion.split('.').join('_');
        const caVersion = config.default.fabricCaVersions[`${fabricVersion}`];
        return caVersion;
    }
    
    async getCertiExpirationState(userCreateTime, userExpirationDateStr) {
        let flag;
        const nowTime = new Date();
        const timeSpentHour = (nowTime - userCreateTime) / (1000 * 3600);
        const userExpirationDateInt = parseInt(userExpirationDateStr.substring(0, userExpirationDateStr.length - 1));
        console.log('timeSpentHour: ' + timeSpentHour);
        console.log('userExpirationDateInt: ' + userExpirationDateInt);
        if (timeSpentHour > userExpirationDateInt) {
            console.log(' certificate has become invalid , need to reenroll');
            flag = false;
        } else {
            const leftTime = userExpirationDateInt - timeSpentHour;
            console.log(' Validity period remains ' + leftTime);
            flag = true;
        }
        return flag;
    }
    
    
    async createOrguser(name, role, password, delegateRoles, affiliation, affiliationMgr, revoker, gencrl, SSOUser) {
        const { ctx, config } = this;
        const userName = ctx.req.user.username;
        let result = {};
        let roleUser;
        if(role === 'org_admin'){
            roleUser = 'org_admin,org' +
                '' +
                '_user';
        }else{
            roleUser = role;
        }
        let delegateRolesUser;
        if(delegateRoles === 'org_admin'){
            delegateRolesUser = 'org_admin,org_user';
        }else{
            delegateRolesUser = delegateRoles;
        }
        
        const attrs = [
            {
                name: 'hf.Registrar.Roles',
                //value: 'org_admin',
                value: roleUser,
            },
            {
                name: 'hf.Registrar.DelegateRoles',
                //value: 'org_admin',
                value: delegateRolesUser,
            },
            {
                name: 'hf.Revoker',
                value: revoker,
            },
            {
                name: 'hf.IntermediateCA',
                value: 'true',
            },
            {
                name: 'hf.GenCRL',
                value: gencrl,
            },
            {
                name: 'hf.Registrar.Attributes',
                value: '*',
            },
            {
                name: 'hf.AffiliationMgr',
                value: affiliationMgr,
            },
        ];
        
        const opName = 'orguser_create';
        const opSource = ctx.ip;
        const opObject = 'user';
        const opDate = new Date();
        const opDetails = ctx.request.body.orguser;
        const orgName = userName.split('@')[1].split('.')[0];
        const orgDoamin = userName.split('@')[1];
        const mspId = orgName.charAt(0).toUpperCase() + orgName.slice(1) + 'MSP';
        let networkId = await ctx.service.user.getNetworkIdByAdminUser(orgName);
        let caStorePath;
        let caDockerStorePath;
        let ca;
        let ancest;
        
        //校验用户名是否带了@，是否跟操作员后面的组织名、域名相同,是否只有一个@
        try{
            if((name.split('@')[1] !== userName.split('@')[1])||(name.split('@').length-1!==1)){
                const errorMsg = 'func:createOrguser. name format is wrong!:';
                await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, 400, opDetails, {}, errorMsg);
                result.message = errorMsg;
                result.success = false;
                result.code = 400;
                return result;
            }
        }catch(err){
            const error_Msg = 'func:createOrguser. name format is wrong!: ';
            result.message = error_Msg;
            result.success = false;
            result.code = 400;
            await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, 400, opDetails, {}, error_Msg);
            return result;
        }
        
        try {
            if (userName.split('@')[0] === 'Admin') {
                ancest = 'Admin';
            } else {
                const userInfo = await ctx.model.OrgUser.findOne({ username: userName, network_id: networkId });
                if (userInfo === null) {
                    const err_message = `user ${userName} can not found in db`;
                    result.message = err_message;
                    result.success = false;
                    result.code = 400;
                    return result;
                }
                ancest = userInfo.ancestors + '.' + userName.split('@')[0];
            }
            opDetails.network_id = networkId;
            caStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca`;
            caDockerStorePath = '/etc/hyperledger/fabric-ca-server-config/';
            ca = await ctx.service.user.getCaInfoByUser(networkId, orgName);
        } catch (err) {
            console.log('func:createOrguser. get networkid or caInfo by orgName Failed, err: ' + err);
            result.message = err.message;
            result.success = false;
            result.code = 400;
            await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, 400, opDetails, {}, err.message);
            return result;
        }
        
        const userInfo = await ctx.model.OrgUser.findOne({ username: userName , network_id: networkId});
        if (userInfo === null) {
            const err_message = `user ${userName} is unknown.`;
            result.success = false;
            result.code = 400;
            result.message = err_message;
            await ctx.service.log.deposit(opName, opObject, opSource, 'unknown', opDate, 400, opDetails, {}, err_message);
            return result;
        }
        
        let SSO_User = '';
        if ( userInfo.roles === 'org_admin' && SSOUser && SSOUser !== '' ) {
            SSO_User = SSOUser;
            
            const target = await ctx.model.OrgUser.findOne({ SSOUser: SSOUser, network_id: networkId });
            if (target !== null) {
                const err_message = `The SSO user ${SSOUser} has been used.`;
                result.success = false;
                result.code = 400;
                result.message = err_message;
                await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, 400, opDetails, {}, err_message);
                return result;
            }
        }
        
        
        const networkInfo = await this.getNetworkById(networkId);
        const caHost = ca.caHost;
        const caPort = ca.caPort;
        ca.network = networkInfo.blockchain_network;
        ca.orgName = orgName;
        const caVersion = await ctx.service.user.getCaVersionByNetworkId(networkId);
        let registerUser;
        try {
            const userAuth = userName.split('@')[0];
            if (userAuth === 'Admin') {
                await ctx.enrollAdmin(caHost, caPort, mspId, caStorePath, caDockerStorePath, userName, caVersion);
                registerUser = 'admin';
            } else {
                registerUser = userName;
            }
            if (caVersion !== 'ca_v1.4') {
                caStorePath = `${caStorePath}/Admin@${orgDoamin}`;
            }
            const result = await ctx.registerUser(registerUser, ca, mspId, name, role, affiliation, caStorePath, caDockerStorePath, attrs, caVersion);
            const createTime = new Date();
            password = await this.doCrypto(password);
            if (result === true) {
                await ctx.model.OrgUser.create({
                    username: name,
                    password,
                    roles: role,
                    active: true,
                    ancestors: ancest,
                    orgname: orgName,
                    network_id: networkId,
                    delegate_roles: delegateRoles,
                    affiliation_mgr: affiliationMgr,
                    revoker,
                    gencrl,
                    create_time: createTime,
                    expiration_date: '8760h',
                    caVersion,
                    information: [{
                        address: '',
                        phone: '',
                        email: '',
                        time: createTime
                    }],
                    SSOUser: SSO_User
                });
                await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, 200, opDetails, {}, '');
                let result1={};
                result1.code = 200;
                result1.success = true;
                return result1;
            }
            console.log(`register user ${name} failed`);
            await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, 400, opDetails, {}, result.message);
            return result;
        } catch (err) {
            console.log(`register user ${name} failed` + err.message);
        }
        const errorMsg = `register user ${name} failed`;
        await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, 400, opDetails, {}, errorMsg);
        result.message = errorMsg;
        result.success = false;
        return result;
    }
    
    async setSSOUser(id, SSOUser) {
        const { ctx } = this;
        const userName = ctx.req.user.username;
        const opName = 'orguser_setSSOUser';
        const opSource = ctx.ip;
        const opObject = 'user';
        const opDate = new Date();
        const opDetails = ctx.request.body.setuser;
        const result = {
            success: true,
            code: 200
        };
        
        const orgName = userName.split('@')[1].split('.')[0];
        let networkId = await ctx.service.user.getNetworkIdByAdminUser(orgName);
        
        const user = await ctx.model.OrgUser.findOne({ SSOUser: SSOUser, network_id: networkId });
        if (user !== null) {
            const err_message = `The SSO user ${SSOUser} have been used.`;
            result.success = false;
            result.code = 400;
            result.message = err_message;
            await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, 400, opDetails, {}, err_message);
            return result;
        }
        
        if (userName.split('@')[0] !== 'Admin') {
            const operator = await ctx.model.OrgUser.findOne({ username: userName, network_id: networkId });
            if (operator.username === undefined) {
                const err_message = `The user ${userName} is known.`;
                result.success = false;
                result.code = 400;
                result.message = err_message;
                await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, 400, opDetails, {}, err_message);
                return result;
            }
            
            if (operator.roles !== 'org_admin') {
                const err_message = `you do not have authority.`;
                result.success = false;
                result.code = 400;
                result.message = err_message;
                await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, 400, opDetails, {}, err_message);
                return result;
            }
        }
        
        const target = await ctx.model.OrgUser.findOne({ _id: id, network_id: networkId });
        if (target === null) {
            const err_message = `The target user is known.`;
            result.success = false;
            result.code = 400;
            result.message = err_message;
            await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, 400, opDetails, {}, err_message);
            return result;
        }
        
        await ctx.model.OrgUser.update({
            _id: id
        }, {'$set': { SSOUser: SSOUser } }, { upsert: true });
        
        await ctx.service.log.deposit(opName, opObject, opSource, userName, opDate, 200, opDetails, {}, '');
        return result;
    }
    
    async getNetworkById(networkId) {
        const { ctx } = this;
        const orgUrl = `http://operator-dashboard:8071/v2/blockchain_networks/${networkId}`;
        const orgResponse = await ctx.curl(orgUrl, {
            method: 'GET',
        });
        
        if (orgResponse.status === 200) {
            const data = JSON.parse(orgResponse.data.toString());
            data.success = true;
            return data;
        }
        
        return {success: false};
    }
    
    async deleteOrguser(name, reason) {
        const { ctx, config } = this;
        const operaterName = ctx.req.user.username;
        const opName = 'orguser_delete';
        const opSource = ctx.ip;
        const opObject = 'user';
        const opDate = new Date();
        const opDetails = {};
        const resultdel = {};
        opDetails.name = ctx.req.query.name;
        opDetails.reason = ctx.req.query.reason;
        const orgName = operaterName.split('@')[1].split('.')[0];
        const orgDoamin = operaterName.split('@')[1];
        const operaterAncest = operaterName.split('@')[0];
        let networkId = await ctx.service.user.getNetworkIdByAdminUser(orgName);
        let caStorePath;
        let caDockerStorePath;
        let ca;
        let regUser;
        try {
            if (operaterName.split('@')[0] === 'Admin') {
                regUser = 'admin';
            } else {
                const userInfo = await ctx.model.OrgUser.findOne({ username: operaterName, network_id: networkId });
                if (userInfo === null) {
                    const err_message = `user ${operaterName} can not found in db`;
                    resultdel.message = err_message;
                    resultdel.success = false;
                    resultdel.code = 400;
                    await ctx.service.log.deposit(opName, opObject, opSource, operaterName, opDate, 400, opDetails, {}, err_message);
                    return resultdel;
                }
                regUser = operaterName;
            }
            opDetails.network_id = networkId;
            caStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca`;
            caDockerStorePath = '/etc/hyperledger/fabric-ca-server-config/';
            ca = await ctx.service.user.getCaInfoByUser(networkId, orgName);
        } catch (err) {
            const errorMsg = 'func:deleteOrguser. get networkid or caInfo by orgName Failed, err: ' + err.message;
            resultdel.message = errorMsg;
            resultdel.success = false;
            resultdel.code = 400;
            console.log(errorMsg);
            await ctx.service.log.deposit(opName, opObject,opSource, operaterName, opDate, 400, opDetails, {}, errorMsg);
            return resultdel;
        }
        
        const caHost = ca.caHost;
        const caPort = ca.caPort;
        const caVersion = await ctx.service.user.getCaVersionByNetworkId(networkId);
        // 只能删除自己创建的用户
        const userInfo = await ctx.model.OrgUser.findOne({ username: name, network_id: networkId });
        if (userInfo != null) {
            const userAncest = userInfo.ancestors;
            if (userAncest.split('.').indexOf(operaterAncest) < 0) {
                const err = operaterName + 'can not delete' + name + ', not it\'s ancestors.';
                resultdel.message = err;
                resultdel.success = false;
                resultdel.code = 400;
                await ctx.service.log.deposit(opName, opObject, opSource,  operaterName, opDate, 400, opDetails, {}, err);
                return resultdel;
            }
        }
        
        if (caVersion === 'ca_v1.4') {
            caStorePath = `${caStorePath}/${regUser}`;
        }
        else {
            caStorePath = `${caStorePath}/Admin@${orgDoamin}`;
        }
        const result = await ctx.deleteUser(regUser, name, reason, caHost, caPort, caStorePath, caDockerStorePath, caVersion);
        if (result === true) {
            try {
                await ctx.model.OrgUser.remove({ username: name, network_id: networkId });
            } catch (err) {
                const errMsg = name + 'revoked success but user ' + name + ' data remove from db failed,err:' + err.message;
                resultdel.message = errMsg;
                resultdel.success = false;
                resultdel.code = 400;
                console.log(errMsg);
                await ctx.service.log.deposit(opName, opObject, opSource, operaterName, opDate, 400, opDetails, {}, errMsg);
                return resultdel;
            }
        }
        await ctx.service.log.deposit(opName, opObject, opSource, operaterName, opDate, 200, opDetails, {}, '');
        return result;
    }
    
    async getOrguser(name) {
        const { ctx } = this;
        let userAncest;
        let targetUser = name;
        const user = {};
        const operaterName = ctx.req.user.username;
        // const operaterName = 'new3@org1.ex.com';
        const orgName = operaterName.split('@')[1].split('.')[0];
        const networkId =  await ctx.service.user.getNetworkIdByAdminUser(orgName);
        const operaterAncest = operaterName.split('@')[0];
        
        if (name.split('@')[0] === 'Admin') {
            targetUser = 'admin';
        }
        
        const userInfo = await ctx.model.OrgUser.findOne({ username: name, network_id: networkId });
        if (userInfo != null) {
            userAncest = userInfo.ancestors;
            
            //允许祖宗节点和自己获取自己的信息
            if (userAncest.split('.').indexOf(operaterAncest) >= 0
                || name === operaterName
            ) {
                const userIdentity = await ctx.service.user.getIdentity(targetUser, operaterName);
                if (userIdentity.success === true) {
                    userInfo._doc.affiliation = userIdentity.result.affiliation;
                }
                user.success = true;
                delete userInfo._doc.password;
                user.orguser = userInfo;
            } else {
                user.success = false;
                user.reason = 'not authoritied';
            }
        } else {
            user.success = false;
            user.reason = 'not found';
        }
        
        return user;
    }
    
    async getOrguserList() {
        const { ctx } = this;
        const user = {};
        user.orgusers = [];
        const operaterName = ctx.req.user.username;
        // const operaterName = 'new3@org2.ex.com';
        const operaterAncest = operaterName.split('@')[0];
        const orgName = operaterName.split('@')[1].split('.')[0];
        const networkId =  await ctx.service.user.getNetworkIdByAdminUser(orgName);
        let userAncest;
        const userListInOrg = await ctx.model.OrgUser.find({ orgname: orgName, network_id: networkId });
        if (userListInOrg.length !== 0 || userListInOrg !== null) {
            for (const each in userListInOrg) {
                userAncest = userListInOrg[each].ancestors;
                if (userAncest.split('.').indexOf(operaterAncest) >= 0) {
                    const userIdentity = await ctx.service.user.getIdentity(userListInOrg[each].username, operaterName);
                    if (userIdentity.success === true) {
                        userListInOrg[each]._doc.affiliation = userIdentity.result.affiliation;
                        delete userListInOrg[each]._doc.password;
                    }
                    user.orgusers.push(userListInOrg[each]);
                }
            }
            user.success = true;
        } else {
            user.success = false;
        }
        return user;
    }
    
    
    async updateOrguserPassword(passwordold,passwordnew) {
        const { ctx } = this;
        const result = { success: true };
        const operaterName = ctx.req.user.username;
        const opName = 'orguser_password_update';
        const opSource = ctx.ip;
        const opObject = 'user';
        const opDate = new Date();
        const opDetails = {};
        const orgName = operaterName.split('@')[1].split('.')[0];
        const networkId =  await ctx.service.user.getNetworkIdByAdminUser(orgName);
        
        opDetails.name = operaterName;
        if (operaterName.split('@')[0] === 'Admin') {
            result.success = false;
            result.message = 'can not modify ' + operaterName + 'password!';
            console.log(result.message);
            await ctx.service.log.deposit(opName, opObject, opSource, operaterName, opDate, 400, opDetails, {}, result.message);
            return result;
        }
        const reg = /[^A-Za-z0-9\-_]/;
        const isVaild = reg.test(passwordnew);
        if (isVaild !== false) {
            result.success = false;
            result.message = 'password container invalid character';
            console.log(result.message);
            await ctx.service.log.deposit(opName, opObject, opSource, operaterName, opDate, 400, opDetails, {}, result.message);
            return result;
        }
        passwordnew = await this.doCrypto(passwordnew);
        try {
            const userInfo = await ctx.model.OrgUser.findOne({ username: operaterName, network_id: networkId });
            if (userInfo != null) {
                let isCorrect = await this.comparePwd(passwordold, userInfo.password);
                if (!isCorrect){
                    result.message = 'Wrong password!';
                    console.log(result.message);
                    result.success = false;
                }
                await ctx.model.OrgUser.update({
                    username: operaterName, network_id: networkId
                }, {'$set': { password: passwordnew } }, { upsert: true });
            } else {
                console.log('User' + operaterName + 'not found!');
                result.success = false;
                result.message = 'Not found ' + operaterName;
            }
        } catch (err) {
            await ctx.service.log.deposit(opName, opObject,opSource, operaterName, opDate, 400, opDetails, {}, err);
            result.success = false;
            result.message = err.message;
            return result;
        }
        if(result.success === false){
            await ctx.service.log.deposit(opName, opObject, opSource, operaterName, opDate, 400, opDetails, {}, '');
        } else{
            await ctx.service.log.deposit(opName, opObject, opSource, operaterName, opDate, 200, opDetails, {}, '');
        }
        return result;
    }
    
    async resetOrguserPassword(curPassword, name, newPassword){
        const { ctx,config } = this;
        const operaterName = ctx.req.user.username;
        const opName = 'orguser_password_reset';
        const opSource = ctx.ip;
        const opObject = 'user';
        const opDate = new Date();
        const opDetails = {};
        const userName = operaterName.split('@')[0];
        const orgName = operaterName.split('@')[1].split('.')[0];
        const networkId =  await ctx.service.user.getNetworkIdByAdminUser(orgName);
        const result = { success: true };
        if (userName !== 'Admin') {
            result.success = false;
            result.message = 'user '+ operaterName +' do not have authority to reset password';
            await ctx.service.log.deposit(opName, opObject, opSource, operaterName, opDate, 400, opDetails, {}, result.message);
            result.code = 400;
            return result;
        }
        const loginUrl = config.operator.url.login;
        
        const response = await ctx.curl(loginUrl, {
            method: 'POST',
            data: {
                username:operaterName,
                password:curPassword,
            },
            dataType: 'json',
        });
        if (response.status !== 200) {
            result.success = false;
            result.message = 'user '+ operaterName +' password is wrong. do not have authority to reset password';
            result.code = 400;
            await ctx.service.log.deposit(opName, opObject, opSource, operaterName, opDate, 400, opDetails, {}, result.message);
            return result;
        }
        const reg = /[^A-Za-z0-9\-_]/;
        const isVaild = reg.test(newPassword);
        if (isVaild !== false) {
            result.success = false;
            result.message = 'password container invalid character';
            console.log(result.message);
            await ctx.service.log.deposit(opName, opObject, opSource, operaterName, opDate, 400, opDetails, {}, result.message);
            return result;
        }
        try{
            const passwd = await this.doCrypto(newPassword);
            await ctx.model.OrgUser.update({
                username: name, network_id: networkId
            }, {'$set': { password: passwd } }, { upsert: true });
            console.log("success modified user's passwd ");
        }catch (e) {
            result.success = false;
            result.message = 'modify password failed';
            result.code = 400;
            await ctx.service.log.deposit(opName, opObject, opSource, operaterName, opDate, 400, opDetails, {}, result.message);
            return result;
        }
        result.message = 'Successfully modified user\'s passwd.';
        result.code = 200;
        await ctx.service.log.deposit(opName, opObject, opSource, operaterName, opDate, 200, opDetails, {}, result.message);
        return result;
        
    }
    
    async updateOrguserState(name, activenew) {
        const { ctx } = this;
        const operaterName = ctx.req.user.username;
        const opName = 'orguser_state_update';
        const opSource = ctx.ip;
        const opObject = 'user';
        const opDate = new Date();
        const opDetails = {};
        const orgName = operaterName.split('@')[1].split('.')[0];
        const networkId =  await ctx.service.user.getNetworkIdByAdminUser(orgName);
        
        opDetails.user_name = name;
        opDetails.activenew = activenew;
        
        const operaterAncest = operaterName.split('@')[0];
        const result = { success: true };
        let opCode = 200;
        if (operaterName === name) {
            result.success = false;
            result.message = 'user can not modify self\'s active state';
            result.code = 400;
            await ctx.service.log.deposit(opName, opObject, opSource, operaterName, opDate, opCode, opDetails, {}, result.message);
            console.log(result.message);
            return result;
        }
        try {
            const userInfo = await ctx.model.OrgUser.findOne({ username: name, network_id: networkId });
            if (userInfo != null) {
                const userAncest = userInfo.ancestors;
                if (userAncest.split('.').indexOf(operaterAncest) >= 0) {
                    if ((['true', 'false'].indexOf(activenew) >= 0) && (activenew !== userInfo.active)) {
                        await ctx.model.OrgUser.update({
                            username: name, network_id: networkId
                        }, {'$set': { active: activenew } }, { upsert: true });
                    }
                } else {
                    // operator is not name's ancestor.
                    result.success = false;
                    result.message = 'Not authorthed';
                    result.code = 400;
                }
            } else {
                result.success = false;
                result.message = 'User' + name + 'not found!';
                result.code = 400;
                console.log(result.message);
            }
        } catch (err) {
            result.success = false;
            result.message = err.message;
            result.code = 400;
            await ctx.service.log.deposit(opName, opObject, opSource, operaterName, opDate, 400, opDetails, {}, err);
            return result;
        }
        await ctx.service.log.deposit(opName, opObject, opSource, operaterName, opDate, opCode, opDetails, {}, result.message);
        return result;
    }
    
    async updateOrguserInfo(information) {
        const { ctx } = this;
        const operaterName = ctx.req.user.username;
        const opName = 'orguser_information_update';
        const opSource = ctx.ip;
        const opObject = 'user';
        const opDate = new Date();
        const opDetails = {};
        const orgName = operaterName.split('@')[1].split('.')[0];
        const networkId =  await ctx.service.user.getNetworkIdByAdminUser(orgName);
        
        opDetails.address = information.address;
        opDetails.phone = information.phone;
        opDetails.email = information.email;
        
        const result = { success: true };
        let opCode = 200;
        try {
            const userInfo = await ctx.model.OrgUser.findOne({ username: operaterName, network_id: networkId });
            if (userInfo != null) {
                const info = userInfo.information;
                const length = info.length;
                if (info[length - 1].address !== information.address
                    || info[length - 1].phone !== information.phone
                    || info[length - 1].email !== information.email
                ) {
                    info.push({
                        address: information.address,
                        phone: information.phone,
                        email: information.email,
                        time: opDate
                    });
                    await ctx.model.OrgUser.update({
                        username: operaterName, network_id: networkId
                    }, {'$set': { information: info } }, { upsert: true });
                }
            }
            else {
                result.success = false;
                result.message = 'User ' + operaterName + ' not found!';
                opCode = 400;
            }
        } catch (err) {
            result.success = false;
            result.message = err.message;
            result.code = 400;
            await ctx.service.log.deposit(opName, opObject, opSource, operaterName, opDate, 400, opDetails, {}, err);
            return result;
        }
        await ctx.service.log.deposit(opName, opObject, opSource, operaterName, opDate, opCode, opDetails, {}, result.message);
        return result;
    }
    
    async reenrollOrgUser(name) {
        const { ctx, config } = this;
        const operatorName = ctx.req.user.username;
        const opName = 'orguser_reenroll';
        const opSource = ctx.ip;
        const opObject = 'user';
        const opDate = new Date();
        const opDetails = {};
        const resultdel = {};
        opDetails.user_name = name;
        const operatorAncest = operatorName.split('@')[0];
        const orgName = operatorName.split('@')[1].split('.')[0];
        if (orgName !== name.split('@')[1].split('.')[0]) {
            const errorMsg = 'User ' + operatorName + ' and ' + name + ' not in a org';
            resultdel.message = errorMsg;
            resultdel.success = false;
            resultdel.code = 400;
            await ctx.service.log.deposit(opName, opObject, opSource, operatorName, opDate, 400, opDetails, {}, errorMsg);
            return resultdel;
        }
        const orgDoamin = operatorName.split('@')[1];
        const mspId = orgName.charAt(0).toUpperCase() + orgName.slice(1) + 'MSP';
        let ca;
        let networkId = await ctx.service.user.getNetworkIdByAdminUser(orgName);
        let caStorePath;
        let caDockerStorePath;
        let regUser;
        
        try {
            if (operatorName.split('@')[0] === 'Admin') {
                regUser = 'admin';
            } else {
                const userInfo = await ctx.model.OrgUser.findOne({ username: name, network_id: networkId });
                if (userInfo === null) {
                    const errorMsg = `user ${name} can not found in db`;
                    resultdel.message = errorMsg;
                    resultdel.success = false;
                    resultdel.code = 400;
                    await ctx.service.log.deposit(opName, opObject, opSource, operatorName, opDate, 400, opDetails, {}, errorMsg);
                    return resultdel;
                }
                if (userInfo != null) {
                    const userAncest = userInfo.ancestors;
                    if (userAncest.split('.').indexOf(operatorAncest) < 0) {
                        const errorMsg = 'User ' + operatorName + ' is not  ' + name + '\'s ancestor, forbidden to enroll';
                        resultdel.message = errorMsg;
                        resultdel.success = false;
                        resultdel.code = 400;
                        await ctx.service.log.deposit(opName, opObject, opSource, operatorName, opDate, 400, opDetails, {}, errorMsg);
                        return resultdel;
                    }
                    regUser = operatorName;
                }
            }
            opDetails.network_id = networkId;
            caStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca`;
            caDockerStorePath = '/etc/hyperledger/fabric-ca-server-config/';
            ca = await ctx.service.user.getCaInfoByUser(networkId, orgName);
        } catch (err) {
            const errorMsg = 'func: reenrollOrgUser. get networkid or caInfo by orgName Failed, err: ' + err;
            resultdel.message = errorMsg;
            resultdel.success = false;
            resultdel.code = 400;
            await ctx.service.log.deposit(opName, opObject,opSource, operatorName, opDate, 400, opDetails, {}, errorMsg);
            return resultdel;
        }
        let result;
        const caHost = ca.caHost;
        const caPort = ca.caPort;
        const caVersion = await ctx.service.user.getCaVersionByNetworkId(networkId);
        try {
            if (caVersion === 'ca_v1.4') {
                caStorePath = `${caStorePath}/${regUser}`;
            }
            else {
                caStorePath = `${caStorePath}/Admin@${orgDoamin}`;
            }
            result = ctx.reenrollUser(regUser, name, mspId, caHost, caPort, caStorePath, caDockerStorePath, caVersion);
        } catch (e) {
            resultdel.message = e.message;
            resultdel.success = false;
            resultdel.code = 400;
            await ctx.service.log.deposit(opName, opObject,opSource, operatorName, opDate, 400, opDetails, {}, e);
            return resultdel;
        }
        
        await ctx.service.log.deposit(opName, opObject, opSource, operatorName, opDate, 200, opDetails, {}, '');
        return result;
    }
    
    async createAffiliation(targetName) {
        // const fabric_client = new Fabric_Client();
        const { ctx, config } = this;
        const operatorName = ctx.req.user.username;
        const opName = 'orguser_affiliation_create';
        const opSource = ctx.ip;
        const opObject = 'user';
        const opDate = new Date();
        const opDetails = {};
        opDetails.name = targetName;
        const resultdel = {};
        
        const orgName = operatorName.split('@')[1].split('.')[0];
        const orgDoamin = operatorName.split('@')[1];
        let networkId = await ctx.service.user.getNetworkIdByAdminUser(orgName);
        let caStorePath = '';
        let caDockerStorePath = '';
        let regUser = '';
        let ca = null;
        
        try {
            if (operatorName.split('@')[0] === 'Admin') {
                regUser = 'admin';
            } else {
                const userInfo = await ctx.model.OrgUser.findOne({ username: operatorName, network_id: networkId });
                if (userInfo === null) {
                    const err_message = `user ${operatorName} can not found in db`;
                    resultdel.message = err_message;
                    resultdel.success = false;
                    resultdel.code = 400;
                    await ctx.service.log.deposit(opName, opObject, opSource, operatorName, opDate, 400, opDetails, {}, err_message);
                    return resultdel;
                }
                regUser = operatorName;
            }
            caStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca`;
            caDockerStorePath = '/etc/hyperledger/fabric-ca-server-config/';
            ca = await ctx.service.user.getCaInfoByUser(networkId, orgName);
        } catch (err) {
            const err_message = 'func:createAffiliation. get networkid or caInfo by orgName Failed, err: ' + err;
            resultdel.message = err_message;
            resultdel.success = false;
            resultdel.code = 400;
            await ctx.service.log.deposit(opName, opObject,opSource, operatorName, opDate, 400, opDetails, {}, err_message);
            return resultdel;
        }
        let res;
        try {
            const caVersion = await ctx.service.user.getCaVersionByNetworkId(networkId);
            if (caVersion === 'ca_v1.4') {
                caStorePath = `${caStorePath}/${regUser}`;
            }
            else {
                caStorePath = `${caStorePath}/Admin@${orgDoamin}`;
            }
            res = await ctx.createUserAffiliation(regUser, targetName, ca.caHost, ca.caPort, caStorePath, caDockerStorePath, caVersion);
        } catch (e) {
            resultdel.message = e.message;
            resultdel.success = false;
            resultdel.code = 400;
            await ctx.service.log.deposit(opName, opObject, opSource, operatorName, opDate, 400, opDetails, {}, e);
            return resultdel;
        }
        
        await ctx.service.log.deposit(opName, opObject, opSource, operatorName, opDate, 200, opDetails, {}, '');
        return res;
    }
    
    async getAffiliations() {
        const { ctx, config } = this;
        const operatorName = ctx.req.user.username;
        const orgName = operatorName.split('@')[1].split('.')[0];
        const mspId = orgName.charAt(0).toUpperCase() + orgName.slice(1) + 'MSP';
        
        const orgDoamin = operatorName.split('@')[1];
        
        let networkId = await ctx.service.user.getNetworkIdByAdminUser(orgName);
        let caStorePath = '';
        let caDockerStorePath = '';
        let regUser = '';
        let ca = null;
        let caVersion;
        
        try {
            if (operatorName.split('@')[0] === 'Admin') {
                regUser = 'admin';
            } else {
                const userInfo = await ctx.model.OrgUser.findOne({ username: operatorName, network_id: networkId });
                if (userInfo === null) {
                    ctx.throw(200, `\r\n user ${operatorName} can not found in db`);
                }
                
                regUser = operatorName;
            }
            caVersion = await ctx.service.user.getCaVersionByNetworkId(networkId);
            
            caStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca/`;
            caDockerStorePath = '/etc/hyperledger/fabric-ca-server-config/';
            ca = await ctx.service.user.getCaInfoByUser(networkId, orgName);
            if (operatorName.split('@')[0] === 'Admin') {
                await ctx.enrollAdmin(ca.caHost, ca.caPort, mspId, caStorePath, caDockerStorePath, operatorName, caVersion);
            }
            
            if (caVersion === 'ca_v1.4') {
                caStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca/${regUser}`;
            }
            else {
                caStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca/Admin@${orgDoamin}`;
            }
        } catch (err) {
            console.log('func: getAffiliations. get networkid or caInfo by orgName Failed, err: ' + err);
            return {
                success: false,
                message: err,
            };
        }
        
        const result = await ctx.getUserAffiliations(regUser, ca.caHost, ca.caPort, caStorePath, caDockerStorePath, caVersion);
        return result;
    }
    
    
    async delAffiliation() {
        // const fabric_client = new Fabric_Client();
        const { ctx, config } = this;
        const targetName = ctx.params.affiliation;
        const operatorName = ctx.req.user.username;
        const opName = 'orguser_affiliation_del';
        const opSource = ctx.ip;
        const opObject = 'user';
        const opDate = new Date();
        const opDetails = {};
        const result = {};
        opDetails.name = targetName;
        const orgName = operatorName.split('@')[1].split('.')[0];
        const orgDoamin = operatorName.split('@')[1];
        let networkId = await ctx.service.user.getNetworkIdByAdminUser(orgName);
        let caStorePath = '';
        let caDockerStorePath = '';
        let regUser = '';
        let ca = null;
        
        try {
            if (operatorName.split('@')[0] === 'Admin') {
                regUser = 'admin';
            } else {
                const userInfo = await ctx.model.OrgUser.findOne({ username: operatorName, network_id: networkId });
                if (userInfo === null) {
                    const err_message = `user ${operatorName} can not found in db`;
                    result.message = err_message;
                    result.success = false;
                    result.code = 400;
                    await ctx.service.log.deposit(opName, opObject, opSource, operatorName, opDate, 400, opDetails, {}, err_message);
                    return result;
                }
                
                regUser = operatorName;
            }
            opDetails.network_id = networkId;
            caDockerStorePath = '/etc/hyperledger/fabric-ca-server-config/';
            ca = await ctx.service.user.getCaInfoByUser(networkId, orgName);
        } catch (err) {
            const err_message = 'func: delAffiliation. get networkid or caInfo by orgName Failed, err: ' + err;
            console.log(err_message);
            result.message = err_message;
            result.success = false;
            result.code = 400;
            await ctx.service.log.deposit(opName, opObject, opSource, operatorName, opDate, 400, opDetails, {}, err_message);
            return result;
        }
        let res;
        try {
            const caVersion = await ctx.service.user.getCaVersionByNetworkId(networkId);
            if (caVersion === 'ca_v1.4') {
                caStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca/${regUser}`;
            }
            else {
                caStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca/Admin@${orgDoamin}`;
            }
            res = await ctx.delUserAffiliations(regUser, targetName, ca.caHost, ca.caPort, caStorePath, caDockerStorePath, caVersion);
        } catch (e) {
            result.message = e.message;
            result.success = false;
            result.code = 400;
            await ctx.service.log.deposit(opName, opObject, opSource, operatorName, opDate, 400, opDetails, {}, e);
            return result;
        }
        
        await ctx.service.log.deposit(opName, opObject, opSource, operatorName, opDate, 200, opDetails, {}, '');
        return res;
    }
    
    async updateAffiliation(sourceName, targetName) {
        const { ctx, config } = this;
        const operatorName = ctx.req.user.username;
        const opName = 'orguser_affiliation_update';
        const opSource = ctx.ip;
        const opObject = 'user';
        const opDate = new Date();
        const opDetails = {};
        opDetails.sourceName = sourceName;
        opDetails.targetName = targetName;
        const orgName = operatorName.split('@')[1].split('.')[0];
        const orgDoamin = operatorName.split('@')[1];
        let networkId = null;
        let caStorePath = '';
        let caDockerStorePath = '';
        const result = {};
        let ca = null;
        let regUser = '';
        
        try {
            if (operatorName.split('@')[0] === 'Admin') {
                networkId = await ctx.service.user.getNetworkIdByAdminUser(orgName);
                regUser = 'admin';
            } else {  //非组织管理员不允许修改组织结构
                const errorMsg = 'Authorization failure,please contact the administrator.';
                result.message = errorMsg;
                result.success = false;
                result.code = 400;
                await ctx.service.log.deposit(opName, opObject, opSource, operatorName, opDate, 400, opDetails, {}, errorMsg);
                return result;
            }
            opDetails.network_id = networkId;
            caDockerStorePath = '/etc/hyperledger/fabric-ca-server-config/';
            ca = await ctx.service.user.getCaInfoByUser(networkId, orgName);
        } catch (err) {
            const errorMsg = 'func: updateAffiliation. get networkid or caInfo by orgName Failed, err: ' + err;
            console.log(errorMsg);
            result.message = errorMsg;
            result.success = false;
            result.code = 400;
            await ctx.service.log.deposit(opName, opObject, opSource, operatorName, opDate, 400, opDetails, {}, errorMsg);
            return result;
            
        }
        
        let res;
        try {
            const caVersion = await ctx.service.user.getCaVersionByNetworkId(networkId);
            if (caVersion === 'ca_v1.4') {
                caStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca/${regUser}`;
            }
            else {
                caStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca/Admin@${orgDoamin}`;
            }
            res = await ctx.updateUserAffiliation(sourceName, targetName, ca.caHost, ca.caPort, caStorePath, caDockerStorePath, caVersion);
        } catch (e) {
            result.message = e.message;
            result.success = false;
            result.code = 400;
            await ctx.service.log.deposit(opName, opObject, opSource, operatorName, opDate, 400, opDetails, {}, e.message);
            return result;
        }
        
        await ctx.service.log.deposit(opName, opObject, opSource, operatorName, opDate, 200, opDetails, {}, '');
        return res;
    }
    
    async getIdentities(operatorName) {
        const { ctx, config } = this;
        const orgName = operatorName.split('@')[1].split('.')[0];
        const fabric_client = new Fabric_Client();
        const orgDoamin = operatorName.split('@')[1];
        let fabric_ca_client = null;
        let networkId = await ctx.service.user.getNetworkIdByAdminUser(orgName);
        let res = null;
        let store_path = '';
        let store_path_ca = '';
        let regUser = '';
        let ca = null;
        
        try {
            if (operatorName.split('@')[0] === 'Admin') {
                regUser = 'admin';
            } else {
                const userInfo = await ctx.model.OrgUser.findOne({ username: operatorName, network_id: networkId });
                if (userInfo === null) {
                    throw new Error(`\r\n user ${operatorName} can not found in db`);
                }
                
                regUser = operatorName;
            }
            const caVersion = await ctx.service.user.getCaVersionByNetworkId(networkId);
            
            if (caVersion === 'ca_v1.4') {
                store_path = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca/${regUser}`;
            }
            else {
                store_path = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca/Admin@${orgDoamin}`;
            }
            
            store_path_ca = '/etc/hyperledger/fabric-ca-server-config/';
            ca = await ctx.service.user.getCaInfoByUser(networkId, orgName);
        } catch (err) {
            console.log('func: getIdentities. get networkid or caInfo by orgName Failed, err: ' + err);
            throw new Error(err);
        }
        
        await Fabric_Client.newDefaultKeyValueStore({ path: store_path,
        }).then((state_store) => {
            // assign the store to the fabric client
            fabric_client.setStateStore(state_store);
            const crypto_suite = Fabric_Client.newCryptoSuite();
            // use the same location for the state store (where the users' certificate are kept)
            // and the crypto store (where the users' keys are kept)
            const crypto_store = Fabric_Client.newCryptoKeyStore({ path: store_path });
            crypto_suite.setCryptoKeyStore(crypto_store);
            fabric_client.setCryptoSuite(crypto_suite);
            
            const crypto_suite_ca = Fabric_Client.newCryptoSuite();
            const crypto_store_ca = Fabric_Client.newCryptoKeyStore({ path: store_path_ca });
            crypto_suite_ca.setCryptoKeyStore(crypto_store_ca);
            
            const	tlsOptions = {
                trustedRoots: [],
                verify: false,
            };
            // be sure to change the http to https when the CA is running TLS enabled
            fabric_ca_client = new Fabric_CA_Client(`https://${ca.caHost}:${ca.caPort}`, tlsOptions , '', crypto_suite_ca);
            
            
            // first check to see if the admin is already enrolled
            return fabric_client.getUserContext(regUser, true);
        }).then((user_from_store) => {
            if (user_from_store && user_from_store.isEnrolled()) {
                console.log('Successfully loaded admin from persistence');
            } else {
                console.log('Failed to get admin.... run enrollAdmin.js');
                throw new Error('Failed to get admin.... run enrollAdmin.js');
            }
            
            const aff = fabric_ca_client.newIdentityService();
            
            //res = aff.getOne('user3@org1.org1.com', user_from_store);
            res = aff.getAll(user_from_store);
        });
        
        console.log('success opt');
        return res;
    }
    
    async getIdentity(targetName, operatorName) {
        const { ctx, config } = this;
        const orgName = operatorName.split('@')[1].split('.')[0];
        const orgDoamin = operatorName.split('@')[1];
        
        let networkId = await ctx.service.user.getNetworkIdByAdminUser(orgName);
        let caStorePath = '';
        let caDockerStorePath = '';
        let regUser = '';
        let ca = null;
        
        try {
            if (operatorName.split('@')[0] === 'Admin') {
                regUser = 'admin';
            } else {
                const userInfo = await ctx.model.OrgUser.findOne({ username: operatorName, network_id: networkId });
                if (userInfo === null) {
                    throw new Error(`\r\n user ${operatorName} can not found in db`);
                }
                regUser = operatorName;
            }
            ca = await ctx.service.user.getCaInfoByUser(networkId, orgName);
        } catch (err) {
            console.log('func : getIdentity. get networkid or caInfo by orgName Failed, err: ' + err);
            throw new Error(err);
        }
        const caHost = ca.caHost;
        const caPort = ca.caPort;
        const caVersion = await ctx.service.user.getCaVersionByNetworkId(networkId);
        if (caVersion === 'ca_v1.4') {
            caStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca/${regUser}`;
        }
        else {
            caStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca/Admin@${orgDoamin}`;
        }
        caDockerStorePath = '/etc/hyperledger/fabric-ca-server-config/';
        const res = await ctx.getUserIdentity(regUser, targetName, caHost, caPort, caStorePath, caDockerStorePath, caVersion);
        return res;
    }
    /***********************
     *  生成注销证书列表
     *  此方法当前没有被使用    ---2019-05-22
     *  在启用此方法时需要定义所要获取哪个时间段内注销的证书，4个参数可选，revokedBefore，revokedAfter，expireBefore，expireAfter
     * *****************************/
    async generateCRL(request) {
        const { ctx, config } = this;
        const operatorName = ctx.req.user.username;
        const orgName = operatorName.split('@')[1].split('.')[0];
        const orgDoamin = operatorName.split('@')[1];
        
        let networkId = await ctx.service.user.getNetworkIdByAdminUser(orgName);
        let caStorePath = '';
        let caDockerStorePath = '';
        let regUser = '';
        let ca = null;
        
        try {
            if (operatorName.split('@')[0] === 'Admin') {
                regUser = 'admin';
            } else {
                const userInfo = await ctx.model.OrgUser.findOne({ username: operatorName, network_id: networkId });
                if (userInfo === null) {
                    throw new Error(`\r\n user ${operatorName} can not found in db`);
                }
                regUser = operatorName;
            }
            ca = await ctx.service.user.getCaInfoByUser(networkId, orgName);
        } catch (err) {
            console.log('func : getIdentity. get networkid or caInfo by orgName Failed, err: ' + err);
            throw new Error(err);
        }
        const caHost = ca.caHost;
        const caPort = ca.caPort;
        const caVersion = await ctx.service.user.getCaVersionByNetworkId(networkId);
        if (caVersion === 'ca_v1.4') {
            caStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca/${regUser}`;
        }
        else {
            caStorePath = `${config.fabricDir}/${networkId}/crypto-config/peerOrganizations/${orgDoamin}/ca/Admin@${orgDoamin}`;
        }
        caDockerStorePath = '/etc/hyperledger/fabric-ca-server-config/';
        const res = await ctx.generateCRL(regUser, request, caHost, caPort, caStorePath, caDockerStorePath, caVersion);
        return res;
    }
    
    async deleteMongoDatasByNetworkid(blockchain_network_id){
        const { ctx } = this;
        let res = {success:true};
        try{
            await ctx.model.Channel.remove({ blockchain_network_id: blockchain_network_id });
            await ctx.model.OrgUser.remove({ network_id: blockchain_network_id });
            await ctx.model.ServiceEndpoint.remove({ networkid: blockchain_network_id });
            await ctx.model.ChainCode.remove({ blockchain_network_id: blockchain_network_id });
        }catch(err){
            console.log(err);
            res.success = false;
            res.message = err
        }
        return res;
    }
}

module.exports = UserService;
