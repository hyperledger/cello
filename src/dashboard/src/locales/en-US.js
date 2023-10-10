/*
 SPDX-License-Identifier: Apache-2.0
*/
import exception from './en-US/exception';
import globalHeader from './en-US/globalHeader';
import login from './en-US/login';
import menu from './en-US/menu';
import pwa from './en-US/pwa';
import component from './en-US/component';
import Organization from './en-US/Organization';
import User from './en-US/operatorUser';
import form from './en-US/form';
import Agent from './en-US/Agent';
import Node from './en-US/Node';
import fabricCa from './en-US/fabric/ca';
import Network from './en-US/Network';
import Channel from './en-US/Channel';
import ChainCode from './en-US/Chaincode';

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
  ...Organization,
  ...Agent,
  ...User,
  ...form,
  ...Node,
  ...fabricCa,
  ...Network,
  ...Channel,
  ...ChainCode,
};
