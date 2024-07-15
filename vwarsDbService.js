const AWS = require("aws-sdk");
const { migrateGuildUser } = require("./userService");

module.exports ={
        getUser, putUser, getUsers, deleteUser, getGuild, putGuild, deleteGuild, getGuildUser, putGuildUser, getGuildUsers, deleteGuildUser, getWar, putWar, getWars, deleteWar,
		getGlobalUser, putGlobalUser, deleteGlobalUser
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
			structFuelDepot : user.structFuelDepot,
			structResearchFacility : user.structResearchFacility,
			structReinforcedHangar : user.structReinforcedHangar,
			structCommsArray : user.structCommsArray,
			structNavalBase : user.structNavalBase,
			structMunitionsDepot : user.structMunitionsDepot,
			structSupercapacitors : user.structSupercapacitors,
			structNuclearSilo : user.structNuclearSilo,
			structAEWCHangar: user.structAEWCHangar,
			structEMPTower : user.structEMPTower,
			structArmoredVehicleDepot : user.structArmoredVehicleDepot,
			structCommandCenter : user.structCommandCenter,
			netMined : user.netMined,
			netStolen : user.netStolen,
			netCityDamage : user.netCityDamage,
			netMilitaryDamage : user.netMilitaryDamage,
			netAttack: user.netAttack,
			netRout: user.netRout,
			netShatter: user.netShatter,
			netEquipmentSteal: user.netEquipmentSteal,
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
	await ddb.put(params).promise()
	return true
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
	await ddb.put(params).promise()
	return true
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
			netStolen : user.netStolen,
			netCityDamage : user.netCityDamage,
			netMilitaryDamage : user.netMilitaryDamage,
			netAttack: user.netAttack,
			netRout: user.netRout,
			netShatter: user.netShatter,
			netEquipmentSteal: user.netEquipmentSteal,
			netFuel : user.netFuel,
			netCloak : user.netCloak,
			netStealth : user.netStealth,
			netJam : user.netJam,
			netShield : user.netShield,
			netSabotage : user.netSabotage,
			netStrike : user.netStrike,
			netNuke : user.netNuke,
			population : user.population,
			structFuelDepot : user.structFuelDepot,
			structResearchFacility : user.structResearchFacility,
			structReinforcedHangar : user.structReinforcedHangar,
			structCommsArray : user.structCommsArray,
			structNavalBase : user.structNavalBase,
			structMunitionsDepot : user.structMunitionsDepot,
			structSupercapacitors : user.structSupercapacitors,
			structNuclearSilo : user.structNuclearSilo,
			structAEWCHangar: user.structAEWCHangar,
			structEMPTower : user.structEMPTower,
			structArmoredVehicleDepot : user.structArmoredVehicleDepot,
			structCommandCenter : user.structCommandCenter
  		},
		ReturnValues: 'ALL_OLD'
	};
	console.log('db put guild user - guildId: ' + user.guildId + ',userId: ' + user.userId)
	await ddb.put(params).promise()
	return true
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
 * GLOBAL USER DB OPERATIONS
 * 
 */

async function getGlobalUser(userId) {
	let params = {
  		TableName: vwarsTable,
  		Key: {
    		PK: 'USER#' + userId,
			SK: 'USER#' + userId
  		}
	};
	console.log('db get global user - userId: ' + userId)
	let result = await ddb.get(params).promise()
	if(result.Item) {
		console.log("Retrieved global user object: " + JSON.stringify(result.Item))
		result.Item.userId = result.Item.SK.replace(/^(USER#)/,"");
	}
	return result
}

async function putGlobalUser(user) {
	var params = {
 		TableName: vwarsTable,
  		Item: {
			PK : 'USER#' + user.userId,
    		SK : 'USER#' + user.userId,
    		username : user.username,
    		energy : user.energy,
			energyUpdatedAt : user.energyUpdatedAt,
			medalFirst : user.medalFirst,
			medalSecond : user.medalSecond,
			medalThird : user.medalThird,
			titles : user.titles,
			wars: user.wars,
			netMined : user.netMined,
			netStolen : user.netStolen,
			netCityDamage : user.netCityDamage,
			netMilitaryDamage : user.netMilitaryDamage,
			netAttack: user.netAttack,
			netRout: user.netRout,
			netShatter: user.netShatter,
			netEquipmentSteal: user.netEquipmentSteal,
			netFuel : user.netFuel,
			netCloak : user.netCloak,
			netStealth : user.netStealth,
			netJam : user.netJam,
			netShield : user.netShield,
			netSabotage : user.netSabotage,
			netStrike : user.netStrike,
			netNuke : user.netNuke,
			population : user.population,
			activeStructs : user.activeStructs,
			structFuelDepot : user.structFuelDepot,
			structResearchFacility : user.structResearchFacility,
			structReinforcedHangar : user.structReinforcedHangar,
			structCommsArray : user.structCommsArray,
			structNavalBase : user.structNavalBase,
			structMunitionsDepot : user.structMunitionsDepot,
			structSupercapacitors : user.structSupercapacitors,
			structNuclearSilo : user.structNuclearSilo,
			structAEWCHangar: user.structAEWCHangar,
			structEMPTower : user.structEMPTower,
			structArmoredVehicleDepot : user.structArmoredVehicleDepot,
			structCommandCenter : user.structCommandCenter,
			oreVibranium : user.oreVibranium,
			netMinedVibranium : user.netMinedVibranium,
			barVibranium : user.barVibranium,
			barHistoricalVibranium : user.barHistoricalVibranium,
			coinVibranium : user.coinVibranium
  		},
		ReturnValues: 'ALL_OLD'
	};
	console.log('db put global user - userId: ' + user.userId)
	await ddb.put(params).promise()
	return true
}

async function deleteGlobalUser(userId) {
	var params = {
		TableName : vwarsTable,
		Key: {
			PK: 'WORLD#' + worldId,
			SK: 'USER#' + userId
		}
	  };
	console.log('db delete user - worldId: ' + worldId + ', userId: ' + userId)
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
			start: war.start,
			expiration: war.expiration,
			energyRefreshMinutes: war.energyRefreshMinutes,
			speed: war.speed,
			isPreRelease: war.isPreRelease
  		},
		ReturnValues: 'ALL_OLD'
	};
	console.log('db put war - guildId: ' + war.guildId + ', warId: ' + war.warId)
	await ddb.put(params).promise()
	return true
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
	await ddb.delete(params).promise()
	return true
}







