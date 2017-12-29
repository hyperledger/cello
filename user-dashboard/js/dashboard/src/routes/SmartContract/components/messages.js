/*
 SPDX-License-Identifier: Apache-2.0
*/
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  button: {
    submit: {
      id: "Button.Submit",
      defaultMessage: "Submit"
    },
    newParam: {
      id: "API.button.newParam",
      defaultMessage: "New Parameter"
    },
    cancel: {
      id: "Button.Cancel",
      defaultMessage: "Cancel"
    }
  },
  title: {
    id: "Path.ChainNew",
    defaultMessage: "Apply New Chain"
  },
  configuration: {
    basic: {
      title: {
        id: "Chain.New.configuration.basic.title",
        defaultMessage: "{type} - Advance Config"
      },
      content: {
        id: "Chain.New.configuration.basic.content",
        defaultMessage: "Limited time free, suitable for {type} advanced developers"
      }
    },
    advance: {
      title: {
        id: "Chain.New.configuration.advance.title",
        defaultMessage: "{type} - Advance Config"
      },
      content: {
        id: "Chain.New.configuration.advance.content",
        defaultMessage: "Limited time free, suitable for {type} advanced developers"
      }
    }
  },
  form: {
    title: {
      updateChainCode: {
        id: "ChainCode.Edit.form.title",
        defaultMessage: "Update smart contract name"
      },
      installChainCode: {
        id: "ChainCode.modal.title.installChainCode",
        defaultMessage: "Install Smart Contract"
      },
      instantiateChainCode: {
        id: "ChainCode.modal.title.instantiateChainCode",
        defaultMessage: "Deploy Smart Contract"
      }
    },
    label: {
      name: {
        id: "Chain.New.form.label.name",
        defaultMessage: "Name"
      },
      chainType: {
        id: "Chain.New.form.label.chainType",
        defaultMessage: "Chain Type"
      },
      configuration: {
        id: "Chain.New.form.label.configuration",
        defaultMessage: "Configuration"
      }
    },
    validate: {
      name: {
        required: {
          id: "Chain.New.form.validate.name.required",
          defaultMessage: "Must input chain name"
        },
        invalidName: {
          id: "Chain.New.form.validate.name.invalidName",
          defaultMessage: "Please input valid name"
        },
        invalidLength: {
          id: "Chain.New.form.validate.name.invalidLength",
          defaultMessage: "Name max length must be less than 20"
        }
      },
      chain: {
        required: {
          id: "ChainCode.form.validate.chain.required",
          defaultMessage: "Must select a chain"
        },
      },
      chainType: {
        required: {
          id: "Chain.New.form.validate.chainType.required",
          defaultMessage: "Please select a chain type"
        }
      },
      configuration: {
        required: {
          id: "Chain.New.form.validate.configuration.required",
          defaultMessage: "Please select a configuration"
        }
      }
    },
    placeholder: {
      chainType: {
        id: "Chain.New.form.placeholder.chainType",
        defaultMessage: "Please select a chain type"
      }
    }
  }
});

export default messages
