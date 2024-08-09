package routers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// getAlbums responds with the list of all albums as JSON.
func GetNetworks(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, nil)
}
