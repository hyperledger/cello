/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/
package model


type NodeData struct {
	ID string `json:"id"`
	Type string `json:"type"`
	Name string `json:"name"`
	NetworkType string `json:"network_type"`
	NetworkVersion string `json:"network_version"`
	CreateTime string `json:"created_at"`
	AgentID string `json:"agent_id"`
	NetworkID string `json:"network_id"`
}

type NodeListResponse struct {
	Total int32 `json:"total"`
	Nodes [] NodeData `json:"data"`
}

type NodeSpecInfo struct {
	Name string `yaml:"name"`
	NetworkType string `yaml:"network_type"`
	NetworkVersion string `yaml:"network_version"`
	Type string `yaml:"type"`
	AgentType string `yaml:"agent_type"`
}

type NodeSpec struct {
	Spec NodeSpecInfo `yaml:"spec"`
}
