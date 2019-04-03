/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/
package internal

import (
	"errors"
	"fmt"
	"github.com/hyperledger/cello/cmd/model"
	ghYaml "github.com/ghodss/yaml"
	"github.com/levigross/grequests"
	"github.com/spf13/viper"
	"gopkg.in/yaml.v2"
	"log"
)

var organizationBaseUrl = "organizations"

func ListOrganization() (*model.OrganizationListResponse, error) {
	token := fmt.Sprintf("JWT %s", viper.GetString("auth.token"))
	baseUrl := viper.GetString("server.url")
	url := fmt.Sprintf("%s/%s", baseUrl, organizationBaseUrl)
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
		var organizationListResponse model.OrganizationListResponse
		err := resp.JSON(&organizationListResponse)
		if err != nil {
			panic(err)
		}

		return &organizationListResponse, nil
	}
}

func parseOrganizationSpec(source [] byte) (*model.OrganizationSpec, error) {
	var organizationSpec model.OrganizationSpec
	err := yaml.Unmarshal(source, &organizationSpec)
	if err != nil {
		return nil, err
	} else {
		return &organizationSpec, nil
	}
}

func CreateOrganization(source []byte) error {
	agentSpec, err := parseOrganizationSpec(source)
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

	url := fmt.Sprintf("%s/%s", viper.GetString("server.url"), organizationBaseUrl)
	token := fmt.Sprintf("JWT %s", viper.GetString("auth.token"))
	resp, err := grequests.Post(url, &grequests.RequestOptions{JSON: jsonOuts, Headers: map[string] string {
		"Authorization": token,
	}})
	if err != nil {
		fmt.Printf("Create agent failed")
		return err
	} else {
		fmt.Printf(resp.String())
	}
	return nil
}

func DeleteOrganization(id string) error {
	url := fmt.Sprintf("%s/%s/%s", viper.GetString("server.url"), organizationBaseUrl, id)
	token := fmt.Sprintf("JWT %s", viper.GetString("auth.token"))
	resp, err := grequests.Delete(url, &grequests.RequestOptions{Headers: map[string] string {
		"Authorization": token,
	}})
	if err != nil {
		return err
	} else {
		if resp.StatusCode != 204 {
			errMsg := fmt.Sprintf("delete organization %s failed, %s", id, resp.String())
			return errors.New(errMsg)
		} else {
			fmt.Printf("Delete organization %s success\n", id)
		}
	}
	return nil
}
