const AWS = require("aws-sdk");

module.exports ={
        getUser, putUser, getUsers, deleteUser, getGuild, putGuild, deleteGuild, getGuildUser, putGuildUser, getGuildUsers, deleteGuildUser, getWar, putWar, getWars, deleteWar
    }

let stage = 'local'
if(process.env.STAGE) {
	stage = process.env.STAGE
}
let vwarsTable = 'vwars-local'
if(process.env.VWARS_TABLE) {
	vwarsTable = process.env.VWARS_TABLE
}
const dbLocalHost = process.env.DB_LOCAL_HOST
const dbLocalPort = process.env.DB_LOCAL_PORT
console.log('DB service initialized with stage: ' + stage + ', table: ' + vwarsTable + ', dbLocalHost: ' + dbLocalHost + ', dbLocalPort: ' + dbLocalPort)
if('local' === stage) {
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
  		TableName: vwarsTable,
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
 		TableName: vwarsTable,
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
			lastStealthed: user.lastStealthed,
			lastJammed: user.lastJammed,
			lastShattered: user.lastShattered,
			equipmentFuel: user.equipmentFuel,
			equipmentCloak: user.equipmentCloak,
			equipmentStealth: user.equipmentStealth,
			equipmentJam: user.equipmentJam,
			equipmentShield: user.equipmentShield,
			equipmentSabotage: user.equipmentSabotage,
			equipmentStrike: user.equipmentStrike,
			equipmentNuke: user.equipmentNuke,
			netMined : user.netMined,
			netStolen : user.netStolen,
			netCityDamage : user.netCityDamage,
			netMilitaryDamage : user.netMilitaryDamage,
			netMine: user.netMine,
			netAttack: user.netAttack,
			netRout: user.netRout,
			netFuel : user.netFuel,
			netCloak : user.netCloak,
			netStealth : user.netStealth,
			netJam: user.netJam,
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
		TableName: vwarsTable,
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
		TableName : vwarsTable,
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
  		TableName: vwarsTable,
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
 		TableName: vwarsTable,
  		Item: {
			PK : 'GUILD#' + guild.guildId,
    		SK: 'GUILD#' + guild.guildId
  		},
		ReturnValues: 'ALL_OLD'
	};
	console.log('db put guild - guildId: ' + guild.guildId)
	let result = await ddb.put(params).promise()
	return result
}

async function deleteGuild(guildId) {
	var params = {
		TableName : vwarsTable,
		Key: {
			PK: 'GUILD#' + guildId,
			SK: 'GUILD#' + guildId
		}
	  };
	console.log('db delete guild: ' + guildId)
	let result = await ddb.delete(params).promise()
	return result
}

async function getGuildUser(guildId, userId) {
	let params = {
  		TableName: vwarsTable,
  		Key: {
    		PK: 'GUILD#' + guildId,
			SK: 'USER#' + userId
  		}
	};
	console.log('db get guild user - guildId: ' + guildId + ', userId: ' + userId)
	let result = await ddb.get(params).promise()
	if(result.Item) {
		console.log("Retrieved user object: " + JSON.stringify(result.Item))
		result.Item.guildId = result.Item.PK.replace(/^(GUILD#)/,"");
		result.Item.userId = result.Item.SK.replace(/^(USER#)/,"");
	}
	return result
}

async function putGuildUser(user) {
	var params = {
 		TableName: vwarsTable,
  		Item: {
			PK : 'GUILD#' + user.guildId,
    		SK : 'USER#' + user.userId,
    		username : user.username,
			barHistoricalVibranium : user.barHistoricalVibranium,
			barVibranium : user.barVibranium,
			medalFirst : user.medalFirst,
			medalSecond : user.medalSecond,
			medalThird : user.medalThird,
			titles : user.titles,
			wars: user.wars,
			netMined : user.netMined,
			netStolen : user.netMined,
			netCityDamage : user.netCityDamage,
			netMilitaryDamage : user.newMilitaryDamage,
			netFuel : user.netFuel,
			netCloak : user.netCloak,
			netStealth : user.netStealth,
			netJam : user.netJam,
			netShield : user.netShield,
			netSabotage : user.netSabotage,
			netStrike : user.netStrike,
			netNuke : user.netNuke
  		},
		ReturnValues: 'ALL_OLD'
	};
	console.log('db put guild user - guildId: ' + user.guildId + ',userId: ' + user.userId)
	let result = await ddb.put(params).promise()
	return result
}

async function getGuildUsers(guildId) {
	let params = {
		TableName: vwarsTable,
		KeyConditionExpression: 'PK = :hkey and begins_with(SK, :rkey)',
		ExpressionAttributeValues: {
    		':hkey': 'GUILD#' + guildId,
    		':rkey': 'USER#'
  		}
	};
	console.log('db get guild users - guildId: ' + guildId)
  	let result = await ddb.query(params).promise()
  	result.Items.forEach(function(user) {
		console.log("Retrieved user: " + JSON.stringify(user))
		user.guildId = user.PK.replace(/^(GUILD#)/,"");
		user.userId = user.SK.replace(/^(USER#)/,"");
	});  
	return result
}

async function deleteGuildUser(guildId, userId) {
	var params = {
		TableName : vwarsTable,
		Key: {
			PK: 'GUILD#' + guildId,
			SK: 'USER#' + userId
		}
	  };
	console.log('db delete guild user - guildId: ' + guildId + ', userId: ' + userId)
	let result = await ddb.delete(params).promise()
	return result
}



/**
 * WAR DB OPERATIONS
 * 
 */

async function getWar(guildId, warId) {
	let params = {
  		TableName: vwarsTable,
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
 		TableName: vwarsTable,
  		Item: {
			PK : 'GUILD#' + war.guildId,
    		SK: 'WAR#' + war.warId,
			name: war.name,
			isActive: war.isActive,
			isConcluded: war.isConcluded,
			expiration: war.expiration,
			energyRefreshMinutes: war.energyRefreshMinutes
  		},
		ReturnValues: 'ALL_OLD'
	};
	console.log('db put war - guildId: ' + war.guildId + ', warId: ' + war.warId)
	let result = await ddb.put(params).promise()
	console.log(JSON.stringify('db put war result: ' + result.Item))
	return result
}

async function getWars(guildId) {
	let params = {
		TableName: vwarsTable,
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
		TableName : vwarsTable,
		Key: {
			PK: 'GUILD#' + guildId,
			SK: 'WAR#' + warId
		}
	  };
	console.log('db delete war - guildId: ' + guildId + ', warId: ' + warId)
	let result = await ddb.delete(params).promise()
	return result
}





