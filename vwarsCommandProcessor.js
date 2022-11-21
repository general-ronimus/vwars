/**
 * VWARS DISCORD SLASH COMMAND PROCESSOR
 * 
 */

const db = require('./vwarsDbService.js')
const warService = require('./warService.js')
const smallPrizeMap = new Map([[1, 0], [2, 1], [3, 2], [4, 5], [5, 10], [6, 15], [7, 16], [8, 20], [9,25]]);
const mediumPrizeMap = new Map([[1, 25], [2, 30], [3, 35], [4, 40], [5, 50], [6, 70], [7, 100], [8, 125], [9,160]]);
const largePrizeMap = new Map([[1, 100], [2, 100], [3, 125], [4, 150], [5, 225], [6, 275], [7, 350], [8, 700], [9, 1200]]);
const maxEnergy = 100
const cloakIntervalMinutes = 480
const fuelIntervalMinutes = 30
const jamIntervalMinutes = 30
let energyIntervalMinutes = 5
let currentTime = null
let activeWar = null

module.exports ={
        process
    }


async function process(slashCommandBody) {
	currentTime = Date.now()
	let slashCommand = parseSlashCommand(slashCommandBody)
	if('help' === slashCommand.subCommand) {
		return await help()
	}

	// War retrieval and housekeeping
	activeWar = await warService.getActiveWar(slashCommand.guildId, currentTime)
	if(!activeWar) {
		return respondEphemeral('There is no active war for this server.')
	} else if(activeWar.start && activeWar.start > currentTime) {
		let startDate = new Date(activeWar.start).toUTCString()
		return respondEphemeral('War ' + activeWar.iteration + ' begins ' + startDate)
	}
	console.log('Active war retrieved. warId: ' + activeWar.warId + ', guildId: ' + slashCommand.guildId)
	if(activeWar.energyRefreshMinutes) {
		energyIntervalMinutes = activeWar.energyRefreshMinutes
	}

	// User retrieval and housekeeping
	let userRecord = await db.getUser(activeWar.warId, slashCommand.userId)
	let user = userRecord.Item
	console.log('Retrieved user: ' + JSON.stringify(user))
	if(!user) {
		user = initUser(activeWar.warId, slashCommand)
		await db.putUser(user)
		console.log('User record created for userId ' + user.userId)
	} else {
		user = migrateUser(user)
	}
	user = updateEnergy(user)
	user = updateShield(user)

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
	} else if('smelt' === slashCommand.subCommand) {
		return await smelt(user, slashCommand)
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
 * MINE
 * 
 */
async function mine(user, slashCommand) {
	let spend = 1
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0) {
		if(!isNumeric(slashCommand.subCommandArgs[0]) || slashCommand.subCommandArgs[0] < 0) {
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
	let equipmentMap = new Map([['fuel reserve', 0], ['cloaking device', 0], ['communications jammer', 0], ['shield generator', 0], ['ballistic missle', 0], ['explosive', 0], ['nuclear warhead', 0]]);
	let rolls = 'rolls: '
	for(let i = 0; i < spend; i++) {
		let roll = randomInteger(1, 1008)
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
			} else if(roll == 1007) {
				user.equipmentJam += 1
				equipmentMap.set('communications jammer', equipmentMap.get('communications jammer') + 1)
			} else if(roll == 1008) {
				oreFound = true
				minedOre += 4000
			}
		}
	}
	console.log(rolls)
	user.energy -= spend
	user.ore += minedOre
	user.netMined += minedOre
	await db.putUser(user)

	//Form vibranium found response
	let miningResponse = 'You found '
	if(oreFound) {
		miningResponse += minedOre + ' vibranium ore'
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
 * BUILD
 */
async function build(user, slashCommand) {
	let spend = 1
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0) {
		if(!isNumeric(slashCommand.subCommandArgs[0]) || slashCommand.subCommandArgs[0] < 0) {
			return respond('Missing or improperly formatted argument.')
		}
		spend = parseInt(slashCommand.subCommandArgs[0])
	}
	if(user.energy < 1) {
		return respondForUser(user, 'You do not have enough energy.')
	}
	if(user.ore < spend) {
		return respondForUser(user, 'You do not have enough vibranium ore.')
	}

	user.energy -= 1
	user.ore -= spend
	user.city += spend
	await db.putUser(user)
	let response = 'Your city is now size ' + user.city + ', you have ' + user.ore + ' vibranium ore and ' + user.energy + ' energy remaining.'
	return respondForUser(user, response)	
}


/**
 * TRAIN
 */
 async function train(user, slashCommand) {
	let spend = 1
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0) {
		if(!isNumeric(slashCommand.subCommandArgs[0]) || slashCommand.subCommandArgs[0] < 0) {
			return respond('Missing or improperly formatted argument.')
		}
		spend = parseInt(slashCommand.subCommandArgs[0])
	}
	if(user.energy < 1) {
		return respondForUser(user, 'You do not have enough energy.')
	}
	if(user.ore < spend) {
		return respondForUser(user, 'You do not have enough vibranium ore.')
	}

	user.energy -= 1
	user.ore -= spend
	user.military += spend
	await db.putUser(user)
	let response = 'Your military is now size ' + user.military + ', you have ' + user.ore + ' vibranium ore and ' + user.energy + ' energy remaining.'
	return respondForUser(user, response)
}


