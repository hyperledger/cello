/*
 SPDX-License-Identifier: Apache-2.0
*/
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  pageHeader: {
    content: {
      title: {
        createTime: {
        	id: "Chain.Index.PageHeader.Content.Title.createTime",
        	defaultMessage: "Create Time"
        }
      },
      button: {
        changeName: {
        	id: "Chain.Index.PageHeader.Content.Button.changeName",
        	defaultMessage: "Change Name"
        },
        release: {
        	id: "Chain.Index.PageHeader.Content.Button.release",
        	defaultMessage: "Release"
        }
      }
    },
    extra: {
      title: {
        status: {
        	id: "Chain.Index.PageHeader.Extra.Title.status",
        	defaultMessage: "Status"
        },
        type: {
          id: "Chain.Index.PageHeader.Extra.Title.type",
          defaultMessage: "Type"
        },
        running: {
          id: "Chain.Index.PageHeader.Extra.Title.running",
          defaultMessage: "Running Hours"
        }
      },
      content: {
        status: {
          running: {
          	id: "Chain.Index.PageHeader.Extra.Content.status.running",
          	defaultMessage: "Running"
          },
          initializing: {
            id: "Chain.Index.PageHeader.Extra.Content.status.initializing",
            defaultMessage: "Initializing"
          },
          releasing: {
            id: "Chain.Index.PageHeader.Extra.Content.status.releasing",
            defaultMessage: "Releasing"
          },
          error: {
            id: "Chain.Index.PageHeader.Extra.Content.status.error",
            defaultMessage: "Error"
          }
        }
      }
    }
  },
  modal: {
    confirm: {
      release: {
        title: {
          id: "Chain.Index.Modal.Confirm.Title.release",
          defaultMessage: "Do you want to release chain {name}?"
        }
      }
    }
  },
  button: {
    confirm: {
    	id: "Button.Confirm",
    	defaultMessage: "Confirm"
    },
    cancel: {
    	id: "Button.Cancel",
    	defaultMessage: "Cancel"
    }
  }
});

export default messages
