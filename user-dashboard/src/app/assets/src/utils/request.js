/*
 SPDX-License-Identifier: Apache-2.0
*/
import fetch from "dva/fetch";
import { notification } from "antd";
import { routerRedux } from "dva/router";
import { IntlProvider, defineMessages } from "react-intl";
import store from "../index";
import { getLocale } from "../utils/utils";

const Cookies = require("js-cookie");

const currentLocale = getLocale();
const intlProvider = new IntlProvider(
  { locale: currentLocale.locale, messages: currentLocale.messages },
  {}
);
const { intl } = intlProvider.getChildContext();

const messages = defineMessages({
  requestError: {
    id: "Messages.RequestError",
    defaultMessage: "请求错误",
  },
  httpStatus: {
    code200: {
      id: "Messages.HttpStatus.200",
      defaultMessage: "服务器成功返回请求的数据。",
    },
    code201: {
      id: "Messages.HttpStatus.201",
      defaultMessage: "新建或修改数据成功。",
    },
    code202: {
      id: "Messages.HttpStatus.202",
      defaultMessage: "一个请求已经进入后台排队（异步任务）。",
    },
    code204: {
      id: "Messages.HttpStatus.204",
      defaultMessage: "删除数据成功。",
    },
    code400: {
      id: "Messages.HttpStatus.400",
      defaultMessage: "发出的请求有错误，服务器没有进行新建或修改数据的操作。",
    },
    code401: {
      id: "Messages.HttpStatus.401",
      defaultMessage: "用户没有权限（令牌、用户名、密码错误）。",
    },
    code403: {
      id: "Messages.HttpStatus.403",
      defaultMessage: "用户得到授权，但是访问是被禁止的。",
    },
    code404: {
      id: "Messages.HttpStatus.404",
      defaultMessage: "发出的请求针对的是不存在的记录，服务器没有进行操作。",
    },
    code406: {
      id: "Messages.HttpStatus.406",
      defaultMessage: "请求的格式不可得。",
    },
    code410: {
      id: "Messages.HttpStatus.410",
      defaultMessage: "请求的资源被永久删除，且不会再得到的。",
    },
    code422: {
      id: "Messages.HttpStatus.422",
      defaultMessage: "当创建一个对象时，发生一个验证错误。",
    },
    code500: {
      id: "Messages.HttpStatus.500",
      defaultMessage: "服务器发生错误，请检查服务器。",
    },
    code502: {
      id: "Messages.HttpStatus.502",
      defaultMessage: "网关错误。",
    },
    code503: {
      id: "Messages.HttpStatus.503",
      defaultMessage: "服务不可用，服务器暂时过载或维护。",
    },
    code504: {
      id: "Messages.HttpStatus.504",
      defaultMessage: "网关超时。",
    },
  },
});

const codeMessage = {
  200: intl.formatMessage(messages.httpStatus.code200),
  201: intl.formatMessage(messages.httpStatus.code201),
  202: intl.formatMessage(messages.httpStatus.code202),
  204: intl.formatMessage(messages.httpStatus.code204),
  400: intl.formatMessage(messages.httpStatus.code400),
  401: intl.formatMessage(messages.httpStatus.code401),
  403: intl.formatMessage(messages.httpStatus.code403),
  404: intl.formatMessage(messages.httpStatus.code404),
  406: intl.formatMessage(messages.httpStatus.code406),
  410: intl.formatMessage(messages.httpStatus.code410),
  422: intl.formatMessage(messages.httpStatus.code422),
  500: intl.formatMessage(messages.httpStatus.code500),
  502: intl.formatMessage(messages.httpStatus.code502),
  503: intl.formatMessage(messages.httpStatus.code503),
  504: intl.formatMessage(messages.httpStatus.code504),
};
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const errortext = codeMessage[response.status] || response.statusText;
  notification.error({
    message: `${intl.formatMessage(messages.requestError)} ${
      response.status
    }: ${response.url}`,
    description: errortext,
  });
  if ([400, 500].indexOf(response.status) < 0) {
    const error = new Error(errortext);
    error.name = response.status;
    error.response = response;
    throw error;
  } else {
    return response;
  }
}

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export default function request(url, options) {
  const defaultOptions = {
    credentials: "include",
  };
  const newOptions = { ...defaultOptions, ...options };
  const csrftoken = Cookies.get("csrfToken");
  if (newOptions.method === "POST" || newOptions.method === "PUT") {
    if (!(newOptions.body instanceof FormData)) {
      newOptions.headers = {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
        ...newOptions.headers,
      };
      newOptions.body = JSON.stringify(newOptions.body);
    } else {
      // newOptions.body is FormData
      newOptions.headers = {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
        ...newOptions.headers,
      };
    }
    newOptions.headers = {
      "x-csrf-token": csrftoken,
      ...newOptions.headers,
    };
  } else if (newOptions.method === "DELETE") {
    newOptions.headers = {
      "x-csrf-token": csrftoken,
      ...newOptions.headers,
    };
  }

  return fetch(url, newOptions)
    .then(checkStatus)
    .then(response => {
      if (newOptions.method === "DELETE" || response.status === 204) {
        return response.text();
      }
      return response.json();
    })
    .catch(e => {
      const { dispatch } = store;
      const status = e.name;
      if (status === 401) {
        dispatch({
          type: "login/logout",
        });
        return {
          status,
        };
      }
      if (status === 403) {
        dispatch(routerRedux.push("/exception/403"));
        return;
      }
      if (status <= 504 && status >= 500) {
        dispatch(routerRedux.push("/exception/500"));
        return;
      }
      if (status >= 404 && status < 422) {
        dispatch(routerRedux.push("/exception/404"));
      }
    });
}
