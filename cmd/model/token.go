/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/
package model

type UserInfo struct {
	ID string `json:"pk"`
	Name string `json:"username"`
	Email string `json:"email"`
}

type TokenResponse struct {
	Token string `json:"token"`
	User UserInfo `json:"user"`
}
