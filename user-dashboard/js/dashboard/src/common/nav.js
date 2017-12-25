import BasicLayout from '../layouts/BasicLayout';

import Chain from '../routes/Chain'
import NewChain from '../routes/Chain/New'

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
      }
    ],
  }
];

export function getNavData() {
  return data;
}

export default data;
