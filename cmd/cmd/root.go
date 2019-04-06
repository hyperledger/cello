/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

package cmd

import (
	"fmt"
	"github.com/hyperledger/cello/cmd/internal"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var cfgFile string

type UserInfo struct {
	ID string `json:"pk"`
	Name string `json:"username"`
	Email string `json:"email"`
}

type TokenResponse struct {
	Token string `json:"token"`
	User UserInfo `json:"user"`
}

// RootCmd represents the base command when called without any subcommands
var RootCmd = &cobra.Command{
	Use:   "celloctl",
	Short: "Cello ctl is a tool to manage cello api service",
	Long: `
This application can manage all cello api service, to control Networks of hyperledger deployment.

The default config store directory is, $HOME/.cello or /etc/cello, you can create config.yaml under these folders.
`,
	// Uncomment the following line if your bare application
	// has an action associated with it:
	//	Run: func(cmd *cobra.Command, args []string) { },
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		token := viper.GetString("auth.token")
		if token == "" {
			err := internal.Login(viper.GetString("server.url"))
			if err != nil {
				panic(err)
			}
		}
	},
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	if err := RootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func init() {
	cobra.OnInitialize(initConfig)

	// Here you will define your flags and configuration settings.
	// Cobra supports persistent flags, which, if defined here,
	// will be global for your application.
	RootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.cello/config.yaml)")

	// Cobra also supports local flags, which will only run
	// when this action is called directly.
	RootCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}

// initConfig reads in config file and ENV variables if set.
func initConfig() {
	if cfgFile != "" {
		// Use config file from the flag.
		viper.SetConfigFile(cfgFile)
	} else {
		// Search config in home directory with name ".cobra-example" (without extension).
		viper.AddConfigPath("$HOME/.cello")
		viper.AddConfigPath("/etc/cello/")
		viper.SetConfigType("yaml")
		viper.SetConfigName("config")
	}

	err := viper.ReadInConfig()
	if err != nil {
		panic(fmt.Errorf("Fatal error config file: %s \n", err))
	}

	viper.AutomaticEnv() // read in environment variables that match

	// If a config file is found, read it in.
	if err := viper.ReadInConfig(); err != nil {
		panic(err)
	}
}