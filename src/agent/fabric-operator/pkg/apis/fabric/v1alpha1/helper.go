// NOTE: Boilerplate only.  Ignore this file.

// Package v1alpha1 contains API Schema definitions for the fabric v1alpha1 API group
// +k8s:deepcopy-gen=package,register
// +groupName=fabric.hyperledger.org
package v1alpha1

import (
	corev1 "k8s.io/api/core/v1"
)

// +k8s:openapi-gen=true
type NodeSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "operator-sdk generate k8s" to regenerate code after modifying this file
	// Add custom validation using kubebuilder tags: https://book-v1.book.kubebuilder.io/beyond_basics/generating_crd.html
	Image        string                      `json:"image"`
	ConfigParams []ConfigParam               `json:"configParams"`
	Hosts        []string                    `json:"hosts,omitempty"`
	Resources    corev1.ResourceRequirements `json:"resources,omitempty"`
	StorageClass string                      `json:"storageClass,omitempty"`
	StorageSize  string                      `json:"storageSize,omitempty"`
}

// NodeStatus defines the observed state of CA
// +k8s:openapi-gen=true
type NodeStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "operator-sdk generate k8s" to regenerate code after modifying this file
	// Add custom validation using kubebuilder tags: https://book-v1.book.kubebuilder.io/beyond_basics/generating_crd.html
	AccessPoint string `json:"accessPoint"`
}

// +k8s:openapi-gen=true
type ConfigParam struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}
