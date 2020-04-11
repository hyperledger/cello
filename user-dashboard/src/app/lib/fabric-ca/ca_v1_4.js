'use strict';

const Service = require('egg').Service;
const Fabric_Client = require('../../../packages/fabric-1.4/node_modules/fabric-client');
const FabricCAServices = require('../../../packages/fabric-1.4/node_modules/fabric-ca-client');
const { FileSystemWallet, Gateway, X509WalletMixin } = require('../../../packages/fabric-1.4/node_modules/fabric-network');
const path = require('path');
const fs = require('fs');
let adminIdentity = null;

module.exports = app => {
    async function enrollAdmin(caHost, caPort, mspId, caStorePath) {
        try {
            // Create a new CA client for interacting with the CA.
            const ca = new FabricCAServices(`https://${caHost}:${caPort}`);

            // Create a new file system based wallet for managing identities.
            const wallet = new FileSystemWallet(caStorePath);
            console.log(`Wallet path: ${caStorePath}`);

            // Check to see if we've already enrolled the admin user.
            const adminExists = await wallet.exists('admin');
            if (adminExists) {
                console.log('An identity for the admin user "admin" already exists in the wallet');
                return;
            }

            // Enroll the admin user, and import the new identity into the wallet.
            const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
            const identity = await X509WalletMixin.createIdentity(mspId, enrollment.certificate, enrollment.key.toBytes());
            await wallet.import('admin', identity);
            adminIdentity = identity;
            console.log('Successfully enrolled admin user "admin" and imported it into the wallet');

        } catch (error) {
            console.error(`Failed to enroll admin user "admin": ${error}`);
            //process.exit(1);
        }
    }
    async function registerUser(registerUser, caInfo, mspId, name, role, userAffilication, caStorePath, attributes) {
        try {
            const caHost = caInfo.caHost;
            const caPort = caInfo.caPort;

            // Create a new file system based wallet for managing identities.
            const wallet = new FileSystemWallet(caStorePath);
            console.log(`Wallet path: ${caStorePath}`);

            // Check to see if we've already enrolled the user.
            const userExists = await wallet.exists(name);
            if (userExists) {
                console.log(`An identity for the user ${name} already exists in the wallet`);
                return;
            }

            // Check to see if we've already enrolled the admin user.
            const registerExists = await wallet.exists(registerUser);
            if (!registerExists) {
                console.log(`An identity for the admin user ${registerUser} does not exist in the wallet`);
                console.log('Run the enrollAdmin.js application before retrying');
                return;
            }

            const ccp = await generateCCP(mspId, caInfo, '1.0.0');
            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: registerUser, discovery: { enabled: false } });

            // Get the CA client object from the gateway for interacting with the CA.
            let ca = new FabricCAServices(`https://${caHost}:${caPort}`);
            const registerIdentity = gateway.getCurrentIdentity();
            
            console.log('ca', ca);
            console.log('admin', registerIdentity);
            
            // Register the user, enroll the user, and import the new identity into the wallet.
            const secret = await ca.register({ enrollmentID: name, affiliation: userAffilication, role, maxEnrollments: -1, attrs: attributes }, registerIdentity);
            const enrollment = await ca.enroll({ enrollmentID: name, enrollmentSecret: secret });
            const userIdentity = await X509WalletMixin.createIdentity(mspId, enrollment.certificate, enrollment.key.toBytes());

            await wallet.import(name, userIdentity);
            console.log(`Successfully registered and enrolled admin user ${name} and imported it into the wallet`);

            return true;
        } catch (error) {
            console.error(`Failed to register user ${name}: ${error}`);
            //process.exit(1);
            return false;
        }
    }

    async function generateCCP(mspId, caInfo, version) {
        const ccp = {};
        const peers = [];
        const peersUrl = [];
        const caServer = [];
        const orgName = caInfo.orgName;
        const networkName = caInfo.network.name;
    
        for (const item in caInfo.response.service_endpoints) {
            if (caInfo.response.service_endpoints[item].service_type === 'peer') {
                const caOrg = caInfo.response.service_endpoints[item].service_name.split('.').slice(0)[1];
                if (caOrg === orgName) {
                    peers.push(caInfo.response.service_endpoints[item].service_name);
                    peersUrl.push(`grpcs://${caInfo.response.service_endpoints[item].service_ip}:${caInfo.response.service_endpoints[item].service_port}`);
                }
            }
            else if (caInfo.response.service_endpoints[item].service_type === 'ca') {
                const caOrg = caInfo.response.service_endpoints[item].service_name.split('.').slice(0)[1];
                if (caOrg === orgName) {
                    caServer.push(caInfo.response.service_endpoints[item].service_name);
                }
            }
        }
        ccp.name = networkName;
        ccp.client = {
            organization: orgName,
            connection: {
                timeout: {
                    peer: {
                        endorser: '300'
                    },
                    orderer: '300'
                }
            }
        };
        ccp.organizations = {};
        ccp.organizations[`${orgName}`] = {
            mspid: mspId,
            peers: peers,
            certificateAuthorities: caServer
        };
        
        ccp.peers = {};
        for (let i = 0;i < peers.length;i++) {
            ccp.peers[`${peers[i]}`] = {};
            ccp.peers[`${peers[i]}`].url = peersUrl[i];
        }
        
        ccp.version = version;
        ccp.certificateAuthorities = {};
        ccp.certificateAuthorities[`${caServer[0]}`] = {};
        ccp.certificateAuthorities[`${caServer[0]}`].url = `https://${caInfo.caHost}:${caInfo.caPort}`;
        ccp.certificateAuthorities[`${caServer[0]}`].caName = `ca-${orgName}`;
        
        return ccp;
    }

  async function deleteUser(registerUser, name, reason, caHost, caPort, caStorePath, caDockerStorePath) {
    const fabric_client = new Fabric_Client();
    let fabric_ca_client = null;
    let admin_user = null;
    let result = false;
    const reasons = [
      'unspecified',
      'keycompromise',
      'cacompromise',
      'affiliationchange',
      'superseded',
      'cessationofoperation',
      'certificatehold',
      'removefromcrl',
      'privilegewithdrawn',
      'aacompromise',
    ];
    let reasonNum;
    for (const each in reasons) {
      if (reason === reasons[each]) {
        reasonNum = each;
        break;
      }
    }
    // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
    await Fabric_Client.newDefaultKeyValueStore({ path: caStorePath }).then(state_store => {
      // assign the store to the fabric client
      fabric_client.setStateStore(state_store);
      const crypto_suite = Fabric_Client.newCryptoSuite();
      // use the same location for the state store (where the users' certificate are kept)
      // and the crypto store (where the users' keys are kept)
      const crypto_store = Fabric_Client.newCryptoKeyStore({ path: caStorePath });
      crypto_suite.setCryptoKeyStore(crypto_store);

      const ca_crypto_suite = Fabric_Client.newCryptoSuite();
      // use the same location for the state store (where the users' certificate are kept)
      // and the crypto store (where the users' keys are kept)
      const ca_crypto_store = Fabric_Client.newCryptoKeyStore({ path: caDockerStorePath });
      ca_crypto_suite.setCryptoKeyStore(ca_crypto_store);

      fabric_client.setCryptoSuite(crypto_suite);
      // be sure to change the http to https when the CA is running TLS enabled
      fabric_ca_client = new FabricCAServices(`https://${caHost}:${caPort}`, null, '', ca_crypto_suite);

      // first check to see if the admin is already enrolled
      return fabric_client.getUserContext(registerUser, true);
    }).then(user_from_store => {
      if (user_from_store && user_from_store.isEnrolled()) {
        console.log('Successfully loaded ' + registerUser + ' from persistence');
        admin_user = user_from_store;
      } else {
        throw new Error('Failed to get admin.... run enrollAdmin.js');
      }

      // at this point we should have the admin user
      // first need to revoke the user with the CA server
      return fabric_ca_client.revoke({ enrollmentID: name, resaon: reasonNum }, admin_user);
    })
      .then(results => {
        if (results.success) {
          console.log('Successfully revoked identity ' + name);
          result = true;
        } else {
          console.log('failed to  revoked identity ' + name);
          result = false;
        }
      })
      .catch(err => {
        console.log('failed to revoke ,err: ' + err);
        result = false;
      });

    return result;
  }

  async function getUserIdentity(registerUser, targetName, caHost, caPort, caStorePath, caDockerStorePath) {
    const fabric_client = new Fabric_Client();
    let fabric_ca_client = null;
    let res = null;

    await Fabric_Client.newDefaultKeyValueStore({ path: caStorePath,
    }).then((state_store) => {
      // assign the store to the fabric client
      fabric_client.setStateStore(state_store);
      const crypto_suite = Fabric_Client.newCryptoSuite();
      // use the same location for the state store (where the users' certificate are kept)
      // and the crypto store (where the users' keys are kept)
      const crypto_store = Fabric_Client.newCryptoKeyStore({ path: caStorePath });
      crypto_suite.setCryptoKeyStore(crypto_store);
      fabric_client.setCryptoSuite(crypto_suite);

      const crypto_suite_ca = Fabric_Client.newCryptoSuite();
      const crypto_store_ca = Fabric_Client.newCryptoKeyStore({ path: caDockerStorePath });
      crypto_suite_ca.setCryptoKeyStore(crypto_store_ca);

      const	tlsOptions = {
        trustedRoots: [],
        verify: false,
      };
      // be sure to change the http to https when the CA is running TLS enabled
      fabric_ca_client = new FabricCAServices(`https://${caHost}:${caPort}`, tlsOptions, '', crypto_suite_ca);


      // first check to see if the admin is already enrolled
      return fabric_client.getUserContext(registerUser, true);
    }).then((user_from_store) => {
      if (user_from_store && user_from_store.isEnrolled()) {
        console.log('Successfully loaded admin from persistence');
      } else {
        console.log('Failed to get ' + registerUser + ' run enrollAdmin.js');
        throw new Error('Failed to get admin.... run enrollAdmin.js');
      }

      const aff = fabric_ca_client.newIdentityService();

      res = aff.getOne(targetName, user_from_store);
    });

    console.log('success opt');
    return res;
  }

  async function reenrollUser(registerUser, name, mspId, caHost, caPort, caStorePath, caDockerStorePath) {
    let fabric_ca_client = null;
    const fabric_client = new Fabric_Client();
    let admin_user = null;
    let member_user = null;
    const result = { success: true };

    // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
    await Fabric_Client.newDefaultKeyValueStore({ path: caStorePath }).then(state_store => {
      // assign the store to the fabric client
      fabric_client.setStateStore(state_store);
      const crypto_suite = Fabric_Client.newCryptoSuite();
      // use the same location for the state store (where the users' certificate are kept)
      // and the crypto store (where the users' keys are kept)
      const crypto_store = Fabric_Client.newCryptoKeyStore({ path: caStorePath });
      crypto_suite.setCryptoKeyStore(crypto_store);
      const ca_crypto_suite = Fabric_Client.newCryptoSuite();
      // use the same location for the state store (where the users' certificate are kept)
      // and the crypto store (where the users' keys are kept)
      const ca_crypto_store = Fabric_Client.newCryptoKeyStore({ path: caDockerStorePath });
      ca_crypto_suite.setCryptoKeyStore(ca_crypto_store);
      fabric_client.setCryptoSuite(crypto_suite);
      // be sure to change the http to https when the CA is running TLS enabled
      fabric_ca_client = new FabricCAServices(`https://${caHost}:${caPort}`, null, '', ca_crypto_suite);

      // first check to see if the admin is already enrolled
      return fabric_client.getUserContext(registerUser, true);
    }).then(user_from_store => {
      if (user_from_store && user_from_store.isEnrolled()) {
        console.log('Successfully loaded ' + registerUser + ' from persistence');
        admin_user = user_from_store;
      } else {
        throw new Error('Failed to get ' + registerUser + '.... run enrollAdmin.js');
      }
      return fabric_ca_client.reenroll(admin_user);
    }).
    then(enrollment => {
      console.log('Successfully enrolled member user ');

      return fabric_client.createUser(
        {
          username: name,
          mspid: mspId,
          cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate },
        }
      );
    })
      .then(user => {
        member_user = user;
        return fabric_client.setUserContext(member_user);
      })
      .then(() => {
        console.log('User was successfully registered and enrolled and is ready to interact with the fabric network');
      })
      .catch(err => {
        console.error('Failed to register: ' + err);
        if (err.toString().indexOf('Authorization') > -1) {
          console.error('Authorization failures may be caused by having admin credentials from a previous CA instance.\n' +
            'Try again after deleting the contents of the store directory ');
        }
        result.success = false;
      });
    return result;
  }

  async function createUserAffiliation(registerUser, targetName, caHost, caPort, caStorePath, caDockerStorePath) {
    let fabric_ca_client = null;
    const fabric_client = new Fabric_Client();
    let res = { success: false };

    await Fabric_Client.newDefaultKeyValueStore({ path: caStorePath }).then((state_store) => {
      // assign the store to the fabric client
      fabric_client.setStateStore(state_store);
      const crypto_suite = Fabric_Client.newCryptoSuite();
      // use the same location for the state store (where the users' certificate are kept)
      // and the crypto store (where the users' keys are kept)
      const crypto_store = Fabric_Client.newCryptoKeyStore({ path: caStorePath });
      crypto_suite.setCryptoKeyStore(crypto_store);
      fabric_client.setCryptoSuite(crypto_suite);

      const crypto_suite_ca = Fabric_Client.newCryptoSuite();
      const crypto_store_ca = Fabric_Client.newCryptoKeyStore({ path: caDockerStorePath });
      crypto_suite_ca.setCryptoKeyStore(crypto_store_ca);

      const	tlsOptions = {
        trustedRoots: [],
        verify: false,
      };
      // be sure to change the http to https when the CA is running TLS enabled
      fabric_ca_client = new FabricCAServices(`https://${caHost}:${caPort}`, tlsOptions, '', crypto_suite_ca);

      // first check to see if the admin is already enrolled
      return fabric_client.getUserContext(registerUser, true);
    }).then((user_from_store) => {
      if (user_from_store && user_from_store.isEnrolled()) {
        console.log(`Successfully loaded ${registerUser} from persistence`);
      } else {
        console.log(`Failed to get ${registerUser}`);
        throw new Error(`Failed to get ${registerUser}`);
      }

      const req = {
        name: targetName,
        caname: '',
        force: true,
      };

      const aff = fabric_ca_client.newAffiliationService();
      res = aff.create(req, user_from_store);
      res.success = true;
    }).catch(err => {
      console.error('Failed to create affiliation: ' + err);
      res.success = false;
    });

    console.log('success opt');
    return res;
  }


  async function getUserAffiliations(registerUser, caHost, caPort, caStorePath, caDockerStorePath) {
    let fabric_ca_client = null;
    const fabric_client = new Fabric_Client();
    const res = {};
    let userCtx = null;
    let Affs = null;
    let IdentityInfor = null;

    await Fabric_Client.newDefaultKeyValueStore({ path: caStorePath }).then((state_store) => {
      // assign the store to the fabric client
      fabric_client.setStateStore(state_store);
      const crypto_suite = Fabric_Client.newCryptoSuite();
      // use the same location for the state store (where the users' certificate are kept)
      // and the crypto store (where the users' keys are kept)
      const crypto_store = Fabric_Client.newCryptoKeyStore({ path: caStorePath });
      crypto_suite.setCryptoKeyStore(crypto_store);
      fabric_client.setCryptoSuite(crypto_suite);

      const crypto_suite_ca = Fabric_Client.newCryptoSuite();
      const crypto_store_ca = Fabric_Client.newCryptoKeyStore({ path: caDockerStorePath });
      crypto_suite_ca.setCryptoKeyStore(crypto_store_ca);

      const	tlsOptions = {
        trustedRoots: [],
        verify: false,
      };
      // be sure to change the http to https when the CA is running TLS enabled
      fabric_ca_client = new FabricCAServices(`https://${caHost}:${caPort}`, tlsOptions, '', crypto_suite_ca);

      // first check to see if the admin is already enrolled
      return fabric_client.getUserContext(registerUser, true);
    }).then((user_from_store) => {
      if (user_from_store && user_from_store.isEnrolled()) {
        console.log('Successfully loaded admin from persistence');
      } else {
        console.log('Failed to get admin.... run enrollAdmin.js');
        throw new Error('Failed to get admin.... run enrollAdmin.js');
      }

      userCtx = user_from_store;
      const aff = fabric_ca_client.newAffiliationService();
      return aff.getAll(userCtx);

    }).
      then((AllAffs) => {
        Affs = AllAffs;
        const identity = fabric_ca_client.newIdentityService();
        return identity.getOne(registerUser, userCtx);
      }).then((identity) => {
        IdentityInfor = identity;
      }).catch(err => {
        console.error('Failed to get affiliation: ' + err);
        res.success = false;
      });

    const AffsArray = [];
    getAffFromRes(Affs.result, AffsArray);

    const Res = [];

    for (const Aff in AffsArray) {
      if (AffsArray[Aff].indexOf(IdentityInfor.result.affiliation) !== -1) {
        Res.push(AffsArray[Aff]);
      }
    }
    console.log('success opt');
    return {
      affiliation: Res,
      success: true,
    };
  }

  async function getAffFromRes(Affs, AffsArray) {
    if (typeof (Affs.name) !== 'undefined') {
      AffsArray.push(Affs.name);
      if (typeof (Affs.affiliations) !== 'undefined') {
        for (let index = 0; index < Affs.affiliations.length; index++) {
          getAffFromRes(Affs.affiliations[index], AffsArray);
        }
      }
    }
  }

  async function delUserAffiliations(registerUser, targetName, caHost, caPort, caStorePath, caDockerStorePath) {
    const fabric_client = new Fabric_Client();
    let fabric_ca_client = null;
    let res = null;
    await Fabric_Client.newDefaultKeyValueStore({ path: caStorePath }).then((state_store) => {
      // assign the store to the fabric client
      fabric_client.setStateStore(state_store);
      const crypto_suite = Fabric_Client.newCryptoSuite();
      // use the same location for the state store (where the users' certificate are kept)
      // and the crypto store (where the users' keys are kept)
      const crypto_store = Fabric_Client.newCryptoKeyStore({path: caStorePath});
      crypto_suite.setCryptoKeyStore(crypto_store);
      fabric_client.setCryptoSuite(crypto_suite);

      const crypto_suite_ca = Fabric_Client.newCryptoSuite();
      const crypto_store_ca = Fabric_Client.newCryptoKeyStore({path: caDockerStorePath});
      crypto_suite_ca.setCryptoKeyStore(crypto_store_ca);

      const	tlsOptions = {
        trustedRoots: [],
        verify: false,
      };
      // be sure to change the http to https when the CA is running TLS enabled
      fabric_ca_client = new FabricCAServices(`https://${caHost}:${caPort}`, tlsOptions, '', crypto_suite_ca);

      // first check to see if the admin is already enrolled
      return fabric_client.getUserContext(registerUser, true);
    }).then((user_from_store) => {
      if (user_from_store && user_from_store.isEnrolled()) {
        console.log(`Successfully loaded ${registerUser} from persistence`);
      } else {
        console.log(`Failed to get ${registerUser}`);
        throw new Error(`Failed to get ${registerUser}`);
      }

      const req = {
        name: targetName,
        caname: '',
        force: true,
      };

      const aff = fabric_ca_client.newAffiliationService();
      // res = aff.getAll(user_from_store);
      res = aff.delete(req, user_from_store);
      // at this point we should have the admin user
      // first need to register the user with the CA server
    }).catch(err => {
      console.error('Failed to delete affiliation: ' + err);
      res.success = false;
    });

    console.log('success opt');
    res.success = true;
    return res;
  }

  async function updateUserAffiliation(sourceName, targetName, caHost, caPort, caStorePath, caDockerStorePath) {
    const fabric_client = new Fabric_Client();
    let fabric_ca_client = null;
    let res;
    const registerUser = 'admin';
    await Fabric_Client.newDefaultKeyValueStore({ path: caStorePath }).then((state_store) => {
      // assign the store to the fabric client
      fabric_client.setStateStore(state_store);
      const crypto_suite = Fabric_Client.newCryptoSuite();
      // use the same location for the state store (where the users' certificate are kept)
      // and the crypto store (where the users' keys are kept)
      const crypto_store = Fabric_Client.newCryptoKeyStore({path: caStorePath});
      crypto_suite.setCryptoKeyStore(crypto_store);
      fabric_client.setCryptoSuite(crypto_suite);

      const crypto_suite_ca = Fabric_Client.newCryptoSuite();
      const crypto_store_ca = Fabric_Client.newCryptoKeyStore({path: caDockerStorePath});
      crypto_suite_ca.setCryptoKeyStore(crypto_store_ca);

      const	tlsOptions = {
        trustedRoots: [],
        verify: false,
      };
      // be sure to change the http to https when the CA is running TLS enabled
      fabric_ca_client = new FabricCAServices(`https://${caHost}:${caPort}`, tlsOptions, '', crypto_suite_ca);

      // first check to see if the admin is already enrolled
      return fabric_client.getUserContext(registerUser, true);
    }).then((user_from_store) => {
      if (user_from_store && user_from_store.isEnrolled()) {
        console.log(`Successfully loaded ${registerUser} from persistence`);
      } else {
        console.log(`Failed to get ${registerUser}`);
        throw new Error(`Failed to get ${registerUser}`);
      }

      const req = {
        name: targetName,
        caname: '',
        force: true,
      };

      const aff = fabric_ca_client.newAffiliationService();

      res = aff.update(sourceName, req, user_from_store);
      // at this point we should have the admin user
      // first need to register the user with the CA server
    }).catch(err => {
      console.error('Failed to update affiliation: ' + err);
      res.success = false;
    });

    console.log('success opt');
    res.success = true;
    return res;
  }
    
    async function generateCRL(registerUser, request, caHost, caPort, caStorePath, caDockerStorePath) {
        const fabric_client = new Fabric_Client();
        let fabric_ca_client = null;
        let res = null;
        
        await Fabric_Client.newDefaultKeyValueStore({ path: caStorePath,
        }).then((state_store) => {
            // assign the store to the fabric client
            fabric_client.setStateStore(state_store);
            const crypto_suite = Fabric_Client.newCryptoSuite();
            // use the same location for the state store (where the users' certificate are kept)
            // and the crypto store (where the users' keys are kept)
            const crypto_store = Fabric_Client.newCryptoKeyStore({ path: caStorePath });
            crypto_suite.setCryptoKeyStore(crypto_store);
            fabric_client.setCryptoSuite(crypto_suite);
            
            const crypto_suite_ca = Fabric_Client.newCryptoSuite();
            const crypto_store_ca = Fabric_Client.newCryptoKeyStore({ path: caDockerStorePath });
            crypto_suite_ca.setCryptoKeyStore(crypto_store_ca);
            
            const	tlsOptions = {
                trustedRoots: [],
                verify: false,
            };
            // be sure to change the http to https when the CA is running TLS enabled
            fabric_ca_client = new FabricCAServices(`https://${caHost}:${caPort}`, tlsOptions, '', crypto_suite_ca);
            
            
            // first check to see if the admin is already enrolled
            return fabric_client.getUserContext(registerUser, true);
        }).then((user_from_store) => {
            if (user_from_store && user_from_store.isEnrolled()) {
                console.log('Successfully loaded admin from persistence');
            } else {
                console.log('Failed to get ' + registerUser + ' run enrollAdmin.js');
                throw new Error('Failed to get admin.... run enrollAdmin.js');
            }
            
            res = fabric_ca_client.generateCRL(request, user_from_store);
        });
        
        console.log('success opt');
        return res;
    }

  app.enrollAdminV1_4 = enrollAdmin;
  app.registerUserV1_4 = registerUser;
  app.deleteUserV1_4 = deleteUser;
  app.getUserIdentityV1_4 = getUserIdentity;
  app.reenrollUserV1_4 = reenrollUser;
  app.createUserAffiliationV1_4 = createUserAffiliation;
  app.getUserAffiliationsV1_4 = getUserAffiliations;
  app.delUserAffiliationsV1_4 = delUserAffiliations;
  app.updateUserAffiliationV1_4 = updateUserAffiliation;
  app.generateCRLV1_4 = generateCRL;
}
