/**
 * VWARS DISCORD SLASH COMMAND PROCESSOR
 * 
 */

const db = require('./vwarsDbService.js')
const warService = require('./warService.js')

const smallPrizeMap = new Map([[1, 0], [2, 0], [3, 0], [4, 1], [5, 1], [6, 2], [7, 3], [8, 4], [9,5]]);
const mediumPrizeMap = new Map([[1, 10], [2, 15], [3, 20], [4, 25], [5, 30], [6, 40], [7, 50], [8, 60], [9,75]]);
const largePrizeMap = new Map([[1, 100], [2, 125], [3, 150], [4, 200], [5, 300], [6, 400], [7, 500], [8, 1000], [9, 2000]]);
const maxEnergy = 100
const energyIntervalMinutes = 10 / 1000 //TODO: Remove 1/1000 after beta
const cloakIntervalMinutes = 720 / 10 //TODO: Remove 1/10 reduction after beta
const shieldIntervalMinutes = 720 / 10 //TODO: Remove 1/10 reduction after beta
const fuelIntervalMinutes = 720 / 10 //TODO: Remove 1/10 reduction after beta
let currentTime = null
let activeWar = null

module.exports ={
        process
    }


async function process(slashCommandBody) {
	currentTime = Date.now()
	let slashCommand = parseSlashCommand(slashCommandBody)

	let warsExist = await warService.warsExist(slashCommand.guildId)
	if(!warsExist) {
		await warService.createDefaultActiveWar(slashCommand.guildId)
	}
	activeWar = await warService.getActiveWar(slashCommand.guildId)
	if(!activeWar) {
		respond('There is no active war for this server.')
	}
	console.log('Active war retrieved. warId: ' + activeWar.warId + ', guildId: ' + slashCommand.guildId)

	let userRecord = await db.getUser(activeWar.warId, slashCommand.userId)
	let user = userRecord.Item
	console.log('Retrieved user: ' + JSON.stringify(user))
	if(!user) {
		user = initUser(activeWar.warId, slashCommand)
		await db.putUser(user)
		console.log('User record created for userId ' + user.userId)
	}
	user = updateEnergy(user)

	if('mine' === slashCommand.subCommand) {
		return await mine(user, slashCommand)
	} else if('build' === slashCommand.subCommand) {
		return await build(user, slashCommand)
	} else if('train' === slashCommand.subCommand) {
		return await train(user, slashCommand)
	} else if('attack' === slashCommand.subCommand) {
		return await attack(user, slashCommand)
	} else if('fuel' === slashCommand.subCommand) {
		return await fuel(user, slashCommand)
	} else if('cloak' === slashCommand.subCommand) {
		return await cloak(user, slashCommand)
	} else if('shield' === slashCommand.subCommand) {
		return await shield(user, slashCommand)
	} else if('sabotage' === slashCommand.subCommand) {
		return await sabotage(user, slashCommand)
	} else if('strike' === slashCommand.subCommand) {
		return await strike(user, slashCommand)
	} else if('nuke' === slashCommand.subCommand) {
		return await nuke(user, slashCommand)
	} else if('buy' === slashCommand.subCommand) {
		return await buy(user, slashCommand)
	} else if('stats' === slashCommand.subCommand) {
		return await stats(user, slashCommand)
	} else if('leaderboard' === slashCommand.subCommand) {
		return await leaderboard(user, slashCommand)
	}
	return respond('Invalid command')
}

