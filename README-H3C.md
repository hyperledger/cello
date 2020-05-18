Cello release-0.9.0-h3c branch is a special branch of hyperledger / Cello, which is provided by H3C Technology Co., Ltd. for open source sharing.

The code of this branch was initially synchronized from Cello by H3C Technology Co., Ltd., and commercial development was carried out, the interface was improved, and some special functions were provided, such as flexible setting of organization maturity and number of organization nodes in the network, flexible expansion of the network, flexible expansion of channels, the users of user-dashboard of in different organizations can only see the information in the organizationConsensus protocol can be selected, CouchDB and leveldb can be selected, chain code language can be selected, etc.

The compilation process of cello release-0.9.0-h3c branch is not too different from that of other branches of cello. You can directly use make docker to complete the compilation. However, the use of the interface is quite different, mainly as follows:

1．When creating a host, please note:

a)     If the docker mode is selected for the host type, the docker daemons need to be started on the worker node. If the worker node and the master node are on the same host, the script to be used is: 

docker run -d -v /var/run/docker.sock:/var/run/docker.sock -p 0.0.0.0:2375:2375 bobrik/socat TCP-LISTEN:2375,fork UNIX-CONNECT:/var/run/docker.sock

If the worker node and the master node are not on the same host, the script to be used is 

dockerd -H tcp://0.0.0.0:2375 -H unix:///var/run/docker.sock --api-cors-header='*' --default-ulimit=nofile=8192:16384 --default-ulimit=nproc=8192:16384 -D &. 

At the same time, you need to use the setup.sh script in the scripts/worke -node/directory to start the NFS service.If kubernetes is selected as the host type, you need to paste the configuration file or private key certificate of k8s host into the corresponding input box.

b)     To ensure that all nodes of kubernetes and the hosts of all dockers have NFS common installed, and that the clocks between the mater, the worker and all worker hosts are consistent.

2．When creating an organization, you should pay attention to:

a)     The organization type is either the peer type or the orderer type. For the peer type, you need to enter the number of peer nodes. For the orderer type, you need to enter the name prefix of each orderer node. The names are separated by carriage returns.

b)     The number of peers in a peer type organization can be expanded, and the number of orderers cannot be expanded.

c)      When creating a peer and orderer, you need to select a host. If multiple hosts are used, you need to set the nameserver in /etc/resolv.conf or the hostname mapping in /etc/hosts to help you find the domain name information.

3．When creating a network, you should pay attention to:

a)     If the host of the orderer node selected a docker type host, only the consensus type of solo mode can be supported.For the selection of database, if the leveldb type is selected, the chain code finally used cannot support the rich query function of CouchDB.

b)     In the current implementation, in order to ensure stability, each organization can only join one network.

c)      For the network expansion function, only the peer type organization and node expansion have been done at present. For the orderer type organization, the fabric can only add one node at a time by default, which is too cumbersome to use. Here, it is cropped, but the implementation code remains, which can be improved later.

d)     Theoretically, the organization expansion function needs to collect the signatures of all orderer organizations, but we think that the administrator of operator dashboard has super authority, so we directly help them to do proxy signature processing.

4．When you log in to the user dashboard, you need to pay attention to:

a)     If you need to use the user ID for the first login, you can copy the complete user name from the user management interface of operator dashboard (note that the content before and after @ needs to be copied) for login. The default password is 666666, which can be modified after login.You can also modify it directly from the operator dashboard.

b)     When a user logs in to the user dashboard, the first field after the @ of the user name represents the organization information for login. After login, the organization of the user is determined, and only the effective content in the organization can be seen in the subsequent operation process.

5. attention shall be paid to channel management:

a)     Channel expansion and exit channel functions can only be completed by collecting more than half of the organization signatures. This process needs to exit the currently logged in organization users and log in and sign with the administrator users of other organizations.

b)     The invoke and query functions and upgrade functions of chain code are placed in the instantiation chain code list column under the channel details page instead of chain code management, because these functions are related to the channel.

6. attention shall be paid to chain code management:

a)     When importing the chain code, you need to package the folder where the chain code is in into ZIP format and calculate the MD5 value.

b)     When instantiating a chain code, you need to set an endorsement policy. For the case of selecting a custom policy, you can select or method first, then copy the policy information in the input box, then select custom, and then modify the policy rules to avoid setting mistakes.

c)      In the chain code management page, each chain code is followed by the delete function option, but once the chain code is installed, it cannot be deleted.

7.The operator-dashboard's url is http://ip:8071. And the User-dashboard's url is http://ip:8081.

 
