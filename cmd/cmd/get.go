/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/
package cmd

import (
	"fmt"
	"github.com/hyperledger/cello/cmd/internal"
	"github.com/jedib0t/go-pretty/table"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"os"
	"strings"
)

var page int
var pageSize int

var getCmd = &cobra.Command{
	Use:   "get",
	Short: "Get resource in cell service",
	Long:  `Get resource in cello service,
			supported kind: agent,organization`,
	Args: cobra.MinimumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			fmt.Println("Please input type to get, agent")
			os.Exit(1)
		}
		types := strings.Split(args[0], ",")
		for _, resourceType := range types {
			switch resourceType {
			case "agent":
				token := fmt.Sprintf("JWT %s", viper.GetString("auth.token"))
				baseUrl := viper.GetString("server.url")
				agentListResponse, err := internal.ListAgents(baseUrl, token)
				if err != nil {
					panic(err)
				} else {
					t := table.NewWriter()
					t.SetOutputMirror(os.Stdout)
					t.AppendHeader(table.Row{"#", "Name", "Type", "Worker API", "Capacity", "Node Capacity", "Status", "Create Time", "Organization"})
					for _, value := range agentListResponse.Agents {
						t.AppendRow([]interface{}{value.ID, value.Name, value.Type, value.WorkerAPI, value.Capacity, value.NodeCapacity, value.Status, value.CreateTime, value.OrgID})
					}
					t.AppendFooter(table.Row{"", "", "", "", "", "", "", "Total", agentListResponse.Total})
					fmt.Println("Agent")
					t.Render()
				}
				break
			case "organization", "org":
				organizationListResponse, err := internal.ListOrganization()
				if err != nil {
					panic(err)
				} else {
					t := table.NewWriter()
					t.SetOutputMirror(os.Stdout)
					t.AppendHeader(table.Row{"#", "Name", "Create Time"})
					for _, value := range organizationListResponse.Organizations {
						t.AppendRow([]interface{}{value.ID, value.Name, value.CreateTime})
					}
					t.AppendFooter(table.Row{"", "Total", organizationListResponse.Total})
					fmt.Println("Organization")
					t.Render()
				}
				break
			case "node":
				nodeListResponse, err := internal.ListNodes()
				if err != nil {
					panic(err)
				} else {
					t := table.NewWriter()
					t.SetOutputMirror(os.Stdout)
					t.AppendHeader(table.Row{"#", "Name", "Type", "Network", "Create Time"})
					for _, value := range nodeListResponse.Nodes {
						network := fmt.Sprintf("%s-%s", value.NetworkType, value.NetworkVersion)
						t.AppendRow([]interface{}{value.ID, value.Name, value.Type, network, value.CreateTime})
					}
					t.AppendFooter(table.Row{"", "", "", "Total", nodeListResponse.Total})
					fmt.Println("Node")
					t.Render()
				}
				break
			case "user":
				userListResponse, err := internal.ListUsers(page, pageSize)
				if err != nil {
					panic(err)
				} else {
					t := table.NewWriter()
					t.SetOutputMirror(os.Stdout)
					t.AppendHeader(table.Row{"#", "Username", "Role"})
					for _, value := range userListResponse.Users {
						t.AppendRow([]interface{}{value.ID, value.Username, value.Role})
					}
					t.AppendFooter(table.Row{"", "Total", userListResponse.Total})
					fmt.Println("User")
					t.Render()
				}
			default:
				break
			}
		}
	},
}

func init() {
	RootCmd.AddCommand(getCmd)

	getCmd.Flags().IntVarP(&page, "page", "p", 1, "page to query")
	getCmd.Flags().IntVarP(&pageSize, "pageSize", "s", 10, "page size to query")
}
