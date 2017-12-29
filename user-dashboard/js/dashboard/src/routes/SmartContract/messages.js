/*
 SPDX-License-Identifier: Apache-2.0
*/
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  status: {
    uploaded: {
      id: "ChainCode.status.uploaded",
      defaultMessage: "Uploaded and not deployed"
    },
    installed: {
      id: "ChainCode.status.installed",
      defaultMessage: "Uploaded and installed"
    },
    instantiated: {
      id: "ChainCode.status.instantiated",
      defaultMessage: "Deployed at {name}"
    },
    instantiating: {
      id: "ChainCode.status.instantiating",
      defaultMessage: "Deploying Smart Contract"
    },
    error: {
      id: "ChainCode.status.error",
      defaultMessage: "Error"
    }
  },
  button: {
    newSmartContract: {
      id: "ChainCode.button.newSmartContract",
      defaultMessage: "Add New Smart Contract"
    },
    install: {
      id: "ChainCode.button.install",
      defaultMessage: "Install"
    },
    instantiate: {
      id: "ChainCode.button.instantiate",
      defaultMessage: "Instantiate"
    },
    delete: {
      id: "ChainCode.button.delete",
      defaultMessage: "Delete"
    }
  },
  tooltip: {
    edit: {
      id: "ChainCode.tooltip.edit",
      defaultMessage: "Edit"
    }
  },
  confirm: {
    deleteChainCode: {
      id: "ChainCode.confirm.deleteChainCode",
      defaultMessage: "Do you want to delete smart contract code {name}?"
    }
  }
});

export default messages
