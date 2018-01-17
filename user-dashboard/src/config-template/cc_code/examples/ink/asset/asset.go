/*
Copyright Ziggurat Corp. 2017 All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

// Asset: a demo chaincode for inkchain

package main

import (
	"fmt"
	"strconv"
	"encoding/json"
	"strings"
	"math/big"
	"bytes"

	"github.com/inklabsfoundation/inkchain/core/chaincode/shim"
	pb "github.com/inklabsfoundation/inkchain/protos/peer"
)

const (
	// invoke func name
	AddUser				string = "addUser"
	QueryUser			string = "queryUser"
	AddAsset			string = "addAsset"
	ReadAsset			string = "readAsset"
	EditAsset			string = "editAsset"
	DeleteAsset			string = "deleteAsset"
	BuyAsset			string = "buyAsset"
	ReadAssetByRange	string = "readAssetByRange"
)

// Prefixes for user and asset separately
const (
	UserPrefix	= "USER_"
	AssetPrefix	= "ASSET_"
)

// Demo chaincode for asset registering, querying and transferring
type assetChaincode struct {
}

type user struct {
	Name	string `json:"name"`
	Age		int	   `json:"age"`
	Address string `json:"address"`	// the address actually decides a user
}

type asset struct {
	Name 	string `json:"name"`
	Type 	string `json:"type"`
	Content	string `json:"content"`
	PriceType	string `json:"price_type"`
	Price	*big.Int `json:"price"`
	Owner 	string `json:"owner"`	// store the name of the asset here
}

// ===================================================================================
// Main
// ===================================================================================
func main() {
	err := shim.Start(new(assetChaincode))
	if err != nil {
		fmt.Printf("Error starting assetChaincode: %s", err)
	}
}

// Init initializes chaincode
// ==================================================================================
func (t *assetChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("assetChaincode Init.")
	return shim.Success([]byte("Init success."))
}

// Invoke func
// ==================================================================================
func (t *assetChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("assetChaincode Invoke.")
	function, args := stub.GetFunctionAndParameters()

	switch function {
	case AddUser:
		if len(args) != 2 {
			return shim.Error("Incorrect number of arguments. Expecting 2.")
		}
		// args[0]: user name
		// args[1]: user age
		// note: user address could be revealed from private key provided when invoking
		return t.addUser(stub, args)

	case QueryUser:
		if len(args) != 1 {
			return shim.Error("Incorrect number of arguments. Expecting 1.")
		}
		// args[0]: user name
		return t.queryUser(stub, args)

	case AddAsset:
		if len(args) != 6 {
			return shim.Error("Incorrect number of arguments. Expecting 6.")
		}
		// args[0]: asset name
		// args[1]: type
		// args[2]: content
		// args[3]: price_type
		// args[4]: price
		// args[5]: owner
		return t.addAsset(stub, args)

	case ReadAsset:
		if len(args) != 1 {
			return shim.Error("Incorrect number of arguments. Expecting 1.")
		}
		// args[0]: asset name
		return t.readAsset(stub, args)

	case EditAsset:
		if len(args) != 3 {
			return shim.Error("Incorrect number of arguments. Expecting 3.")
		}
		// args[0]: asset name
		// args[1]: field name
		// args[2]: new value
		return t.editAsset(stub, args)

	case DeleteAsset:
		if len(args) != 1 {
			return shim.Error("Incorrect number of arguments. Expecting 1.")
		}
		// args[0]: asset name
		return t.delAsset(stub, args)

	case BuyAsset:
		if len(args) != 2 {
			return shim.Error("Incorrect number of arguments. Expecting 2.")
		}
		// args[0]: asset name
		// args[1]: buyer's name
		return t.buyAsset(stub, args)

	case ReadAssetByRange:
		if len(args) != 2 {
			return shim.Error("Incorrect number of arguments. Expecting 2.")
		}
		// args[0]: startKey
		// args[1]: endKey
		return t.readAssetByRange(stub, args)

	}

	return shim.Error("Invalid invoke function name.")
}

// =============================
// addUser: Register a new user
// =============================
func (t *assetChaincode) addUser(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var new_name string
	var new_age int
	var err error

	new_name = args[0]
	new_age, err = strconv.Atoi(args[1])
	if err != nil {
		return shim.Error("Expecting integer value for user's age.")
	}

	// get user's address
	new_add, err := stub.GetSender()
	if err != nil {
		return shim.Error("Fail to reveal user's address.")
	}
	new_add = strings.ToLower(new_add)

	// check if user exists
	user_key := UserPrefix + new_name
	userAsBytes, err := stub.GetState(user_key)
	if err != nil {
		return shim.Error("Fail to get user: " + err.Error())
	} else if userAsBytes != nil {
		fmt.Println("This user already exists: " + new_name)
		return shim.Error("This user already exists: " + new_name)
	}

	// register user
	user := &user{new_name, new_age, new_add}
	userJSONasBytes, err := json.Marshal(user)
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.PutState(user_key, userJSONasBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success([]byte("User register success."))
}

// ==========================================
// queryUser: query the information of a user
// ==========================================
func (t *assetChaincode) queryUser(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	user_name := args[0]
	user_key := UserPrefix + user_name

	userAsBytes, err := stub.GetState(user_key)
	if err != nil {
		return shim.Error("Fail to get user: " + err.Error())
	}
	if userAsBytes == nil {
		fmt.Println("This user doesn't exist: " + user_name)
		return shim.Error("This user doesn't exist: " + user_name)
	}

	return shim.Success(userAsBytes)
}

// =============================================
// addAsset: add a new asset
//
// the name of an asset must start with letters
// =============================================
func (t *assetChaincode) addAsset(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	asset_name := args[0]

	// check whether the name starts with letters
	if len(asset_name) == 0 {
		return shim.Error("Asset's Name needed.")
	}
	if !((asset_name[0] >='a' && asset_name[0]<='z') || (asset_name[0] >='A' && asset_name[0]<='Z')) {
		return shim.Error("The name of an asset must start with letters.")
	}

	asset_key := AssetPrefix + asset_name

	asset_type := args[1]
	asset_content := args[2]
	asset_price_type := args[3]
	// price
	asset_price := big.NewInt(0)
	_, good := asset_price.SetString(args[4], 10)
	if !good {
		return shim.Error("Expecting integer value for amount")
	}
	owner_name := args[5]

	// verify weather the owner exists
	owner_key := UserPrefix + owner_name
	userAsBytes, err := stub.GetState(owner_key)
	if err != nil {
		return shim.Error("Fail to get user: " + err.Error())
	}
	if userAsBytes == nil {
		fmt.Println("This owner doesn't exist: " + owner_name)
		return shim.Error("This owner doesn't exist: " + owner_name)
	}

	// register asset
	asset := &asset{asset_name, asset_type,asset_content, asset_price_type, asset_price,owner_name}
	assetJSONasBytes, err := json.Marshal(asset)
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.PutState(asset_key, assetJSONasBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success([]byte("asset register success."))
}

// ===========================================
// readAsset: query the information of a asset
// ===========================================
func (t *assetChaincode) readAsset(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	asset_name := args[0]
	asset_key := AssetPrefix + asset_name

	assetAsBytes, err := stub.GetState(asset_key)
	if err != nil {
		return shim.Error("Fail to get asset: " + err.Error())
	}
	if assetAsBytes == nil {
		fmt.Println("This asset doesn't exist: " + asset_name)
		return shim.Error("This asset doesn't exist: " + asset_name)
	}

	return shim.Success(assetAsBytes)
}

// ======================================================
// editAsset: edit the asset
//
// only owner can edit the information of his/her asset
// ======================================================
func (t *assetChaincode) editAsset(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	asset_name := args[0]
	asset_key := AssetPrefix + asset_name

	field_name := args[1]
	field_value := args[2]

	assetAsBytes, err := stub.GetState(asset_key)
	if err != nil {
		return shim.Error("Fail to get asset: " + err.Error())
	}
	if assetAsBytes == nil {
		fmt.Println("This asset doesn't exist: " + asset_name)
		return shim.Error("This asset doesn't exist: " + asset_name)
	}

	var assetJSON asset
	err = json.Unmarshal([]byte(assetAsBytes), &assetJSON)

	new_asset := &asset{assetJSON.Name, assetJSON.Type, assetJSON.Content,
		assetJSON.PriceType, assetJSON.Price, assetJSON.Owner}

	switch field_name {
	case "Type":
		new_asset.Type = field_value
		goto LABEL_STORE
	case "Content":
		new_asset.Content = field_value
		goto LABEL_STORE
	case "PriceType":
		new_asset.PriceType = field_value
		goto LABEL_STORE
	case "Price":
		new_price := big.NewInt(0)
		_, good := new_price.SetString(field_value, 10)
		if !good {
			return shim.Error("Expecting integer value for amount")
		}
		new_asset.Price = new_price
		goto LABEL_STORE
	}

	return shim.Error("Invalid asset filed name (\"Type\", \"Content\", \"PriceType\" or \"Price\" wanted).")

LABEL_STORE:
// store new asset
	assetJSONasBytes, err := json.Marshal(new_asset)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutState(asset_key, assetJSONasBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(assetJSONasBytes)
}

// ======================================
// delAsset: del a specific asset by name
//
// only owner can delete his/her asset
// ======================================
func (t *assetChaincode) delAsset(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	asset_name := args[0]
	asset_key := AssetPrefix + asset_name

	// step 1: get the asset info
	assetAsBytes, err := stub.GetState(asset_key)
	if err != nil {
		return shim.Error("Fail to get asset: " + err.Error())
	}
	if assetAsBytes == nil {
		fmt.Println("This asset doesn't exist: " + asset_name)
		return shim.Error("This asset doesn't exist: " + asset_name)
	}

	var assetJSON asset

	err = json.Unmarshal([]byte(assetAsBytes), &assetJSON)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to decode JSON of: " + asset_name + "\"}"
		return shim.Error(jsonResp)
	}

	// step 2: get the owner's address
	user_name := assetJSON.Owner
	user_key := UserPrefix + user_name
	userAsBytes, err := stub.GetState(user_key)
	if err != nil {
		return shim.Error("Fail to get user: " + err.Error())
	}
	if userAsBytes == nil {
		fmt.Println("This user doesn't exist: " + user_name)
		return shim.Error("This user doesn't exist: " + user_name)
	}

	var userJSON user

	err = json.Unmarshal([]byte(userAsBytes), &userJSON)
	if err != nil {
		return shim.Error("Error when unmarshal JSON " + user_name)
	}
	owner_add := userJSON.Address

	// step 3: check address and then delete the asset
	sender_add, err := stub.GetSender()
	if err != nil {
		return shim.Error("Fail to get sender.")
	}

	if owner_add != sender_add {
		fmt.Println("Authorization denied. ")
		return shim.Error("Authorization denied. ")
	}

	err = stub.DelState(asset_key)
	if err != nil {
		fmt.Println("Fail to delete: " + asset_name)
		return shim.Error("Fail to delete" + asset_name)
	}

	return shim.Success([]byte("asset delete success."))
}

// ==========================================================
// buyAsset: buy a specific asset, make transfer to the owner
// ==========================================================
func (t *assetChaincode) buyAsset(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	asset_name := args[0]
	asset_key := AssetPrefix + asset_name
	buyer_name := args[1]
	buyer_key := UserPrefix + buyer_name

	// step 1: confirm buyer's address
	sender_add, err := stub.GetSender()
	if err != nil {
		fmt.Println("Fail to get sender.")
		return shim.Error("Fail to get sender.")
	}

	buyerAsBytes, err := stub.GetState(buyer_key)
	if err != nil {
		return shim.Error("Fail to get user: " + err.Error())
	}
	if buyerAsBytes == nil {
		fmt.Println("This user doesn't exist: " + buyer_name)
		return shim.Error("This user doesn't exist: " + buyer_name)
	}

	var buyerJSON user

	err = json.Unmarshal([]byte(buyerAsBytes), &buyerJSON)
	if err != nil {
		return shim.Error("Error when unmarshal JSON " + buyer_name)
	}

	// check whether the sender's address corresponds with the buyer's
	if sender_add != buyerJSON.Address {
		return shim.Error("The sender's address doesn't correspond with the buyer's.")
	}

	// step 2: get the information of the asset
	assetAsBytes, err := stub.GetState(asset_key)
	if err != nil {
		return shim.Error("Fail to get asset: " + err.Error())
	}
	if assetAsBytes == nil {
		fmt.Println("This asset doesn't exist: " + asset_name)
		return shim.Error("This asset doesn't exist: " + asset_name)
	}

	var assetJSON asset

	err = json.Unmarshal([]byte(assetAsBytes), &assetJSON)
	if err != nil {
		return shim.Error("Error when unmarshal JSON " + asset_name)
	}

	// step 3: get the information of the asset's owner
	owner_name := assetJSON.Owner
	owner_key := UserPrefix + owner_name

	ownerAsBytes, err := stub.GetState(owner_key)
	if err != nil {
		return shim.Error("Fail to get user: " + err.Error())
	}
	if ownerAsBytes == nil {
		fmt.Println("This user doesn't exist: " + owner_name)
		return shim.Error("This user doesn't exist: " + owner_name)
	}

	var ownerJSON user

	err = json.Unmarshal([]byte(ownerAsBytes), &ownerJSON)
	if err != nil {
		return shim.Error("Error when unmarshal JSON " + owner_name)
	}

	// step 4: make transfer
	toAddress := ownerJSON.Address
	priceType := assetJSON.PriceType
	price := assetJSON.Price
	err = stub.Transfer(toAddress, priceType, price)

	if err != nil {
		return shim.Error("Error when making transfer。")
	}

	// step 5: update asset info
	assetJSON_new := &asset{assetJSON.Name, assetJSON.Type, assetJSON.Content,
		assetJSON.PriceType, assetJSON.Price, buyer_name}

	assetJSONasBytes, err := json.Marshal(assetJSON_new)
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.PutState(asset_key, assetJSONasBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success([]byte("Success buying the asset."))
}

// ========================================================================
// readAssetByRange: query assets' names by range (startKey, endKey)
//
// startKey and endKey are case-sensitive
// use "" for both startKey and endKey if you want to query all the assets
// ========================================================================
func (t *assetChaincode) readAssetByRange(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	startKey := ""
	endKey := ""
	if args[0] != ""{
		startKey = AssetPrefix + args[0] + "*"
	}
	if args[1] != ""{
		endKey = AssetPrefix + args[1] + "*"
	}

	resultsIterator, err := stub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	bArrayIndex := 1
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// check asset key
		cur_key := queryResponse.Key

		if len(cur_key) >= len(AssetPrefix) && cur_key[0:len(AssetPrefix)] == AssetPrefix {
			// Add a comma before array members, suppress it for the first array member
			if bArrayMemberAlreadyWritten == true {
				buffer.WriteString(",")
			}
			// index of the result
			buffer.WriteString("{\"Number\":")
			buffer.WriteString("\"")
			bArrayIndexStr := strconv.Itoa(bArrayIndex)
			buffer.WriteString(string(bArrayIndexStr))
			bArrayIndex += 1
			buffer.WriteString("\"")
			// information about current asset
			buffer.WriteString(", \"Record\":")
			buffer.WriteString(string(queryResponse.Value))
			buffer.WriteString("}")
			bArrayMemberAlreadyWritten = true
		}

	}
	buffer.WriteString("]")

	return shim.Success(buffer.Bytes())

}