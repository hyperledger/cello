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

var userBaseUrl = "users"

func ListUsers(page int, pageSize int) (*model.UserListResponse, error) {
	token := fmt.Sprintf("JWT %s", viper.GetString("auth.token"))
	baseUrl := viper.GetString("server.url")
	url := fmt.Sprintf("%s/%s", baseUrl, userBaseUrl)
	resp, err := grequests.Get(url, &grequests.RequestOptions{Headers: map[string]string{
		"Authorization": token,
	}, Params: map[string]string{"page": fmt.Sprint(page), "per_page": fmt.Sprint(pageSize)}})

	if err != nil {
		log.Fatalln("Unable to make request: ", err)
		return nil, errors.New("list agents failed")
	}
	if resp.Ok != true {
		log.Printf("Get agents failed %v %v", resp.StatusCode, resp.String())
		return nil, errors.New("list agents failed")
	} else {
		var userListResponse model.UserListResponse
		err := resp.JSON(&userListResponse)
		if err != nil {
			panic(err)
		}

		return &userListResponse, nil
	}
}

func parseUserSpec(source [] byte) ([] byte, error) {
	var userSpec model.UserSpec
	err := yaml.Unmarshal(source, &userSpec)
	if err != nil {
		return nil, err
	} else {
		yamlOuts, err := yaml.Marshal(userSpec.Spec)
		if err != nil {
			panic(err)
		}
		jsonOuts, err := ghYaml.YAMLToJSON(yamlOuts)
		if err != nil {
			panic(err)
		}
		return jsonOuts, nil
	}
}

func CreateUser(source []byte) error {
	jsonOuts, err := parseUserSpec(source)
	if err != nil {
		panic(err)
	}
	url := fmt.Sprintf("%s/%s", viper.GetString("server.url"), userBaseUrl)
	token := fmt.Sprintf("JWT %s", viper.GetString("auth.token"))
	resp, err := grequests.Post(url, &grequests.RequestOptions{JSON: jsonOuts, Headers: map[string] string {
		"Authorization": token,
	}})
	if err != nil {
		fmt.Printf("Create user failed")
		return err
	} else {
		fmt.Printf(resp.String())
	}
	return nil
}
//
//func DeleteAgent(id string) error {
//	url := fmt.Sprintf("%s/%s/%s", viper.GetString("server.url"), agentBaseUrl, id)
//	token := fmt.Sprintf("JWT %s", viper.GetString("auth.token"))
//	resp, err := grequests.Delete(url, &grequests.RequestOptions{Headers: map[string] string {
//		"Authorization": token,
//	}})
//	if err != nil {
//		return err
//	} else {
//		if resp.StatusCode != 204 {
//			errMsg := fmt.Sprintf("delete agent %s failed, %s", id, resp.String())
//			return errors.New(errMsg)
//		} else {
//			fmt.Printf("Delete agent %s success\n", id)
//		}
//	}
//	return nil
//}
