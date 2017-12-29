import BasicLayout from '../layouts/BasicLayout';

import Chain from '../routes/Chain'
import NewChain from '../routes/Chain/New'
import Api from '../routes/Api'
import SmartContract from '../routes/SmartContract'

const data = [
  {
    component: BasicLayout,
    layout: 'BasicLayout',
    name: 'Home', // for breadcrumb
    path: '',
    children: [
      {
        name: 'Chain',
        messageId: "Chain",
        icon: 'link',
        path: 'chain',
        component: Chain,
      },
      {
        messageId: "ChainNew",
        path: 'chain/new',
        component: NewChain
      },
      {
        name: 'API',
        messageId: "API",
        icon: 'api',
        path: 'api',
        component: Api
      },
      {
        name: 'Smart Contract',
        messageId: "SmartContract",
        icon: 'copy',
        path: 'smart_contract',
        component: SmartContract
      }
    ],
  }
];

export function getNavData() {
  return data;
}

export default data;
