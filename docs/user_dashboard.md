# User Dashboard

By default, the user dashboard will listen on port `8081` at the Master Node, and operators can login in with default `admin:pass` credential.

The left panel gives quick link to various functions, including `Chain`, `Invoke`, `Smart Contract`.

| Name | URL | Function |
| --- | --- | --- |
| Chain | `/dashboard#/chain` | See a high-level overview on all fabric chains |
| Invoke | `/dashboard#/api` | Invoke&Query smart contract api |
| Smart Contract | `/dashboard#/smart_contract` | Manage&Upload all smart contract |

## Chain

![User Dashboard Overview](imgs/user-dashboard/overview.png)

The default overview page show chains user applied, and the status of chain, include (peer/block/smart contract/transaction), and can query recent block/transaction info.

## Smart Contract

![User Dashboard smart contract](imgs/user-dashboard/smart_contract.png)

User can upload, install, instantiate, delete smart contract here.

## Invoke

![User Dashboard Invoke](imgs/user-dashboard/invoke_query.png)

In Invoke page, you can invoke/query smart contract api, and get the response from api.

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
