import React from 'react';
import { extend } from 'umi-request';
import { notification } from 'antd';
import { history } from 'umi';
import { stringify } from 'qs';

const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

/**
 * 异常处理程序
 */
const errorHandler = error => {
  const { response, data } = error;
  const errortext = (
    <>
      {codeMessage[response.status] || response.statusText} <br />
      {data.msg[0]}
    </>
  );
  const { status, url } = response;
  let verifyUserFail = false;

  if (status === 400) {
    const api = url.split('/').pop();

    if (api === 'login') {
      notification.error({
        message: '用户名或密码错误。',
      });
      return;
    }

    if (api === 'token-verify') {
      verifyUserFail = true;
    }
  }

  if (status === 401 || verifyUserFail) {
    notification.error({
      message: '未登录或登录已过期，请重新登录。',
    });

    history.replace({
      pathname: '/user/login',
      search: stringify({
        redirect: window.location.href,
      }),
    });
    return;
  }

  if (status === 409) {
    const api = url.split('/').pop();
    if (api === 'register') {
      notification.error({
        message: '邮箱地址或组织名已存在。',
      });
      return;
    }
  }

  notification.error({
    message: `请求错误 ${status}: ${url}`,
    description: errortext,
  });
  // environment should not be used
  if (status === 403) {
    history.push('/exception/403');
    return;
  }
  if (status <= 504 && status >= 500) {
    history.push('/exception/500');
    return;
  }
  if (status >= 404 && status < 422) {
    history.push('/exception/404');
  }
};

const request = extend({
  errorHandler,
  credentials: 'include',
});

request.interceptors.request.use(async (url, options) => {
  const token = window.localStorage.getItem('cello-token');
  if (url.indexOf('api/v1/login') < 0 && url.indexOf('api/v1/register') < 0 && token) {
    // 如果有token 就走token逻辑
    const headers = {
      Authorization: `JWT ${token}`,
    };

    return {
      url,
      options: { ...options, headers },
    };
  }
  return {
    url,
    options,
  };
});

// 第一个拦截器有可能返回Promise,那么Promise由第二个拦截器处理
request.interceptors.request.use(async (url, options) => {
  const token = localStorage.getItem('cello-token');
  if (url.indexOf('api/v1/login') < 0 && url.indexOf('api/v1/register') < 0 && token) {
    // 如果有token 就走token逻辑
    const headers = {
      Authorization: `JWT ${token}`,
    };
    return {
      url,
      options: { ...options, headers },
    };
  }
  return {
    url,
    options,
  };
});

export default request;