function parseSlashCommand(slashCommandBody) {
	console.log('Slash command body: ' + JSON.stringify(slashCommandBody))
	let guildId = JSON.stringify(slashCommandBody.guild_id).replace(/\"/g, "")
	let userId = JSON.stringify(slashCommandBody.member.user.id).replace(/\"/g, "")
	let username = JSON.stringify(slashCommandBody.member.user.username).replace(/\"/g, "")
	let command = JSON.stringify(slashCommandBody.data.name).replace(/\"/g, "");
	let subCommand = JSON.stringify(slashCommandBody.data.options[0].name).replace(/\"/g, "");
	let subCommandArgs = [];
	if(slashCommandBody.data.options[0].hasOwnProperty('options') && slashCommandBody.data.options[0].options.length > 0) {
		for (let i = 0; i < slashCommandBody.data.options[0].options.length; i++) {
			subCommandArgs.push(JSON.stringify(slashCommandBody.data.options[0].options[i].value).replace(/\"|@|<|>|!/g, ""))
		}
	}
	let slashCommand = {
		guildId: guildId,
		userId: userId,
		username: username,
		command: command,
		subCommand: subCommand,
		subCommandArgs: subCommandArgs
	  };
	  console.log('Command parsed; guildId: ' + guildId + ', userId: ' + userId + ', username: ' + username + ', command: ' + command + ', subcommand: ' + subCommand + ', subCommandArgs: ' + subCommandArgs)
	  return slashCommand
}




/**
 * BASIC SUBCOMMANDS
 * 
 */
 

/**
 * mine [x]
 * spend x energy for x chances at vibranium and rare equipment chests
 */
async function mine(user, slashCommand) {
	let spend = 1
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0) {
		if(!isNumeric(slashCommand.subCommandArgs[0])) {
			respond('Improperly formatted argument.')
		}
		spend = parseInt(slashCommand.subCommandArgs[0])
	}
	if(user.energy < spend) {
		return respondForUser(user, 'You do not have enough energy.')
	}

	let minedOre = 0
	let oreFound = false
	let equipmentFound = 0
	let equipmentMap = new Map([['fuel reserve', 0], ['cloaking device', 0], ['shield generator', 0], ['ballistic missle', 0], ['explosive', 0], ['nuclear warhead', 0]]);
	let rolls = 'rolls: '
	for(let i = 0; i < spend; i++) {
		let roll = randomInteger(1, 1006)
		console.log('Roll: ' + roll)
		rolls += roll + ' '
		if(roll <= 750) {
			oreFound = true
			minedOre += smallPrizeMap.get(randomInteger(1,9))
		} else if(roll <= 900) {
			oreFound = true
			minedOre += mediumPrizeMap.get(randomInteger(1,9))
		} else if(roll <= 1000) {
			oreFound = true
			minedOre += largePrizeMap.get(randomInteger(1,9))
		} else {
			equipmentFound += 1
			if(roll <= 1001) {
				user.equipmentFuel += 1
				equipmentMap.set('fuel reserve', equipmentMap.get('fuel reserve') + 1)
			} else if(roll <= 1002) {
				user.equipmentCloak += 1
				equipmentMap.set('cloaking device', equipmentMap.get('cloaking device') + 1)
			} else if(roll <= 1003) {
				user.equipmentShield += 1
				equipmentMap.set('shield generator', equipmentMap.get('shield generator') + 1)
			} else if(roll <= 1004) {
				user.equipmentStrike += 1
				equipmentMap.set('ballistic missle', equipmentMap.get('ballistic missle') + 1)
			} else if(roll <= 1005) {
				user.equipmentSabotage += 1
				equipmentMap.set('explosive', equipmentMap.get('explosive') + 1)
			} else if(roll == 1006) {
				user.equipmentNuke += 1
				equipmentMap.set('nuclear warhead', equipmentMap.get('nuclear warhead') + 1)
			}
		}
	}
	console.log(rolls)
	user.energy -= spend
	user.ore += minedOre
	await db.putUser(user)

	//Form vibranium found response
	let miningResponse = 'You found '
	if(oreFound) {
		miningResponse += minedOre + ' vibranium'
		if(equipmentFound > 0) {
			miningResponse += ' and '
		}
	}

	//Append equipment found response
	if(equipmentFound > 0) {
		miningResponse += 'an equipment chest containing'
		let equipmentIter = 0
		equipmentMap.forEach(function(value, key) {
			if(value > 0) {
				equipmentIter += value
				if(value == 1) {
					miningResponse += ' ' + value + ' ' + key
				} else if(value > 1) {
					miningResponse += ' ' + value + ' ' + key + 's'
				}
				if(equipmentIter < equipmentFound) {
					miningResponse += ','
				}
			}
		})
	}
	let lastCommaIndex = miningResponse.lastIndexOf(',')
	if(lastCommaIndex > 0) {
		miningResponse = miningResponse.substring(0, lastCommaIndex) + ' and' + miningResponse.substring(lastCommaIndex + 1)
	}
	miningResponse += '!'
	return respondForUser(user, miningResponse)
}


/**
 * build [x]
 * spend energy to convert x vibranium to x city size
 */
async function build(user, slashCommand) {
	let spend = 1
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0) {
		if(!isNumeric(slashCommand.subCommandArgs[0])) {
			return respond('Missing or improperly formatted argument.')
		}
		spend = parseInt(slashCommand.subCommandArgs[0])
	}
	if(user.energy < 1) {
		return respondForUser(user, 'You do not have enough energy.')
	}
	if(user.ore < spend) {
		return respondForUser(user, 'You do not have enough vibranium.')
	}

	user.energy -= 1
	user.ore -= spend
	user.city += spend
	await db.putUser(user)
	let response = 'Your city is now size ' + user.city + ', you have ' + user.ore + ' vibranium and ' + user.energy + ' energy remaining.'
	return respondForUser(user, response)	
}


/**
 * train [x]
 * spend energy to convert x vibranium to x military size
 */
 async function train(user, slashCommand) {
	let spend = 1
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0) {
		if(!isNumeric(slashCommand.subCommandArgs[0])) {
			return respond('Missing or improperly formatted argument.')
		}
		spend = parseInt(slashCommand.subCommandArgs[0])
	}
	if(user.energy < 1) {
		return respondForUser(user, 'You do not have enough energy.')
	}
	if(user.ore < spend) {
		return respondForUser(user, 'You do not have enough vibranium.')
	}

	user.energy -= 1
	user.ore -= spend
	user.military += spend
	await db.putUser(user)
	let response = 'Your military is now size ' + user.military + ', you have ' + user.ore + ' vibranium and ' + user.energy + ' energy remaining.'
	return respondForUser(user, response)
}


/**
 * attack [player]
 * spend energy to attack [player], gain up to 10% of their vibranium
 */
 async function attack(user, slashCommand) {
	let targetUser = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {
		let targetUserId = slashCommand.subCommandArgs[0]
		let targetUserRecord = await db.getUser(activeWar.warId, targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(null == targetUser) {
		return respond('Invalid target.')
	}
	let response = user.username
	if(isShielded(user.lastShielded)) {
		user.lastShielded = 0
		response += ' deactives shield and'
	}

	let conflict = user.military + targetUser.city
	let winPercentage = user.military/conflict * 0.10
	let stolenOre = Math.round(targetUser.ore * winPercentage)
	response += ' attacks ' + targetUser.username + ' stealing ' + stolenOre + ' vibranium! '
	if(isShielded(targetUser.lastShielded)) {
		stolenOre = Math.round(stolenOre * .10)
		response += targetUser.username + '\'s shield absorbs the attack reducing vibranium stolen to ' + stolenOre + '.'
	}
	targetUser.ore -= stolenOre
	user.ore += stolenOre
	user.energy -= 1
	await db.putUser(user)
	await db.putUser(targetUser)
	return respond(response)
}


/** 
 * help
 */


/**
 * stats [player]
 * display stats for [player] for the active theatre. Total vibranium, city size, military size, inventory, current place
 */
 async function stats(user, slashCommand) {
	let targetUser = user
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {

		let targetUserId = slashCommand.subCommandArgs[0]
		let targetUserRecord = await db.getUser(activeWar.warId, targetUserId)
		targetUser = targetUserRecord.Item
		if(null == targetUser) {
			return respond('Invalid target.')
		}
		if(isCloaked(targetUser.lastCloaked)) {
			return respondForUser(user, 'This player is cloaked.')
		}
	}
	let response = 'Statistics for ' + targetUser.username +
				'\nTotal Vibranium: ' + targetUser.ore + 
				'\nCity size: ' + targetUser.city + 
				'\nMilitary size: ' + targetUser.military +
				'\nEnergy: ' + targetUser.energy + '/' + maxEnergy +
				'\nActive shield: ' + isShielded(targetUser.lastShielded) +
				'\nEquipment: fuel(' + targetUser.equipmentFuel + 
					'), cloak(' + targetUser.equipmentCloak + 
					'), shield(' + targetUser.equipmentShield + 
					'), strike(' + targetUser.equipmentStrike + 
					'), sabotage(' + targetUser.equipmentSabotage + 
					'), nuke(' + targetUser.equipmentNuke + ')'
	return respondForUser(user, response)
}


/**
 * leaderboard
 */
async function leaderboard(user, slashCommand) {
	let responseString = 'Vibranium Wars Leaderboard'
	let retrievedUsers = await db.getUsers(activeWar.warId)
	//retrieve, cloak, sort and form leaderboard response
	retrievedUsers.Items.forEach(function(user) {
		if(isCloaked(user.lastCloaked)) {
			user.ore = '??'
		}
	})
	retrievedUsers.Items.sort(compare)
	retrievedUsers.Items.forEach(function(user) {
		responseString = responseString += '\n' + user.username + ': ' + user.ore
	 });
	 console.log(responseString)
	 return respondForUser(user, responseString)
}


/**
 * buy
 * purchase equipment at the cost of vibranium
 */
 async function buy(user, slashCommand) {

	let item = null
	let itemPurchased = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0) {
		item = slashCommand.subCommandArgs[0]
	}
	console.log("User " + user.username + " purchase item: " + item)

	if('fuel' === item) {
		if(user.ore >= 2000) {
			user.ore -= 2000
			user.equipmentFuel += 1
			itemPurchased = 'fuel reserve'
		} else {
			return respondForUser(user, 'You do not have enough vibranium.')
		}
	} else if('cloak' === item) {
		if(user.ore >= 2000) {
			user.ore -= 2000
			user.equipmentCloak += 1
			itemPurchased = 'cloaking device'
		} else {
			return respondForUser(user, 'You do not have enough vibranium.')
		}	
	} else if('shield' === item) {
		if(user.ore >= 4000) {
			user.ore -= 4000
			user.equipmentShield += 1
			itemPurchased = 'shield generator'
		} else {
			return respondForUser(user, 'You do not have enough vibranium.')
		}	
	} else if('sabotage' === item) {
		if(user.ore >= 4000) {
			user.ore -= 4000
			user.equipmentSabotage += 1
			itemPurchased = 'explosive'
		} else {
			return respondForUser(user, 'You do not have enough vibranium.')
		}	
	} else if('strike' === item) {
		if(user.ore >= 4000) {
			user.ore -= 4000
			user.equipmentStrike += 1
			itemPurchased = 'ballistic missle'
		} else {
			return respondForUser(user, 'You do not have enough vibranium.')
		}	
	} else if('nuke' === item) {
		if(user.ore >= 6000) {
			user.ore -= 6000
			user.equipmentNuke += 1
			itemPurchased = 'nuclear warhead'
		} else {
			return respondForUser(user, 'You do not have enough vibranium.')
		}	
	} else {
		return respond('Invalid option.')
	}

	await db.putUser(user)
	let response = 'You have purchased an equipment chest containing one ' + itemPurchased + '.'
	return respondForUser(user, response)
}




/**
 * EQUIPMENT SUBCOMMANDS
 * 
 */


/**
 * fuel
 * increase energy refresh speeds
 */
async function fuel(user, slashCommand) {

	if(user.equipmentFuel < 1) {
		return respondForUser(user, 'You have no fuel reserves in your inventory.')
	}
	if(isFueled(user.lastFueled)) {
		return respondForUser(user, 'You already have fueled reserves released.')
	}
	user.equipmentFuel -= 1
	user.lastFueled = currentTime
	await db.putUser(user)
	let response = 'You release fossil fuel reserves boosting supply chains. Energy refreshes 30% faster for the next 12 hours.'
	return respondForUser(user, response)
}


/** 
 * cloak
 * hide your activity and stats from other players
 */
async function cloak(user, slashCommand) {
	if(user.equipmentCloak < 1) {
		return respondForUser(user, 'You have no cloaking devices in your inventory.')
	}
	if(isCloaked(user.lastCloaked)) {
		return respondForUser(user, 'You are already cloaked.')
	}
	user.equipmentCloak -= 1
	user.lastCloaked = currentTime
	await db.putUser(user)
	return respondEphemeral('You are now cloaked. Players will be unable to see your stats for 12 hours.')
}


/** 
 * shield
 * absorb incoming damage from attacks and equipment strikes
 */
async function shield(user, slashCommand) {
	if(user.equipmentShield < 1) {
		return respondForUser(user, 'You have no shield generators in your inventory.')
	}
	if(isShielded(user.lastShielded)) {
		return respondForUser(user, 'You already have shields active.')
	}
	user.equipmentShield -= 1
	user.lastShielded = currentTime
	await db.putUser(user)
	let response = 'You activate shields able to absorb 90% of incoming damage from attacks and equipment strikes for 12 hours or until your next offensive move.'
	return respondForUser(user, response)
}


/**
 * sabotage [player]
 * reduce [player] city by 25%
 */
async function sabotage(user, slashCommand) {
	let targetUser = null
	if(user.equipmentSabotage < 1) {
		return respond('You have no explosives in your inventory.')
	}
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {
		let targetUserId = slashCommand.subCommandArgs[0]
		let targetUserRecord = await db.getUser(activeWar.warId, targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(null == targetUser) {
		return respond('Invalid target.')
	}
	let response = user.username
	if(isShielded(user.lastShielded)) {
		user.lastShielded = 0
		response += ' deactives shield and'
	}

	//calculate damage dealt
	let cityDamage = Math.round(targetUser.city * .25)
	if(isShielded(targetUser.lastShielded)) {
		cityDamage = Math.round(cityDamage * .10)
		response += ' sabotages ' + targetUser.username + '! ' + targetUser.username + '\'s shield absorbs most of the damage reducing city losses to ' + cityDamage + '.'
	} else {
		response += ' sabotages ' + targetUser.username + ' reducing city size by ' + cityDamage + '!'
	}
	targetUser.city -= cityDamage
	user.equipmentSabotage -= 1
	await db.putUser(user)
	await db.putUser(targetUser)
	return respond(response)
}


/**
 * strike [player]
 * reduce [player] military by 25%
 */
 async function strike(user, slashCommand) {
	let targetUser = null
	if(user.equipmentStrike < 1) {
		return respond('You have no missles in your inventory.')
	}
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {
		let targetUserId = slashCommand.subCommandArgs[0]
		let targetUserRecord = await db.getUser(activeWar.warId, targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(null == targetUser) {
		return respond('Invalid target.')
	}
	let response = user.username
	if(isShielded(user.lastShielded)) {
		user.lastShielded = 0
		response += ' deactives shield and'
	}

	//calculate damage dealt
	let militaryDamage = Math.round(targetUser.military * .25)
	if(isShielded(targetUser.lastShielded)) {
		militaryDamage = Math.round(militaryDamage * .10)
		response += ' launches a missle strike on ' + targetUser.username + '! ' + targetUser.username + '\'s shield absorbs most of the damage reducing military losses to ' + militaryDamage + '.'
	} else {
		response += ' launches a missle strike on ' + targetUser.username + ' reducing military size by ' + militaryDamage + '!'
	}
	targetUser.military -= militaryDamage
	user.equipmentStrike -= 1
	await db.putUser(user)
	await db.putUser(targetUser)
	return respond(response)
}


/**
 * nuke [player]
 * reduce [player] city and military by 50%
 */
 async function nuke(user, slashCommand) {
	let targetUser = null
	if(user.equipmentNuke < 1) {
		return respond('You have no nuclear warheads in your inventory.')
	}
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {
		let targetUserId = slashCommand.subCommandArgs[0]
		let targetUserRecord = await db.getUser(activeWar.warId, targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(null == targetUser) {
		return respond('Invalid target.')
	}
	let response = user.username
	if(isShielded(user.lastShielded)) {
		user.lastShielded = 0
		response += ' deactives shield and'
	}

	//calculate damage dealt
	let militaryDamage = Math.round(targetUser.military * .50)
	let cityDamage = Math.round(targetUser.city * .50)
	if(isShielded(targetUser.lastShielded)) {
		militaryDamage = Math.round(militaryDamage * .10)
		response += ' launches a nuclear strike on ' + targetUser.username + '! ' + targetUser.username + '\'s shield absorbs most of the damage reducing military losses to ' + militaryDamage + ', and city losses to ' + cityDamage + '.'
	} else {
		response += ' launches a nuclear strike on ' + targetUser.username + ' reducing military size by ' + militaryDamage + ' and city size by ' + cityDamage + '!'
	}
	targetUser.city -= cityDamage
	targetUser.military -= militaryDamage
	user.equipmentNuke -= 1
	await db.putUser(user)
	await db.putUser(targetUser)
	return respond(response)
}




/**
 * HELPER FUNCTIONS
 * 
 */

function initUser(warId, slashCommand) {
	console.log('Initializing new user for warId: ' + warId + ', userId: ' + slashCommand.userId + ", username: " + slashCommand.username)
	let initializedUser = {
		warId: warId,
		userId: slashCommand.userId,
		username: slashCommand.username,
		ore: 1,
		city: 1,
		military: 1,
		equipmentFuel: 0,
		equipmentCloak: 0,
		equipmentShield: 0,
		equipmentSabotage: 0,
		equipmentStrike: 0,
		equipmentNuke: 0,
		lastCloaked: 0,
		lastShielded: 0,
		lastFueled: 0,
		energy: maxEnergy,
		energyUpdatedAt: currentTime
	};

	return initializedUser
}

function updateEnergy(user) {
	let energyIntervalMillis = 1000 * 60 * energyIntervalMinutes
	if(user.isFueled) {
		energyIntervalMillis = energyIntervalMillis * .66
	}
	if(currentTime > user.energyUpdatedAt + energyIntervalMillis) {
		let timePassed = currentTime - user.energyUpdatedAt
		let energyGain = Math.floor(timePassed / energyIntervalMillis)
		let timeRemainder = timePassed % energyIntervalMillis
		if(user.energy + energyGain > maxEnergy) {
			user.energy = maxEnergy
		} else {
			user.energy = user.energy + energyGain
		}
		user.energyUpdatedAt = currentTime - timeRemainder
	} 
	return user
}

function respondForUser(user, message) {
	if(isCloaked(user.lastCloaked)) {
		return respondEphemeral(message)
	} else {
		return respond(message)
	}
}

function respond(message) {
	return respondWithFlags(message, null)
}

function respondEphemeral(message) {
	return respondWithFlags(message, 64)
}

function respondWithFlags(message, flags) {
	let responseBody = {type: 4, data: {content: message}}
	if(flags) {
		responseBody = {type: 4, data: {content: message, flags: flags}}
	}
	const response = {
        	statusCode: 200,
        	body: JSON.stringify(responseBody),
    	};
  return response    	
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isNumeric(value) {
    return /^\d+$/.test(value);
}

function isFueled(lastFueled) {
	let fuelIntervalMillis = 1000 * 60 * fuelIntervalMinutes
	console.log("Current time: " + currentTime + ", lastFueled: " + lastFueled + ", fuelIntervalMillis: " + fuelIntervalMillis)
	if(currentTime < lastFueled + fuelIntervalMillis) {
		return true
	}
	return false
}

function isCloaked(lastCloaked) {
	let cloakIntervalMillis = 1000 * 60 * cloakIntervalMinutes
	console.log("Current time: " + currentTime + ", lastCloaked: " + lastCloaked + ", cloakIntervalMillis: " + cloakIntervalMillis)
	if(currentTime < lastCloaked + cloakIntervalMillis) {
		return true
	}
	return false
}

function isShielded(lastShielded) {
	let shieldIntervalMillis = 1000 * 60 * shieldIntervalMinutes
	console.log("Current time: " + currentTime + ", lastShielded: " + lastShielded + ", shieldIntervalMillis: " + shieldIntervalMillis)
	if(currentTime < lastShielded + shieldIntervalMillis) {
		return true
	}
	return false
}

function compare( a, b ) {
	if ( a.ore < b.ore ){ 
	  return 1;
	}
	if ( a.ore > b.ore ){
	  return -1;
	}
	return 0;
  }
  


