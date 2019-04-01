/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/
package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
)

func init() {
	RootCmd.AddCommand(versionCmd)
}

var versionCmd = &cobra.Command{
	Use: "version",
	Short: "Print the version number of cello client",
	Long: `Show version number of cello client`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Cello Client v0.1 -- HEAD")
	},
}
