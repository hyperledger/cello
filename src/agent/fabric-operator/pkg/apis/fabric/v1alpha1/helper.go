// NOTE: Boilerplate only.  Ignore this file.

// Package v1alpha1 contains API Schema definitions for the fabric v1alpha1 API group
// +k8s:deepcopy-gen=package,register
// +groupName=fabric.hyperledger.org
package v1alpha1

// +k8s:openapi-gen=true
type NodeSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "operator-sdk generate k8s" to regenerate code after modifying this file
	// Add custom validation using kubebuilder tags: https://book-v1.book.kubebuilder.io/beyond_basics/generating_crd.html
	StorageSize  string        `json:"storageSize"`
	StorageClass string        `json:"storageClass"`
	Image        string        `json:"image"`
	ConfigParams []ConfigParam `json:"configParams"`
}

// +k8s:openapi-gen=true
type ConfigParam struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}
