/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/
package cmd

import (
	"github.com/hyperledger/cello/cmd/internal"
	"github.com/spf13/cobra"
)

var deleteCmd = &cobra.Command{
	Use:   "delete",
	Short: "Delete resource in cell service",
	Long: `
Delete resource in cello service,

supported kind: Agent,Organization,Node

Examples:
  $ Delete a agent using agent id.
  celloctl delete agent 1
	`,
	Args: cobra.MinimumNArgs(2),
	Run: func(cmd *cobra.Command, args []string) {
		switch args[0] {
		case "agent", "Agent":
			err := internal.DeleteAgent(args[1])
			if err != nil {
				panic(err)
			}
			break
		case "org", "organization":
			err := internal.DeleteOrganization(args[1])
			if err != nil {
				panic(err)
			}
			break
		case "node", "Node":
			err := internal.DeleteNode(args[1])
			if err != nil {
				panic(err)
			}
		default:
			break
		}
	},
}

func init() {
	RootCmd.AddCommand(deleteCmd)
}
