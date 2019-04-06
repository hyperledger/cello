/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/
package cmd

import (
	"github.com/hyperledger/cello/cmd/internal"
	"github.com/hyperledger/cello/cmd/model"
	"github.com/spf13/cobra"
	"gopkg.in/yaml.v2"
	"io/ioutil"
)

var file string

var createCmd = &cobra.Command{
	Use:   "create",
	Short: "Create resource in cell service from a file",
	Long: `
Create resource in cello service from a file,

supported kind: Agent,Organization,Node.

Examples:
  $ Create a agent using the data in agent.yaml
  celloctl create -f ./agent.yaml
`,
	Run: func(cmd *cobra.Command, args []string) {
		source, err := ioutil.ReadFile(file)
		if err != nil {
			panic(err)
		}
		var config model.Config
		err = yaml.Unmarshal(source, &config)
		if err != nil {
			panic(err)
		}
		switch config.Kind {
		case "Agent":
			err := internal.CreateAgent(source)
			if err != nil {
				panic(err)
			}
			break
		case "Organization":
			err := internal.CreateOrganization(source)
			if err != nil {
				panic(err)
			}
			break
		case "Node":
			err := internal.CreateNode(source)
			if err != nil {
				panic(err)
			}
			break
		default:
			break
		}
	},
}

func init() {
	RootCmd.AddCommand(createCmd)

	createCmd.Flags().StringVarP(&file, "file", "f", "", "yaml file for create")
	err := createCmd.MarkFlagRequired("file")
	if err != nil {
		panic(err)
	}
}
