/*
 SPDX-License-Identifier: Apache-2.0
*/
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  pageHeader: {
    content: {
      id: "API.pageHeader.content",
      defaultMessage: "Contract call"
    }
  },
  button: {
    newParam: {
      id: "API.button.newParam",
      defaultMessage: "New Parameter"
    },
    call: {
      id: "API.button.call",
      defaultMessage: "Call"
    }
  },
  form: {
    label: {
      smartContract: {
        id: "API.form.label.smartContract",
        defaultMessage: "Smart Contract"
      },
      function: {
        id: "API.form.label.function",
        defaultMessage: "Function Name"
      },
      parameter: {
        id: "API.form.label.parameter",
        defaultMessage: "Parameter"
      },
      method: {
        id: "API.form.label.method",
        defaultMessage: "Method"
      }
    },
    validate: {
      required: {
        chainCode: {
          id: "API.form.validate.required.chainCode",
          defaultMessage: "Must select a smart contract"
        },
        parameter: {
          id: "API.form.validate.required.parameter",
          defaultMessage: "Must input parameter"
        },
        function: {
          id: "API.form.validate.required.function",
          defaultMessage: "Must input function name"
        },
        method: {
          id: "API.form.validate.required.method",
          defaultMessage: "Must select a method"
        }
      }
    },
    options: {
      method: {
        invoke: {
          id: "API.form.options.method.invoke",
          defaultMessage: "Invoke"
        },
        query: {
          id: "API.form.options.method.query",
          defaultMessage: "Query"
        }
      }
    },
    info: {
      parameter: {
        id: "API.form.info.parameter",
        defaultMessage: "Use , to separate parameters"
      }
    }
  }
});

export default messages
