const fs = require('fs')
const AWS = require("aws-sdk");
//import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
//import { DynamoDBClient } from "@aws-sdk/client-dynamodb"; // ES6 import

module.exports ={
        getUser, putUser, getUsers
    }
/*
AWS.config.update({
    region: "local",
    endpoint: "http://localhost:8000"
});
*/
//*
AWS.config.update({
    region: "us-west-2"
});
//*/

var ddb = new AWS.DynamoDB.DocumentClient()

async function getUser(userId) {
	let params = {
  		TableName: 'vwars',
  		Key: {
    		userid: userId
  		}
	};
	console.log('db get userid: ' + userId)
	let result = await ddb.get(params).promise()
	return result
}

async function putUser(user) {
	var params = {
 		TableName: 'vwars',
  		Item: {
    		userid : user.userid,
    		username : user.username,
    		ore : user.ore,
    		city : user.city,
    		military : user.military,
    		energy : user.energy,
			energyUpdatedAt : user.energyUpdatedAt
  		}
	};
	console.log('db put userid: ' + user.userid)
	let result = await ddb.put(params).promise()
	return result
}

async function getUsers() {
	let result = ddb.scan({
		TableName: "vwars",
	  }).promise()
  return result
}






