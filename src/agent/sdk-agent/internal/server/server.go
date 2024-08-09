package server

import (
	routers "github.com/hyperledger/cello/src/agent/sdk-agent/internal/routers"

	"github.com/gin-gonic/gin"
)

type server struct {
}

func NewServer() server {
	return server{}
}

func (s *server) Start() {
	grouter := gin.Default()
	grouter.GET("/networks", routers.GetNetworks)

	grouter.Run("localhost:8080")
}