/**
 * ATTACK
 */
 async function attack(user, slashCommand) {
	let targetUser = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {
		let targetUserId = slashCommand.subCommandArgs[0]
		let targetUserRecord = await db.getUser(activeWar.warId, targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(user.energy < 1) {
		return respond('You do not have enough energy.')
	}
	if(null == targetUser || user.userId == targetUser.userId) {
		return respond('Invalid target.')
	}
	if(isJammed(user.lastJammed)) {
		return respond('Your communications are jammed, you are unable to make offensive moves at this time.')
	}
	let response = user.username
	if(user.shieldHealth > 0) {
		user.shieldHealth = 0
		response += ' deactives shield and'
	}

	let conflict = user.military + targetUser.city
	let winPercentage = user.military/conflict * 0.10
	response += ' attacks ' + targetUser.username
	updateShield(targetUser)
	if(targetUser.shieldHealth > 0) {
		response += ' however the defender\'s shield absorbs the damage!'
		targetUser.shieldHealth -= Math.round(100 * winPercentage)
		if(targetUser.shieldHealth <= 0) {
			targetUser.shieldHealth = 0
			response += ' Their shield is now deactived.'
		} else {
			response += ' Their shield integrity is now at ' + targetUser.shieldHealth + '%.'
		}
	} else {
		let stolenOre = Math.round(targetUser.ore * winPercentage)
		targetUser.ore -= stolenOre
		user.ore += stolenOre
		user.netStolen += stolenOre
		response += ' stealing ' + stolenOre + ' vibranium ore!'
	}

	user.energy -= 1
	await db.putUser(user)
	await db.putUser(targetUser)
	return respond(response)
}


/** 
 * HELP
 */
 async function help() {
	 return respondEphemeral(helpResponse)
}


/**
 * STATS
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
		updateEnergy(targetUser)
		updateShield(targetUser)
	}
	let shieldIntegrity = 'None active'
	if(targetUser.shieldHealth > 0) {
		shieldIntegrity = targetUser.shieldHealth + '%'
	}
	let response = 'Statistics for ' + targetUser.username +
				'\nVibranium bars: ' + targetUser.bar + 
				'\nVibranium ore: ' + targetUser.ore + 
				'\nCity size: ' + targetUser.city + 
				'\nMilitary size: ' + targetUser.military +
				'\nEnergy: ' + targetUser.energy + '/' + maxEnergy +
				'\nShield integrity: ' + shieldIntegrity +
				'\nEquipment: fuel(' + targetUser.equipmentFuel + 
					'), cloak(' + targetUser.equipmentCloak + 
					'), jam(' + targetUser.equipmentJam + 
					'), shield(' + targetUser.equipmentShield + 
					'), strike(' + targetUser.equipmentStrike + 
					'), sabotage(' + targetUser.equipmentSabotage + 
					'), nuke(' + targetUser.equipmentNuke + ')'
	return respondForUser(user, response)
}


/**
 * LEADERBOARD
 */
async function leaderboard(user, slashCommand) {
	let responseString = 'Leaderboard'
	responseString += '\nWar: ' + activeWar.name
	let expirationDate = 'n/a'
	if(activeWar.expiration) {
		expirationDate = new Date(activeWar.expiration).toUTCString()
	}
	responseString += '\nExpires: ' + expirationDate

	let retrievedUsers = await db.getUsers(activeWar.warId)
	//retrieve, cloak, sort and form leaderboard response
	retrievedUsers.Items.forEach(function(user) {
		if(isCloaked(user.lastCloaked)) {
			user.bar = '??'
			user.ore = '??'
		}
	})
	retrievedUsers.Items.sort(compare)
	retrievedUsers.Items.forEach(function(user) {
		let barText = ' bar'
		if(user.bar > 1) {
			barText += 's'
		}
		responseString = responseString += '\n' + user.username + ': ' + user.bar + barText + ', ' + user.ore + ' ore'
	 });
	 console.log(responseString)
	 return respondForUser(user, responseString)
}

/**
 * SMELT
 */
 async function smelt(user, slashCommand) {
	if(user.ore < 10000) {
		return respondForUser(user, 'You do not have enough vibranium ore.')
	}
	user.ore -= 10000
	user.bar += 1

	await db.putUser(user)
	let response = 'You have created a vibranium bar.'
	return respondForUser(user, response)
}


/**
 * BUY
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
			return respondForUser(user, 'You do not have enough vibranium ore.')
		}
	} else if('cloak' === item) {
		if(user.ore >= 4000) {
			user.ore -= 4000
			user.equipmentCloak += 1
			itemPurchased = 'cloaking device'
		} else {
			return respondForUser(user, 'You do not have enough vibranium ore.')
		}	
	} else if('jam' === item) {
		if(user.ore >= 5000) {
			user.ore -= 5000
			user.equipmentJam += 1
			itemPurchased = 'communications jammer'
		} else {
			return respondForUser(user, 'You do not have enough vibranium ore.')
		}
	} else if('shield' === item) {
		if(user.ore >= 5000) {
			user.ore -= 5000
			user.equipmentShield += 1
			itemPurchased = 'shield generator'
		} else {
			return respondForUser(user, 'You do not have enough vibranium ore.')
		}	
	} else if('sabotage' === item) {
		if(user.ore >= 3000) {
			user.ore -= 3000
			user.equipmentSabotage += 1
			itemPurchased = 'explosive'
		} else {
			return respondForUser(user, 'You do not have enough vibranium ore.')
		}	
	} else if('strike' === item) {
		if(user.ore >= 3000) {
			user.ore -= 3000
			user.equipmentStrike += 1
			itemPurchased = 'ballistic missle'
		} else {
			return respondForUser(user, 'You do not have enough vibranium ore.')
		}	
	} else if('nuke' === item) {
		if(user.ore >= 7000) {
			user.ore -= 7000
			user.equipmentNuke += 1
			itemPurchased = 'nuclear warhead'
		} else {
			return respondForUser(user, 'You do not have enough vibranium ore.')
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
 * FUEL
 */
async function fuel(user, slashCommand) {

	if(user.equipmentFuel < 1) {
		return respondForUser(user, 'You have no fuel reserves in your inventory.')
	}
	if(isFueled(user.lastFueled)) {
		return respondForUser(user, 'Fuel reserves are still on cool down.')
	}

	user.energy += 20
	user.equipmentFuel -= 1
	user.netFuel += 1
	user.lastFueled = currentTime
	await db.putUser(user)
	let response = 'You release fossil fuel reserves granting you 20 energy.'
	return respondForUser(user, response)
}


/** 
 * CLOAK
 */
async function cloak(user, slashCommand) {
	if(user.equipmentCloak < 1) {
		return respondForUser(user, 'You have no cloaking devices in your inventory.')
	}
	if(isCloaked(user.lastCloaked)) {
		return respondForUser(user, 'You are already cloaked.')
	}
	user.equipmentCloak -= 1
	user.netCloak += 1
	user.lastCloaked = currentTime
	await db.putUser(user)
	return respondEphemeral('You are now cloaked. Your stats and non-offensive movements are hidden from players for the next 8 hours.')
}

/**
 * JAM
 * 
 */
async function jam(user, slashCommand) {
	let targetUser = null
	if(user.equipmentJam < 1) {
		return respondForUser(user, 'You have no communications jammers in your inventory.')
	}
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {
		let targetUserId = slashCommand.subCommandArgs[0]
		let targetUserRecord = await db.getUser(activeWar.warId, targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(null == targetUser || user.userId == targetUser.userId) {
		return respond('Invalid target.')
	}
	let response = user.username + ' jams ' + targetUser.username + '\'s forward communications preventing offensive moves for the next 30 minutes!'
	user.equipmentJam -= 1
	user.netJam += 1
	targetUser.lastJammed = currentTime
	await db.putUser(user)
	await db.putUser(targetUser)
	return respondForUser(user, response)
}

/** 
 * SHIELD
 */
async function shield(user, slashCommand) {
	if(user.equipmentShield < 1) {
		return respondForUser(user, 'You have no shield generators in your inventory.')
	}
	user = updateShield(user)
	user.shieldHealth += 100
	user.shieldUpdatedAt = currentTime
	user.equipmentShield -= 1
	user.netShield += 1
	await db.putUser(user)
	let response = 'You activate shields able to absorb incoming damage at the cost of shield integrity. Shield deactivates when integrity reaches 0% or you make your next offensive move.'
	if(user.shieldHealth > 100) {
		response = 'You reinforce shields, bringing shield integrity to ' + user.shieldHealth + '%. Reinforced shields degrade slowly over time.'
	}

	return respondForUser(user, response)
}


/**
 * SABOTAGE
 */
async function sabotage(user, slashCommand) {
	let targetUser = null
	if(user.equipmentSabotage < 1) {
		return respond('You have no explosives in your inventory.')
	}
	if(isJammed(user.lastJammed)) {
		return respond('Your communications are jammed, you are unable to make offensive moves at this time.')
	}
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {
		let targetUserId = slashCommand.subCommandArgs[0]
		let targetUserRecord = await db.getUser(activeWar.warId, targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(null == targetUser || user.userId == targetUser.userId) {
		return respond('Invalid target.')
	}
	let response = user.username
	if(user.shieldHealth > 0) {
		user.shieldHealth = 0
		response += ' deactives shield and'
	}

	//calculate damage dealt
	response += ' sabotages ' + targetUser.username
	targetUser = updateShield(targetUser) 
	if(targetUser.shieldHealth > 0) {
		response += ' however the defender\'s shield absorbs the damage!'
		targetUser.shieldHealth -= 30
		if(targetUser.shieldHealth <= 0) {
			targetUser.shieldHealth = 0
			response += ' Their shield is now deactived.'
		} else {
			response += ' Their shield integrity is now at ' + targetUser.shieldHealth + '%.'
		}
	} else {
		let cityDamage = Math.round(targetUser.city * .30)
		targetUser.city -= cityDamage
		user.netCityDamage += cityDamage
		response += ' reducing city size by ' + cityDamage + '!'
	}

	user.equipmentSabotage -= 1
	user.netSabotage += 1
	await db.putUser(user)
	await db.putUser(targetUser)
	return respond(response)
}


/**
 * STRIKE
 * 
 */
 async function strike(user, slashCommand) {
	let targetUser = null
	if(user.equipmentStrike < 1) {
		return respond('You have no missles in your inventory.')
	}
	if(isJammed(user.lastJammed)) {
		return respond('Your communications are jammed, you are unable to make offensive moves at this time.')
	}
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {
		let targetUserId = slashCommand.subCommandArgs[0]
		let targetUserRecord = await db.getUser(activeWar.warId, targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(null == targetUser || user.userId == targetUser.userId) {
		return respond('Invalid target.')
	}
	let response = user.username
	if(user.shieldHealth > 0) {
		user.shieldHealth = 0
		response += ' deactives shield and'
	}

	//calculate damage dealt
	response += ' launches a missle strike on ' + targetUser.username
	targetUser = updateShield(targetUser)  
	if(targetUser.shieldHealth > 0) {
		response += ' however the defender\'s shield absorbs the damage!'
		targetUser.shieldHealth -= 30
		if(targetUser.shieldHealth <= 0) {
			targetUser.shieldHealth = 0
			response += ' Their shield is now deactived.'
		} else {
			response += ' Their shield integrity is now at ' + targetUser.shieldHealth + '%.'
		}
	} else {
		let militaryDamage = Math.round(targetUser.military * .30)
		targetUser.military -= militaryDamage
		user.netMilitaryDamage += militaryDamage
		response += ' reducing military size by ' + militaryDamage + '!'
	}

	user.equipmentStrike -= 1
	user.netStrike += 1
	await db.putUser(user)
	await db.putUser(targetUser)
	return respond(response)
}


/**
 * NUKE
 * 
 */
 async function nuke(user, slashCommand) {
	let targetUser = null
	if(user.equipmentNuke < 1) {
		return respond('You have no nuclear warheads in your inventory.')
	}
	if(isJammed(user.lastJammed)) {
		return respond('Your communications are jammed, you are unable to make offensive moves at this time.')
	}
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {
		let targetUserId = slashCommand.subCommandArgs[0]
		let targetUserRecord = await db.getUser(activeWar.warId, targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(null == targetUser || user.userId == targetUser.userId) {
		return respond('Invalid target.')
	}
	let response = user.username
	if(user.shieldHealth > 0) {
		user.shieldHealth = 0
		response += ' deactives shield and'
	}

	//calculate damage dealt
	response += ' launches a nuclear strike on ' + targetUser.username 
	targetUser = updateShield(targetUser) 
	if(targetUser.shieldHealth > 0) {
		response += ' however the defender\'s shield absorbs the damage!'
		targetUser.shieldHealth -= 80
		if(targetUser.shieldHealth <= 0) {
			targetUser.shieldHealth = 0
			response += ' Their shield is now deactived.'
		} else {
			response += ' Their shield integrity is now at ' + targetUser.shieldHealth + '%.'
		}
	} else {
		let militaryDamage = Math.round(targetUser.military * .40)
		let cityDamage = Math.round(targetUser.city * .40)
		targetUser.city -= cityDamage
		targetUser.military -= militaryDamage
		user.netCityDamage += cityDamage
		user.netMilitaryDamage += militaryDamage
		response += ' reducing military size by ' + militaryDamage + ' and city size by ' + cityDamage + '!'
	}

	user.equipmentNuke -= 1
	user.netNuke += 1
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
		bar: 0,
		city: 1,
		military: 1,
		energy: maxEnergy,
		energyUpdatedAt: currentTime,
		shieldUpdatedAt: currentTime,
		shieldHealth: 0,
		lastFueled: 0,
		lastCloaked: 0,
		lastJammed: 0,
		equipmentFuel: 0,
		equipmentCloak: 0,
		equipmentJam: 0,
		equipmentShield: 0,
		equipmentSabotage: 0,
		equipmentStrike: 0,
		equipmentNuke: 0,
		netMined : 0,
		netStolen : 0,
		netCityDamage : 0,
		netMilitaryDamage : 0,
		netFuel : 0,
		netCloak : 0,
		netShield : 0,
		netSabotage : 0,
		netStrike : 0,
		netNuke : 0
	};

	return initializedUser
}

function migrateUser(user) {
	//TODO: Add jam to migration
	if(!user.lastFueled) {
		user.lastFueled = 0
	}
	return user
}

function updateEnergy(user) {
	let energyIntervalMillis = 1000 * 60 * energyIntervalMinutes
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

function updateShield(user) {
	if(user.shieldHealth > 100) {
		let shieldDegredationMillis = 1000 * 900
		if(currentTime > user.shieldUpdatedAt + shieldDegredationMillis) {
			let timePassed = currentTime - user.shieldUpdatedAt
			let shieldDegradation = Math.floor(timePassed / shieldDegredationMillis)
			let timeRemainder = timePassed % shieldDegredationMillis
			user.shieldHealth -= shieldDegradation
			if(user.shieldHealth <= 100) {
				user.shieldHealth = 100
			}
			user.shieldUpdatedAt = currentTime - timeRemainder
		} 
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

function isJammed(lastJammed) {
	let jamIntervalMillis = 1000 * 60 * jamIntervalMinutes
	console.log("Current time: " + currentTime + ", lastJammed: " + lastJammed + ", jamIntervalMillis: " + jamIntervalMillis)
	if(currentTime < lastJammed + jamIntervalMillis) {
		return true
	}
	return false
}

function compare( a, b ) {
	if ( a.bar === '??' || a.bar < b.bar ){ 
		return 1;
	}
	if ( b.bar === '??' || a.bar > b.bar ){
		return -1;
	}

	if ( a.ore === '??' || a.ore < b.ore ){ 
		return 1;
	}
	if ( b.ore === '??' || a.ore > b.ore ){
	  	return -1;
	}
	return 0;
  }

  const helpResponse = '```Welcome to Vibranium Wars!\
  \nObjective:\
  \nAcquire more vibranium bars than your competitors.\
  \n\
  \nHow to play:\
  \nUse /vw mine command to mine for vibranium ore and rare chances of equipment chests.\
  \n\
  \nUse /vw build and /vw train to build up your city or train up your military. A strong city better protects your ore from attackers. A strong military allows you to steal more ore from defenders.\
  \n\
  \nUse /vw attack to attack and steal a portion of a player’s ore.\
  \n\
  \nUse /vw smelt to convert ore to vibranium bars. 1 bar costs 10,000 ore and cannot be stolen via attack command.\
  \n\
  \nEquipment chests unlock advanced commands. These can be purchased with ore using /vw buy, or found during mining.\
  \n\Fuel - gain 20 energy, 30 minute cool down. 100 max energy limit still applies\
  \n\Cloak - hide your stats and non-offensive moves from other players\
  \n\Shield - absorb incoming damage at the cost shield integrity. Shield deactivates once integrity reaches 0% or upon your next offenseive move \
  \n\Sabotage - destroy 30% of an opponent\'s city\
  \n\Strike - destroy 30% of an opponent\'s military\
  \n\Nuke - destroy 40% of an opponent\'s city & military\
  \n\
  \nUse /vw leaderboard to check this war\'s standings and /vw stats for individual player information.\
  \nEnergy refresh rate is 1 per every 5 minutes.\
  \n\
  \n\End game: \
  \n\At the conclusion of the war, ore, cities and militaries are also converted (at the same rate as smelting) and added to your total vibranium bar count. Those with the most vibranium bars win the war.\
  \n\Medals and bonus vibranium bars are bestowed upon the winners. These rewards are permanent and persist between individual wars.\
  \n\Use /vw hall to view the historical leaderboard for this server\'s Vibranium Wars players (COMING SOON).\
  \n\
  \nCreator and developer:\
  \nGeneral Ronimus\
  \n\
  \nGame design:\
  \nPlayBoyPK\
  \n```\
  '