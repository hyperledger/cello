/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/
package cmd

import (
	"fmt"
	"github.com/hyperledger/cello/cmd/internal"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func init() {
	RootCmd.AddCommand(tokenCmd)
}

var tokenCmd = &cobra.Command{
	Use: "refresh-token",
	Short: "Refresh user token",
	Long: `Refresh token`,
	Run: func(cmd *cobra.Command, args []string) {
		err := internal.Login(viper.GetString("server.url"))
		if err != nil {
			panic(err)
		} else {
			fmt.Printf("Refresh token success.")
		}
	},
}
