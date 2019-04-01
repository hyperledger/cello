/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/
package model


type OrganizationData struct {
	ID string `json:"id"`
	Name string `json:"name"`
	CreateTime string `json:"created_at"`
}

type OrganizationListResponse struct {
	Total int32 `json:"total"`
	Organizations [] OrganizationData `json:"data"`
}

type OrganizationSpecInfo struct {
	Name string `yaml:"name"`
}

type OrganizationSpec struct {
	Spec OrganizationSpecInfo `yaml:"spec"`
}
