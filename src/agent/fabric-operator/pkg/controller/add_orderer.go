package controller

import (
	"github.com/hyperledger/cello/src/agent/fabric-operator/pkg/controller/orderer"
)

func init() {
	// AddToManagerFuncs is a list of functions to create controllers and add them to a manager.
	AddToManagerFuncs = append(AddToManagerFuncs, orderer.Add)
}
