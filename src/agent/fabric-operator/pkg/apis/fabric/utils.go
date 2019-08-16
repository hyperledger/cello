// Copyright 2019 IBM Corp.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package fabric

import (
	"context"
	"io/ioutil"
	"os"
	"path/filepath"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes/scheme"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
	logf "sigs.k8s.io/controller-runtime/pkg/runtime/log"
)

var (
	// TemplateRoot is the root directory where all needed templates live
	TemplateRootDir = "/usr/local/bin/templates/"
	ScriptRoodDir   = "/usr/local/bin/scripts"
)

var log = logf.Log.WithName("fabric_util")

func GetObjectFromTemplate(templateName string) (runtime.Object, *schema.GroupVersionKind, error) {
	template, _ := ioutil.ReadFile(TemplateRootDir + templateName)
	decode := scheme.Codecs.UniversalDeserializer().Decode

	return decode(template, nil, nil)
}

func GetDefault(p interface{}, v interface{}) interface{} {
	switch p.(type) {
	case string:
		if p == "" {
			return v
		} else {
			return p
		}
	case int, int8, int16, int32, int64, uint, uint8, uint16,
		uint32, uint64, float32, float64:
		if p == 0 {
			return v
		} else {
			return p
		}
	case nil:
		return v
	}
	return p
}

func CheckAndCreateConfigMap(client client.Client, request reconcile.Request) error {
	configmap := &corev1.ConfigMap{}
	err := client.Get(context.TODO(),
		types.NamespacedName{Name: "fabric-configuration-toolset", Namespace: request.Namespace},
		configmap)
	if err != nil {
		if errors.IsNotFound(err) {
			log.Info("Fabric CA configmap resource not found. We need to create it")
			configmap.Namespace = request.Namespace
			configmap.Name = "fabric-configuration-toolset"
			configmap.Data = map[string]string{}
			filepath.Walk(ScriptRoodDir, func(path string, info os.FileInfo, err error) error {
				if !info.IsDir() {
					dat, _ := ioutil.ReadFile(path)
					configmap.Data[info.Name()] = string(dat)
				}
				return nil
			})
			err = client.Create(context.TODO(), configmap)
			if err != nil {
				log.Error(err, "Failed to create Fabric configMap", "Service.Namespace",
					configmap.Namespace, "Service.Name", configmap.Name)
				return err
			}
			return nil
		}
		// Error reading the object - requeue the request.
		log.Error(err, "Failed to get Fabric configMap.")
	}
	return nil
}

type NodeSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "operator-sdk generate k8s" to regenerate code after modifying this file
	// Add custom validation using kubebuilder tags: https://book-v1.book.kubebuilder.io/beyond_basics/generating_crd.html
	StorageSize  string            `json:"storageSize"`
	StorageClass string            `json:"storageClass"`
	Image        string            `json:"image"`
	ConfigParams   []*ConfigParam   `json:"configParams"`
}

type ConfigParam struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}