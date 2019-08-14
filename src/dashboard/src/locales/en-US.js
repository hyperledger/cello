/*
 SPDX-License-Identifier: Apache-2.0
*/
import exception from './en-US/exception';
import globalHeader from './en-US/globalHeader';
import login from './en-US/login';
import menu from './en-US/menu';
import pwa from './en-US/pwa';
import component from './en-US/component';
import operatorOrganization from './en-US/operatorOrganization';
import operatorUser from './en-US/operatorUser';
import form from './en-US/form';
import operatorAgent from './en-US/operatorAgent';
import operatorNode from './en-US/operatorNode';

export default {
  'navBar.lang': 'Languages',
  'layout.user.link.help': 'Help',
  'layout.user.link.privacy': 'Privacy',
  'layout.user.link.terms': 'Terms',
  'app.home.introduce': 'introduce',
  'app.forms.basic.title': 'Basic form',
  'app.forms.basic.description':
    'Form pages are used to collect or verify information to users, and basic forms are common in scenarios where there are fewer data items.',
  ...exception,
  ...globalHeader,
  ...login,
  ...menu,
  ...pwa,
  ...component,
  ...operatorOrganization,
  ...operatorAgent,
  ...operatorUser,
  ...form,
  ...operatorNode,
};
