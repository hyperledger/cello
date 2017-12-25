/*
 SPDX-License-Identifier: Apache-2.0
*/
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  title: {
    peer: {
    	id: "Chain.Index.Overview.Title.peer",
    	defaultMessage: "Peer"
    },
    block: {
      id: "Chain.Index.Overview.Title.block",
      defaultMessage: "Block"
    },
    smartContract: {
      id: "Chain.Index.Overview.Title.smartContract",
      defaultMessage: "Smart Contract"
    },
    transaction: {
      id: "Chain.Index.Overview.Title.transaction",
      defaultMessage: "Transaction"
    },
  },
  help: {
    peer: {
      id: "Chain.Index.Overview.Help.peer",
      defaultMessage: "Peer Number of Chain"
    },
    block: {
      id: "Chain.Index.Overview.Help.block",
      defaultMessage: "Block Number of Chain"
    },
    smartContract: {
      id: "Chain.Index.Overview.Help.smartContract",
      defaultMessage: "Smart Contract of Chain"
    },
    transaction: {
      id: "Chain.Index.Overview.Help.transaction",
      defaultMessage: "Transaction of Chain"
    },
  }
});

export default messages
