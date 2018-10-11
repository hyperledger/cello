# Dashboard for User

By default, the user dashboard will listen on port `8081` at the Master Node, and operators can login in with default `admin:pass` credential.

The left panel gives quick link to various functions, including `Chain`, `Invoke`, `Smart Contract`.

| Name | URL | Function |
| --- | --- | --- |
| Login | `/#/user/login` | User Dashboard Login Page |
| Chain | `/#/chain/index` | See a high-level overview on all chains |
| Chain Info | `/#/chain/info/$id` | See special chain info |
| Create New Smart Contract Template | `/#/smart-contract/new` | Create new smart contract template |
| Smart Contract Template List | `/#/smart-contract/index` | See all smart contract template uploaded by user |
| Smart Contract Template Info | `/#/smart-contract/info/$id` | See special smart contract template info |
| Running Smart Contract | `/#/smart-contract/running` | All running smart contract list |
| Invoke & Query | `/#/smart-contract/invoke-query/$id` | Invoke&Query smart contract |

### User Dashboard, Apply & Use Chain

User can login user dashboard, and apply & use chain.

![Login Page](imgs/user-dashboard/login.png)

#### Chain List Page

In this page will display all applied chain by user.

![Chain List Page](imgs/user-dashboard/chain_list.png)

#### Chain Detail Page

In this page will show the basic information for chain, such as (block height, number of channel, number of installed/instantiated chain code, recent block/transaction), operation history.

![Chain Info Page](imgs/user-dashboard/chain_info.png)

#### Smart Contract template list page

In this page will list all uploaded smart contract template by user, and support multi version for smart contract.

![Smart Contract template list page](imgs/user-dashboard/smart_contract_template.png)

#### Smart Contract template detail page

In this page will show the detail of smart contract template, include (multi version, deployed smart contract, deploy operation)

![Smart Contract template info page](imgs/user-dashboard/smart_contract_template_info.png)

#### Smart Contract Operation Page

In this page use can invoke/query smart contracts which has been deployed.

![Smart Contract Operation Page](imgs/user-dashboard/smart_contract_operation.png)

#### Running Smart Contract List Page

In this page will list all deployed smart contract, include (success/failed).

![Running Smart Contract List Page](imgs/user-dashboard/smart_contract_running.png)

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
