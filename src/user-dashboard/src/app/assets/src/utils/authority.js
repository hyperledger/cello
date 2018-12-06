/*
 SPDX-License-Identifier: Apache-2.0
*/
// use localStorage to store the authority info, which might be sent from server in actual project.
export function getAuthority() {
  return localStorage.getItem("cello-authority");
}

export function setAuthority(authority) {
  return localStorage.setItem("cello-authority", authority);
}
