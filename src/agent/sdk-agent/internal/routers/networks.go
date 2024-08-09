package routers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetNetworks(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, nil)
}
