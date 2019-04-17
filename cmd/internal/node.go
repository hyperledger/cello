/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/
package internal

import (
	"errors"
	"fmt"
	ghYaml "github.com/ghodss/yaml"
	"github.com/hyperledger/cello/cmd/model"
	"github.com/levigross/grequests"
	"github.com/spf13/viper"
	"gopkg.in/yaml.v2"
	"log"
)

var nodeBaseUrl = "nodes"

func ListNodes() (*model.NodeListResponse, error) {
	token := fmt.Sprintf("JWT %s", viper.GetString("auth.token"))
	baseUrl := viper.GetString("server.url")
	url := fmt.Sprintf("%s/%s", baseUrl, nodeBaseUrl)
	resp, err := grequests.Get(url, &grequests.RequestOptions{Headers: map[string]string{
		"Authorization": token,
	}})

	if err != nil {
		log.Fatalln("Unable to make request: ", err)
		return nil, errors.New("list agents failed")
	}
	if resp.Ok != true {
		log.Printf("Get agents failed %v %v", resp.StatusCode, resp.String())
		return nil, errors.New("list agents failed")
	} else {
		var nodeListResponse model.NodeListResponse
		err := resp.JSON(&nodeListResponse)
		if err != nil {
			panic(err)
		}

		return &nodeListResponse, nil
	}
}

func parseNodeSpec(source [] byte) (*model.NodeSpec, error) {
	var nodeSpec model.NodeSpec
	err := yaml.Unmarshal(source, &nodeSpec)
	if err != nil {
		return nil, err
	} else {
		return &nodeSpec, nil
	}
}

func CreateNode(source []byte) error {
	agentSpec, err := parseNodeSpec(source)
	if err != nil {
		panic(err)
	}
	yamlOuts, err := yaml.Marshal(agentSpec.Spec)
	if err != nil {
		panic(err)
	}
	jsonOuts, err := ghYaml.YAMLToJSON(yamlOuts)
	if err != nil {
		panic(err)
	}

	url := fmt.Sprintf("%s/%s", viper.GetString("server.url"), nodeBaseUrl)
	token := fmt.Sprintf("JWT %s", viper.GetString("auth.token"))
	resp, err := grequests.Post(url, &grequests.RequestOptions{JSON: jsonOuts, Headers: map[string] string {
		"Authorization": token,
	}})
	if err != nil {
		fmt.Printf("Create node failed")
		return err
	} else {
		fmt.Printf(resp.String())
	}
	return nil
}

func DeleteNode(id string) error {
	url := fmt.Sprintf("%s/%s/%s", viper.GetString("server.url"), nodeBaseUrl, id)
	token := fmt.Sprintf("JWT %s", viper.GetString("auth.token"))
	resp, err := grequests.Delete(url, &grequests.RequestOptions{Headers: map[string] string {
		"Authorization": token,
	}})
	if err != nil {
		return err
	} else {
		if resp.StatusCode != 204 {
			errMsg := fmt.Sprintf("delete node %s failed, %s", id, resp.String())
			return errors.New(errMsg)
		} else {
			fmt.Printf("Delete node %s success\n", id)
		}
	}
	return nil
}
