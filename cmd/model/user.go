/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/
package model

type UserData struct {
	ID string `json:"id"`
	Username string `json:"username"`
	Role string `json:"role"`
}

type UserListResponse struct {
	Total int32 `json:"total"`
	Users [] UserData `json:"data"`
}

type UserSpecInfo struct {
	Username string `yaml:"username"`
	Password string `yaml:"password"`
	Role string `yaml:"role"`
	Email string `yaml:"email"`
	Organization string `yaml:"organization"`
}

type UserSpec struct {
	Spec UserSpecInfo `yaml:"spec"`
}
