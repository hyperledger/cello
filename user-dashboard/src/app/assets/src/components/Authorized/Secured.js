/*
 SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import Exception from '../Exception/index';
import CheckPermissions from './CheckPermissions';

const Exception403 = () => <Exception type="403" style={{ minHeight: 500, height: '80%' }} />;

// Determine whether the incoming component has been instantiated
// AuthorizedRoute is already instantiated
// Authorized  render is already instantiated, children is no instantiated
// Secured is not instantiated
const checkIsInstantiation = target => {
  if (!React.isValidElement(target)) {
    return target;
  }
  return () => target;
};

const authorize = (authority, error) => {
  let classError = false;
  if (error) {
    classError = () => error;
  }
  if (!authority) {
    throw new Error('authority is required');
  }
  return function decideAuthority(targer) {
    const component = CheckPermissions(authority, targer, classError || Exception403);
    return checkIsInstantiation(component);
  };
};

export default authorize;
