/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/
package model

type AgentData struct {
	ID string `json:"id"`
	Name string `json:"name"`
	WorkerAPI string `json:"worker_api"`
	Capacity int32 `json:"capacity"`
	NodeCapacity int32 `json:"node_capacity"`
	Status string `json:"status"`
	CreateTime string `json:"created_at"`
	Type string `json:"type"`
	OrgID string `json:"organization_id"`
}

type AgentListResponse struct {
	Total int32 `json:"total"`
	Agents [] AgentData `json:"data"`
}

type AgentSpecInfo struct {
	Name string `yaml:"name"`
	WorkerApi string `yaml:"worker_api"`
	Capacity int32 `yaml:"capacity"`
	NodeCapacity int32 `yaml:"node_capacity"`
	LogLevel string `yaml:"log_level"`
	Type string `yaml:"type"`
	Schedulable bool `yaml:"schedulable"`
}

type AgentSpec struct {
	Spec AgentSpecInfo `yaml:"spec"`
}

