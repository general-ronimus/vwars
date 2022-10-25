const fs = require('fs')
const AWS = require("aws-sdk");
const yaml = require('js-yaml');

module.exports ={
        getUser, putUser, getUsers, deleteUser, getGuild, putGuild, deleteGuild, getWar, putWar, getWars, deleteWar
    }

const config = yaml.safeLoad(fs.readFileSync('build-properties.yml', 'utf8'))
const dbLocalHost = config.db_local_host
const dbLocalPort = config.db_local_port
console.log('Confguration loaded: ' + JSON.stringify(config))

if(dbLocalHost || dbLocalPort) {
	console.log('Using local dynamodb at http://' + dbLocalHost + ':' + dbLocalPort)

	AWS.config.update({
		region: "local",
		endpoint: "http://" + dbLocalHost + ":" + dbLocalPort
	});
} else {
	AWS.config.update({
		region: "us-west-2"
	});
}

const ddb = new AWS.DynamoDB.DocumentClient()


/**
 * USER DB OPERATIONS
 * 
 */

async function getUser(warId, userId) {
	let params = {
  		TableName: 'vwars',
  		Key: {
    		PK: 'WAR#' + warId,
			SK: 'USER#' + userId
  		}
	};
	console.log('db get user - warId: ' + warId + ', userId: ' + userId)
	let result = await ddb.get(params).promise()
	if(result.Item) {
		console.log("Retrieved user object: " + JSON.stringify(result.Item))
		result.Item.warId = result.Item.PK.replace(/^(WAR#)/,"");
		result.Item.userId = result.Item.SK.replace(/^(USER#)/,"");
	}
	return result
}

async function putUser(user) {
	var params = {
 		TableName: 'vwars',
  		Item: {
			PK : 'WAR#' + user.warId,
    		SK : 'USER#' + user.userId,
    		username : user.username,
    		ore : user.ore,
			bar : user.bar,
    		city : user.city,
    		military : user.military,
    		energy : user.energy,
			energyUpdatedAt : user.energyUpdatedAt,
			shieldUpdatedAt : user.shieldUpdatedAt,
			shieldHealth: user.shieldHealth,
			lastFueled: user.lastFueled,
			lastCloaked: user.lastCloaked,
			equipmentFuel: user.equipmentFuel,
			equipmentCloak: user.equipmentCloak,
			equipmentShield: user.equipmentShield,
			equipmentSabotage: user.equipmentSabotage,
			equipmentStrike: user.equipmentStrike,
			equipmentNuke: user.equipmentNuke,
			netMined : user.netMined,
			netStolen : user.netStolen,
			netCityDamage : user.netCityDamage,
			netMilitaryDamage : user.netMilitaryDamage,
			netFuel : user.netFuel,
			netCloak : user.netCloak,
			netShield : user.netShield,
			netSabotage : user.netSabotage,
			netStrike : user.netStrike,
			netNuke : user.netNuke
  		},
		ReturnValues: 'ALL_OLD'
	};
	console.log('db put user - warId: ' + user.warId + ',userId: ' + user.userId)
	let result = await ddb.put(params).promise()
	return result
}

async function getUsers(warId) {
	let params = {
		TableName: 'vwars',
		KeyConditionExpression: 'PK = :hkey and begins_with(SK, :rkey)',
		ExpressionAttributeValues: {
    		':hkey': 'WAR#' + warId,
    		':rkey': 'USER#'
  		}
	};
	console.log('db get users - warId: ' + warId)
  	let result = await ddb.query(params).promise()
  	result.Items.forEach(function(user) {
		console.log("Retrieved user: " + JSON.stringify(user))
		user.warId = user.PK.replace(/^(WAR#)/,"");
		user.userId = user.SK.replace(/^(USER#)/,"");
	});  
	return result
}

async function deleteUser(warId, userId) {
	var params = {
		TableName : 'vwars',
		Key: {
			PK: 'WAR#' + warId,
			SK: 'USER#' + userId
		}
	  };
	console.log('db delete user - warId: ' + warId + ', userId: ' + userId)
	let result = await ddb.delete(params).promise()
	return result
}




/**
 * GUILD DB OPERATIONS
 * 
 */

async function getGuild(guildId) {
	let params = {
  		TableName: 'vwars',
  		Key: {
    		PK: 'GUILD#' + guildId,
			SK: 'GUILD#' + guildId,
  		}
	};
	console.log('db get guild - guildId: ' + guildId)
	let result = await ddb.get(params).promise()
	if(result.Item) {
		console.log('Retrieved guild: ' + JSON.stringify(result.Item))
		result.Item.guildId = result.Item.PK.replace(/^(GUILD#)/,"");
	}
	return result
}

async function putGuild(guild) {
	var params = {
 		TableName: 'vwars',
  		Item: {
			PK : 'GUILD#' + guild.guildId,
    		SK: 'GUILD#' + guild.guildId
  		}
	};
	console.log('db put guild - guildId: ' + guild.guildId)
	let result = await ddb.put(params).promise()
	return result
}

async function deleteGuild(guildId) {
	var params = {
		TableName : 'vwars',
		Key: {
			PK: 'GUILD#' + guildId,
			SK: 'GUILD#' + guildId
		}
	  };
	console.log('db delete guild: ' + guildId)
	let result = await ddb.delete(params).promise()
	return result
}



/**
 * WAR DB OPERATIONS
 * 
 */

async function getWar(guildId, warId) {
	let params = {
  		TableName: 'vwars',
  		Key: {
    		PK: 'GUILD#' + guildId,
			SK: 'WAR#' + warId
  		}
	};
	console.log('db get war - guildId: ' + guildId + ', warId: ' + warId)
	let result = await ddb.get(params).promise()
	if(result.Item) {
		console.log("Retrieved war: " + JSON.stringify(result.Item))
		result.Item.guildId = result.Item.PK.replace(/^(GUILD#)/,"");
		result.Item.warId = result.Item.SK.replace(/^(WAR#)/,"");
	}
	return result
}

async function putWar(war) {
	var params = {
 		TableName: 'vwars',
  		Item: {
			PK : 'GUILD#' + war.guildId,
    		SK: 'WAR#' + war.warId,
			name: war.name,
			isActive: war.isActive,
			expiration: war.expiration,
			energyRefreshMinutes: war.energyRefreshMinutes
  		}
	};
	console.log('db put war - guildId: ' + war.guildId + ', warId: ' + war.warId)
	let result = await ddb.put(params).promise()
	return result
}

async function getWars(guildId) {
	let params = {
		TableName: 'vwars',
		KeyConditionExpression: 'PK = :hkey and begins_with(SK, :rkey)',
		ExpressionAttributeValues: {
    		':hkey': 'GUILD#' + guildId,
    		':rkey': 'WAR#'
  		}
  	};
	console.log('db get wars - guildId: ' + guildId)
  	let result = await ddb.query(params).promise()
  	result.Items.forEach(function(war) {
		console.log("Retrieved war: " + JSON.stringify(war))
		war.guildId = war.PK.replace(/^(GUILD#)/,"");
		war.warId = war.SK.replace(/^(WAR#)/,"");
 	});
  return result
}

async function deleteWar(guildId, warId) {
	var params = {
		TableName : 'vwars',
		Key: {
			PK: 'GUILD#' + guildId,
			SK: 'WAR#' + warId
		}
	  };
	console.log('db delete war - guildId: ' + guildId + ', warId: ' + warId)
	let result = await ddb.delete(params).promise()
	return result
}





