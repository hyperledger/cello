/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/
package internal

import (
	"errors"
	"fmt"
	"github.com/hyperledger/cello/cmd/model"
	"github.com/levigross/grequests"
	"github.com/spf13/viper"
	"log"
)

var loginBaseUrl = "auth/login/"

func Login(baseUrl string) error {
	authUrl := fmt.Sprintf("%s/%s", baseUrl, loginBaseUrl)
	resp, err := grequests.Post(authUrl, &grequests.RequestOptions{JSON: map[string]string{
		"username": viper.GetString("auth.username"),
		"password": viper.GetString("auth.password"),
	}})
	// You can modify the request by passing an optional RequestOptions struct

	if err != nil {
		log.Fatalln("Unable to make request: ", err)
		return err
	}

	if resp.Ok != true {
		log.Printf("Get token failed")
		return errors.New("get token failed")
	} else {
		var token model.TokenResponse
		err := resp.JSON(&token)
		if err != nil {
			panic(err)
		}
		viper.Set("auth.token", token.Token)
		viper.Set("auth.email", token.User.Email)
		writeErr := viper.WriteConfig()
		if writeErr != nil {
			return writeErr
		}
	}

	return nil
}
