/**
 * VWARS DISCORD SLASH COMMAND PROCESSOR
 * 
 */

const db = require('./vwarsDbService.js')
const warService = require('./warService.js')
const queuingService = require('./vwarsQueuingService.js')
const smallPrizeMap = new Map([[1, 0], [2, 1], [3, 2], [4, 5], [5, 10], [6, 15], [7, 16], [8, 20], [9,25]]);
const mediumPrizeMap = new Map([[1, 25], [2, 30], [3, 35], [4, 40], [5, 50], [6, 70], [7, 100], [8, 125], [9,160]]);
const largePrizeMap = new Map([[1, 100], [2, 100], [3, 125], [4, 150], [5, 225], [6, 275], [7, 350], [8, 700], [9, 1200]]);
const maxEnergy = 100
const cloakIntervalMinutes = 480
const stealthIntervalMinutes = 10
const fuelIntervalMinutes = 30
const jamIntervalMinutes = 30
let energyIntervalMinutes = 5
let idleIntervalMinutes = 2880
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
		let timeRemaining = timeRemainingAsCountdown(activeWar.start - currentTime)
		return respondEphemeral('War: ' + activeWar.name + ' begins in ' + timeRemaining)
	}
	console.log('Active war retrieved. warId: ' + activeWar.warId + ', guildId: ' + slashCommand.guildId)
	if(activeWar.energyRefreshMinutes) {
		energyIntervalMinutes = activeWar.energyRefreshMinutes
	}

	// User retrieval and housekeeping
	let userRecord = await db.getUser(activeWar.warId, slashCommand.userId)
	let user = userRecord.Item
	console.log('Retrieved user: ' + JSON.stringify(user))
	let millisElapsed = 0
	if(!user) {
		user = initUser(activeWar.warId, slashCommand)
		await db.putUser(user)
		console.log('User record created for userId ' + user.userId)
		millisElapsed = currentTime - activeWar.start
	} else {
		user = migrateUser(user)
		millisElapsed = currentTime - user.energyUpdatedAt
	}

	//Check for and protect idle users
	let idleIntervalMillis = 1000 * 60 * idleIntervalMinutes
	console.log('millisElapsed: ' + millisElapsed)
	if(millisElapsed > idleIntervalMillis) {
		return await protect(user, millisElapsed)
	} else {
		user = updateEnergy(user)
		user = updateShield(user)
	}

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
	} else if('stealth' === slashCommand.subCommand) {
		return await stealth(user, slashCommand)	
	} else if('jam' === slashCommand.subCommand) {
		return await jam(user, slashCommand)
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
	let channelId = JSON.stringify(slashCommandBody.channel_id).replace(/\"/g, "")
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
		channelId: channelId,
		userId: userId,
		username: username,
		command: command,
		subCommand: subCommand,
		subCommandArgs: subCommandArgs
	  };
	  console.log('Command parsed; guildId: ' + guildId + ', channelId: ' + channelId + ', userId: ' + userId + ', username: ' + username + ', command: ' + command + ', subcommand: ' + subCommand + ', subCommandArgs: ' + subCommandArgs)
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
		return respondAndCheckForCloak(user, 'You do not have enough energy.')
	}

	/**
	 * MIRACLE AND CHAOS ROLLS
	 * Natural daily energy gain: 288 
	 * Maximum daily energy gain if average ore gains are spent on fuel: 470
	 * At 10,000 chaos roll, chance per 100 energy spent of each chaos event is 1 in 100
	 * At 10,000 chaos roll, natural daily chance of each chaos event is 1 in 35
	 * At 10,000 chaos roll, maximum daily chance of each chaos event is 1 in 21
	 */
	let chaosRoll = randomInteger(1, Math.round(5000 * spend))
	if(chaosRoll === 1) {
		user.energy -= spend
		let cityDamage = Math.round(user.city * .10)
		user.city -= cityDamage
		await db.putUser(user)
		return respondAndCheckForCloak(user, 'Your vibranium mine collapsed unexpectedly reducing city size by ' + cityDamage + '!')
	}
	let miracleRoll = randomInteger(1, Math.round(5000 / spend))
	if(miracleRoll === 1) {
		user.energy -= spend
		user.bar += 1
		await db.putUser(user)
		return respondAndCheckForCloak(user, 'You found an abandoned shipping crate containing 1 vibranium bar!')
	}


	// STANDARD ROLL
	let minedOre = 0
	let oreFound = false
	let equipmentFound = 0
	let equipmentMap = new Map([['fuel reserve', 0], ['cloaking device', 0], ['stealth delivery system', 0], ['communications jammer', 0], ['shield generator', 0], ['ballistic missle', 0], ['explosive', 0], ['nuclear warhead', 0]]);
	let rolls = 'rolls: '
	for(let i = 0; i < spend; i++) {
		let roll = randomInteger(1, 1009)
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
		} else if(roll <= 1001) {
			oreFound = true
			minedOre += 4000
		} else {
			equipmentFound += 1
			if(roll <= 1002) {
				user.equipmentFuel += 1
				equipmentMap.set('fuel reserve', equipmentMap.get('fuel reserve') + 1)
			} else if(roll <= 1003) {
				user.equipmentCloak += 1
				equipmentMap.set('cloaking device', equipmentMap.get('cloaking device') + 1)
			} else if(roll <= 1004) {
				user.equipmentShield += 1
				equipmentMap.set('shield generator', equipmentMap.get('shield generator') + 1)
			} else if(roll <= 1005) {
				user.equipmentStrike += 1
				equipmentMap.set('ballistic missle', equipmentMap.get('ballistic missle') + 1)
			} else if(roll <= 1006) {
				user.equipmentSabotage += 1
				equipmentMap.set('explosive', equipmentMap.get('explosive') + 1)
			} else if(roll == 1007) {
				user.equipmentNuke += 1
				equipmentMap.set('nuclear warhead', equipmentMap.get('nuclear warhead') + 1)
			} else if(roll == 1008) {
				user.equipmentJam += 1
				equipmentMap.set('communications jammer', equipmentMap.get('communications jammer') + 1)
			} else if(roll == 1009) {
				user.equipmentStealth += 1
				equipmentMap.set('stealth delivery system', equipmentMap.get('stealth delivery system') + 1)
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
	return respondAndCheckForCloak(user, miningResponse)
}


/**
 * BUILD
 * 
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
		return respondAndCheckForCloak(user, 'You do not have enough energy.')
	}
	if(user.ore < spend) {
		return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
	}

	user.energy -= 1
	user.ore -= spend
	user.city += spend
	await db.putUser(user)
	let response = 'Your city is now size ' + user.city + ', you have ' + user.ore + ' vibranium ore and ' + user.energy + ' energy remaining.'
	return respondAndCheckForCloak(user, response)	
}


/**
 * TRAIN
 * 
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
		return respondAndCheckForCloak(user, 'You do not have enough energy.')
	}
	if(user.ore < spend) {
		return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
	}

	user.energy -= 1
	user.ore -= spend
	user.military += spend
	await db.putUser(user)
	let response = 'Your military is now size ' + user.military + ', you have ' + user.ore + ' vibranium ore and ' + user.energy + ' energy remaining.'
	return respondAndCheckForCloak(user, response)
}


/**
 * ATTACK
 * 
 */
 async function attack(user, slashCommand) {
	let targetUser = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {
		let targetUserId = slashCommand.subCommandArgs[0]
		let targetUserRecord = await db.getUser(activeWar.warId, targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(user.energy < 1) {
		return respondAndCheckForStealth(user, 'You do not have enough energy.', null)
	}
	if(null == targetUser || user.userId == targetUser.userId) {
		return respondAndCheckForStealth(user, 'Invalid target.', null)
	}
	if(isJammed(user.lastJammed)) {
		return respondAndCheckForStealth(user, 'Your radio communications are jammed, you are unable to coordinate attacks at this time.', null)
	}
	let response = user.username
	if(isStealthed(user.lastStealthed)) {
		response = 'Someone '
	}
	if(user.shieldHealth > 0) {
		user.shieldHealth = 0
		response += ' deactivates shield and'
	}
	updateShield(targetUser)

	//Calculate win percentage, rout conditions and chance of rout special scenario
	let conflict = user.military + targetUser.city
	let winPercentage = user.military/conflict * 0.10
	let isRout = false
	let isRoutBar = false
	let isRoutEquipment = false
	let routRoll = 0
	if(winPercentage >= 0.08) {
		isRout = true
		winPercentage += 0.015
		routRoll = randomInteger(1, 100)
		if(isVulnerable(targetUser)) {
			if(routRoll >= 96) {
				isRoutBar = true
			} else if(routRoll >= 1 && routRoll <= 8) {
				isRoutEquipment = true
			}
		}
	}

	//Rout special scenarios logic
	if(isRoutBar && targetUser.shieldHealth <= 0) {
		let shatteredOre = randomInteger(7500, 10000)
		targetUser.bar -= 1
		targetUser.ore += shatteredOre
		targetUser.lastShattered = currentTime
		response += ' routs ' + targetUser.username + '\'s forces destroying a vibranium warehouse! The attack shattered 1 bar into ' + shatteredOre + ' ore.'
	} else if(isRoutEquipment && targetUser.shieldHealth <= 0) {
		let equipmentStolen = null
		if(routRoll === 1) {
			if(targetUser.equipmentFuel > 0) {
				targetUser.equipmentFuel -= 1
				user.equipmentFuel += 1
				equipmentStolen = 'fuel reserve'
			}
		} else if(routRoll === 2) {
			if(targetUser.equipmentCloak > 0) {
				targetUser.equipmentCloak -= 1
				user.equipmentCloak += 1
				equipmentStolen = 'cloaking device'
			}
		} else if(routRoll === 3) {
			if(targetUser.equipmentShield > 0) {
				targetUser.equipmentShield -= 1
				user.equipmentShield += 1
				equipmentStolen = 'shield generator'
			}
		} else if(routRoll === 4) {
			if(targetUser.equipmentJam > 0) {
				targetUser.equipmentJam -= 1
				user.equipmentJam += 1
				equipmentStolen = 'communications jammer'
			}
		} else if(routRoll === 5) {
			if(targetUser.equipmentSabotage > 0) {
				targetUser.equipmentSabotage -= 1
				user.equipmentSabotage += 1
				equipmentStolen = 'explosive'
			}
		} else if(routRoll === 6) {
			if(targetUser.equipmentStrike > 0) {
				targetUser.equipmentStrike -= 1
				user.equipmentStrike += 1
				equipmentStolen = 'ballistic missile'
			}
		} else if(routRoll === 7) {
			if(targetUser.equipmentNuke > 0) {
				targetUser.equipmentNuke -= 1
				user.equipmentNuke += 1
				equipmentStolen = 'nuclear warhead'
			}
		} else if(routRoll === 8) {
			if(targetUser.equipmentStealth > 0) {
				targetUser.equipmentStealth -= 1
				user.equipmentStealth += 1
				equipmentStolen = 'stealth delivery system'
			}
		}

		if(equipmentStolen != null) {
			response += ' routs ' + targetUser.username + '\'s forces capturing a supply truck containing 1 ' + equipmentStolen + '!'
		} else {
			isRoutEquipment = false
		}
	} 
	
	//Basic attack logic
	if((!isRoutBar && !isRoutEquipment) || targetUser.shieldHealth > 0) {

		if(isRoutBar) {
			response += ' routs ' + targetUser.username + '\'s forces attempting to destroy a vibranium warehouse'
		}
		else if(isRoutEquipment) {
			response += ' routs ' + targetUser.username + '\'s forces attempting to capture a supply truck'
		}
		else if(isRout) {
			response += ' routs ' + targetUser.username + '\'s forces'
		} else {
			response += ' attacks ' + targetUser.username
		}

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
	}
		
	user.energy -= 1
	user.netAttack += 1
	if(isRout) {
		user.netRout += 1
	}
	await db.putUser(user)
	await db.putUser(targetUser)
	return await respondAndCheckForStealth(user, response, slashCommand.channelId)
}


/** 
 * HELP
 * 
 */
 async function help() {
	 return respondEphemeral(helpResponse)
}


/**
 * STATS
 * 
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
			return respondAndCheckForCloak(user, 'This player is cloaked.')
		}
		updateEnergy(targetUser)
		updateShield(targetUser)
	}
	let shieldIntegrity = 'None active'
	if(targetUser.shieldHealth > 0) {
		shieldIntegrity = targetUser.shieldHealth + '%'
	}
	let warehouse = 'Unknown'
	if(isVulnerable(targetUser)) {
		warehouse = 'Located'
	} else {
		let invulnerableIntervalMinutes = getInvulnerableIntervalMinutes(targetUser)
		if(invulnerableIntervalMinutes != null) {
			let remainingMillis = (targetUser.lastShattered + (invulnerableIntervalMinutes * 60 * 1000)) - currentTime
			warehouse = 'Location in ' + timeRemainingAsCountdown(remainingMillis)
		}	
	}
	let response = 'Statistics for ' + targetUser.username +
				'\nVibranium bars: ' + targetUser.bar + 
				'\nVibranium ore: ' + targetUser.ore + 
				'\nCity size: ' + targetUser.city + 
				'\nMilitary size: ' + targetUser.military +
				'\nEnergy: ' + targetUser.energy + '/' + maxEnergy +
				'\nShield integrity: ' + shieldIntegrity +
				'\nWarehouse: ' + warehouse +
				'\nEquipment: fuel(' + targetUser.equipmentFuel + 
					'), cloak(' + targetUser.equipmentCloak + 
					'), stealth(' + targetUser.equipmentStealth + 
					'), jam(' + targetUser.equipmentJam + 
					'), shield(' + targetUser.equipmentShield + 
					'), strike(' + targetUser.equipmentStrike + 
					'), sabotage(' + targetUser.equipmentSabotage + 
					'), nuke(' + targetUser.equipmentNuke + ')'
	return respondAndCheckForCloak(user, response)
}


/**
 * LEADERBOARD
 * 
 */
async function leaderboard(user, slashCommand) {
	let responseString = 'Leaderboard'
	responseString += '\nWar: ' + activeWar.name
	let timeRemaining = 'n/a'
	if(activeWar.expiration) {
		timeRemaining = timeRemainingAsCountdown(activeWar.expiration - currentTime)
	}
	responseString += '\nTime remaining: ' + timeRemaining

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
	 return respondAndCheckForCloak(user, responseString)
}

/**
 * SMELT
 * 
 */
 async function smelt(user, slashCommand) {
	if(user.ore < 10000) {
		return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
	}
	user.ore -= 10000
	user.bar += 1

	await db.putUser(user)
	let response = 'You have created a vibranium bar.'
	return respondAndCheckForCloak(user, response)
}


/**
 * BUY
 * 
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
			return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
		}
	} else if('cloak' === item) {
		if(user.ore >= 4000) {
			user.ore -= 4000
			user.equipmentCloak += 1
			itemPurchased = 'cloaking device'
		} else {
			return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
		}	
	} else if('stealth' === item) {
		if(user.ore >= 5000) {
			user.ore -= 5000
			user.equipmentStealth += 1
			itemPurchased = 'stealth delivery system'
		} else {
			return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
		}	
	} else if('jam' === item) {
		if(user.ore >= 5000) {
			user.ore -= 5000
			user.equipmentJam += 1
			itemPurchased = 'communications jammer'
		} else {
			return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
		}
	} else if('shield' === item) {
		if(user.ore >= 4000) {
			user.ore -= 4000
			user.equipmentShield += 1
			itemPurchased = 'shield generator'
		} else {
			return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
		}	
	} else if('sabotage' === item) {
		if(user.ore >= 2500) {
			user.ore -= 2500
			user.equipmentSabotage += 1
			itemPurchased = 'explosive'
		} else {
			return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
		}	
	} else if('strike' === item) {
		if(user.ore >= 2500) {
			user.ore -= 2500
			user.equipmentStrike += 1
			itemPurchased = 'ballistic missle'
		} else {
			return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
		}	
	} else if('nuke' === item) {
		if(user.ore >= 6000) {
			user.ore -= 6000
			user.equipmentNuke += 1
			itemPurchased = 'nuclear warhead'
		} else {
			return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
		}	
	} else {
		return respond('Invalid option.')
	}

	await db.putUser(user)
	let response = 'You have purchased an equipment chest containing one ' + itemPurchased + '.'
	return respondAndCheckForCloak(user, response)
}




/**
 * EQUIPMENT SUBCOMMANDS
 * 
 */


/**
 * FUEL
 * 
 */
async function fuel(user, slashCommand) {

	if(user.equipmentFuel < 1) {
		return respondAndCheckForCloak(user, 'You have no fuel reserves in your inventory.')
	}
	if(isFueled(user.lastFueled)) {
		let remainingMillis = (user.lastFueled + (fuelIntervalMinutes * 60 * 1000)) - currentTime
		return respondAndCheckForCloak(user, 'Fuel reserves are still on cool down. Time remaining: ' + timeRemainingAsCountdown(remainingMillis))
	}

	user.energy += 20
	user.equipmentFuel -= 1
	user.netFuel += 1
	user.lastFueled = currentTime
	await db.putUser(user)
	let response = 'You release fossil fuel reserves granting you 20 energy.'
	return respondAndCheckForCloak(user, response)
}


/** 
 * CLOAK
 * 
 */
async function cloak(user, slashCommand) {
	if(user.equipmentCloak < 1) {
		return respondAndCheckForCloak(user, 'You have no cloaking devices in your inventory.')
	}
	if(isCloaked(user.lastCloaked)) {
		let remainingMillis = (user.lastCloaked + (cloakIntervalMinutes * 60 * 1000)) - currentTime
		return respondAndCheckForCloak(user, 'You are already cloaked. Time remaining: ' + timeRemainingAsCountdown(remainingMillis))
	}
	user.equipmentCloak -= 1
	user.netCloak += 1
	user.lastCloaked = currentTime
	await db.putUser(user)
	return respondEphemeral('You are now cloaked. Your stats and non-offensive movements are hidden from players for the next 8 hours.')
}

 
/**
 * STEALTH
 * 
 */
async function stealth(user, slashCommand) {
	if(user.equipmentStealth < 1) {
		return respondEphemeral('You have no stealth delivery systems in your inventory.')
	}
	if(isStealthed(user.lastStealthed)) {
		let remainingMillis = (user.lastStealthed + (stealthIntervalMinutes * 60 * 1000)) - currentTime
		return respondEphemeral('You already have a stealth delivery system deployed. Time remaining: ' + timeRemainingAsCountdown(remainingMillis))
	}
	user.equipmentStealth -= 1
	user.netStealth += 1
	user.lastStealthed = currentTime
	await db.putUser(user)
	return respondEphemeral('You deploy a stealth delivery system. Your offensive movements are anonymized for the next 10 minutes.')
}


/**
 * JAM
 * 
 */
async function jam(user, slashCommand) {
	let targetUser = null
	if(user.equipmentJam < 1) {
		return respondAndCheckForCloak(user, 'You have no communications jammers in your inventory.')
	}
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {
		let targetUserId = slashCommand.subCommandArgs[0]
		let targetUserRecord = await db.getUser(activeWar.warId, targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(null == targetUser || user.userId == targetUser.userId) {
		return respond('Invalid target.')
	}
	if(isJammed(targetUser.lastJammed)) {
		return respondAndCheckForCloak(user, 'This player\'s communications are already jammed.')
	}

	let response = user.username + ' jams ' + targetUser.username + '\'s communications rendering them unable to attack for the next 30 minutes!'
	user.equipmentJam -= 1
	user.netJam += 1
	targetUser.lastJammed = currentTime
	await db.putUser(user)
	await db.putUser(targetUser)
	return respondAndCheckForCloak(user, response)
}

/** 
 * SHIELD
 * 
 */
async function shield(user, slashCommand) {
	if(user.equipmentShield < 1) {
		return respondAndCheckForCloak(user, 'You have no shield generators in your inventory.')
	}
	let response = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {
		let targetUserId = slashCommand.subCommandArgs[0]
		let targetUserRecord = await db.getUser(activeWar.warId, targetUserId)
		let targetUser = targetUserRecord.Item
		if(null == targetUser) {
			return respond('Invalid target.')
		}
		targetUser = updateShield(targetUser)
		targetUser.shieldHealth += 100
		targetUser.shieldUpdatedAt = currentTime
		user.equipmentShield -= 1
		user.netShield += 1
		await db.putUser(targetUser)
		await db.putUser(user)
		response = user.username + ' shields ' + targetUser.username + ' absorbing incoming damage at the cost of shield integrity. Shield deactivates when integrity reaches 0% or the player makes their next offensive move.'
		if(targetUser.shieldHealth > 100) {
			response = user.username + ' reinforces ' + targetUser.username + '\'s shield increasing shield integrity to ' + targetUser.shieldHealth + '%. Reinforced shields degrade at a rate of 3% per hour for the first reinforced stack, increasing exponentially per each additional stack.'
		}
		return respond(response)
	} else {
		user = updateShield(user)
		user.shieldHealth += 100
		user.shieldUpdatedAt = currentTime
		user.equipmentShield -= 1
		user.netShield += 1
		await db.putUser(user)
		response = 'You activate shields absorbing incoming damage at the cost of shield integrity. Shield deactivates when integrity reaches 0% or you make your next offensive move.'
		if(user.shieldHealth > 100) {
			response = 'You reinforce shield increasing shield integrity to ' + user.shieldHealth + '%. Reinforced shields degrade at a rate of 3% per hour for the first reinforced stack, increasing exponentially per each additional stack.'
		}
		return respondAndCheckForCloak(user, response)
	}

}


/**
 * SABOTAGE
 * 
 */
async function sabotage(user, slashCommand) {
	let targetUser = null
	if(user.equipmentSabotage < 1) {
		return respondAndCheckForStealth(user, 'You have no explosives in your inventory.', null)
	}
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {
		let targetUserId = slashCommand.subCommandArgs[0]
		let targetUserRecord = await db.getUser(activeWar.warId, targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(null == targetUser || user.userId == targetUser.userId) {
		return respondAndCheckForStealth(user, 'Invalid target.', null)
	}
	let response = user.username
	if(isStealthed(user.lastStealthed)) {
		response = "Someone"
	}
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

	return await respondAndCheckForStealth(user, response, slashCommand.channelId)
}


/**
 * STRIKE
 * 
 */
 async function strike(user, slashCommand) {
	let targetUser = null
	if(user.equipmentStrike < 1) {
		return respondAndCheckForStealth(user, 'You have no missles in your inventory.', null)
	}
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {
		let targetUserId = slashCommand.subCommandArgs[0]
		let targetUserRecord = await db.getUser(activeWar.warId, targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(null == targetUser || user.userId == targetUser.userId) {
		return respondAndCheckForStealth(user, 'Invalid target.', null)
	}
	let response = user.username
	if(isStealthed(user.lastStealthed)) {
		response = "Someone"
	}
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
	return await respondAndCheckForStealth(user, response, slashCommand.channelId)
}


/**
 * NUKE
 * 
 */
 async function nuke(user, slashCommand) {
	let targetUser = null
	if(user.equipmentNuke < 1) {
		return respondAndCheckForStealth(user, 'You have no nuclear warheads in your inventory.', null)
	}
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {
		let targetUserId = slashCommand.subCommandArgs[0]
		let targetUserRecord = await db.getUser(activeWar.warId, targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(null == targetUser || user.userId == targetUser.userId) {
		return respondAndCheckForStealth(user, 'Invalid target.', null)
	}
	let response = user.username
	if(isStealthed(user.lastStealthed)) {
		response = "Someone"
	}
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
	return await respondAndCheckForStealth(user, response, slashCommand.channelId)
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
		lastStealthed: 0,
		lastJammed: 0,
		lastShattered: 0,
		equipmentFuel: 0,
		equipmentCloak: 0,
		equipmentStealth: 0,
		equipmentJam: 0,
		equipmentShield: 0,
		equipmentSabotage: 0,
		equipmentStrike: 0,
		equipmentNuke: 0,
		netMined : 0,
		netStolen : 0,
		netCityDamage : 0,
		netMilitaryDamage : 0,
		netMine: 0,
		netAttack: 0,
		netRout: 0,
		netFuel : 0,
		netCloak : 0,
		netStealth: 0,
		netShield : 0,
		netSabotage : 0,
		netStrike : 0,
		netNuke : 0
	};

	return initializedUser
}

function migrateUser(user) {
	if(user.ore === undefined) {
		user.ore = 0
	}
	if(user.bar === undefined) {
		user.bar = 0
	}
	if(user.city === undefined) {
		user.city = 0
	}
	if(user.military === undefined) {
		user.military = 0
	}
	if(user.energy === undefined) {
		user.energy = maxEnergy
	}
	if(user.energyUpdatedAt === undefined) {
		user.energyUpdatedAt = 0
	}
	if(user.shieldUpdatedAt === undefined) {
		user.shieldUpdatedAt = 0
	}
	if(user.shieldHealth === undefined) {
		user.shieldHealth = 0
	}
	if(user.lastFueled === undefined) {
		user.lastFueled = 0
	}
	if(user.lastCloaked === undefined) {
		user.lastCloaked = 0
	}
	if(user.lastStealthed === undefined) {
		user.lastStealthed = 0
	}
	if(user.lastJammed === undefined) {
		user.lastJammed = 0
	}
	if(user.lastShattered === undefined) {
		user.lastShattered = 0
	}
	if(user.equipmentFuel === undefined) {
		user.equipmentFuel = 0
	}
	if(user.equipmentCloak === undefined) {
		user.equipmentCloak = 0
	}
	if(user.equipmentStealth === undefined) {
		user.equipmentStealth = 0
	}
	if(user.equipmentJam === undefined) {
		user.equipmentJam = 0
	}
	if(user.equipmentShield === undefined) {
		user.equipmentShield = 0
	}
	if(user.equipmentSabotage === undefined) {
		user.equipmentSabotage = 0
	}
	if(user.equipmentStrike === undefined) {
		user.equipmentStrike = 0
	}
	if(user.netMined === undefined) {
		user.netMined = 0
	}
	if(user.netStolen === undefined) {
		user.netStolen = 0
	}
	if(user.netCityDamage === undefined) {
		user.netCityDamage = 0
	}
	if(user.netMilitaryDamage === undefined) {
		user.netMilitaryDamage = 0
	}
	if(user.netMine === undefined) {
		user.netMine = 0
	}
	if(user.netAttack === undefined) {
		user.netAttack = 0
	}
	if(user.netRout === undefined) {
		user.netRout = 0
	}
	if(user.netFuel === undefined) {
		user.netFuel = 0
	}
	if(user.netCloak === undefined) {
		user.netCloak = 0
	}
	if(user.netStealth === undefined) {
		user.netStealth = 0
	}
	if(user.netJam === undefined) {
		user.netJam = 0
	}
	if(user.netShield === undefined) {
		user.netShield = 0
	}
	if(user.netSabotage === undefined) {
		user.netSabotage = 0
	}
	if(user.netStrike === undefined) {
		user.netStrike = 0
	}
	if(user.netNuke === undefined) {
		user.netNuke = 0
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
	let elapsedTimeMillis = 0
	let stacks = Math.floor(user.shieldHealth / 101)

	if(stacks > 0) {
		console.log('Reinforced shield identified with ' + stacks + ' stacks.')
		elapsedTimeMillis = currentTime - user.shieldUpdatedAt
		while(stacks > 0) {
			let degredationRate = Math.pow(3, stacks)
			let degradationMillisPerPercent = 1000 * 60 * 60 / degredationRate
			let percentageOverStackBoundary = user.shieldHealth % 100
			if(percentageOverStackBoundary === 0) {
				percentageOverStackBoundary = 100
			}
			let calculatedMillisWithinBoundary = percentageOverStackBoundary * degradationMillisPerPercent
			console.log('degradationRate: ' + degredationRate + ', degradationMillisPerPercent: ' + degradationMillisPerPercent + ', percentageOverStackBoundary: ' + percentageOverStackBoundary + ', calculatedMillisWithinBoundary: ' + calculatedMillisWithinBoundary)
			if(elapsedTimeMillis > calculatedMillisWithinBoundary) {
				elapsedTimeMillis -= calculatedMillisWithinBoundary
				user.shieldHealth -= percentageOverStackBoundary
				stacks -= 1
				if(stacks === 0) {
					elapsedTimeMillis = 0
				}
			} else {
				let realizedDegradationPercent = Math.floor(elapsedTimeMillis / degradationMillisPerPercent)
				user.shieldHealth -= realizedDegradationPercent
				elapsedTimeMillis = elapsedTimeMillis % degradationMillisPerPercent
				break
			}
		}
	}
	
	user.shieldUpdatedAt = currentTime - elapsedTimeMillis
	return user
}

function updateShieldSimple(user) {
	if(user.shieldHealth > 100) {
		let shieldDegredationMillis = 1000 * 3600
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

function respondAndCheckForCloak(user, message) {
	if(isCloaked(user.lastCloaked)) {
		return respondEphemeral(message)
	} else {
		return respond(message)
	}
}

async function respondAndCheckForStealth(user, message, channelId) {
	if(isStealthed(user.lastStealthed)) {
		if(null != channelId) {
			await queuingService.queueMessageTask(channelId, message)
		}
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

function isStealthed(lastStealthed) {
	let stealthIntervalMillis = 1000 * 60 * stealthIntervalMinutes
	console.log("Current time: " + currentTime + ", lastStealthed: " + lastStealthed + ", stealthIntervalMillis: " + stealthIntervalMillis)
	if(currentTime < lastStealthed + stealthIntervalMillis) {
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

function isVulnerable(user) {
	let invulnerableIntervalMinutes = getInvulnerableIntervalMinutes(user)
	if(invulnerableIntervalMinutes === null) {
		return false
	}
	let invulnerableIntervalMillis = 1000 * 60 * invulnerableIntervalMinutes
	console.log("Current time: " + currentTime + ", lastShattered: " + user.lastShattered + ", invulnerableIntervalMillis: " + invulnerableIntervalMillis)
	if(currentTime > user.lastShattered + invulnerableIntervalMillis) {
		return true
	}
	return false
}

function getInvulnerableIntervalMinutes(user) {
	let maxInvulnerableIntervalMinutes = 5760
	let minInvulnerableIntervalMinutes = 720
	let invulnerableIntervalMinutes = 28800 / user.bar
	if(invulnerableIntervalMinutes < minInvulnerableIntervalMinutes) {
		//User has more than 40 bars, adhere to hard max of 2 shattered bars daily
		invulnerableIntervalMinutes = minInvulnerableIntervalMinutes
	} else if(invulnerableIntervalMinutes > maxInvulnerableIntervalMinutes) {
		//User has less than 5 bars, return as invulnerale
		invulnerableIntervalMinutes = null
	}
	return invulnerableIntervalMinutes
}

async function protect(user, millisEllapsed) {
	let dayElapsed = Math.floor(millisEllapsed / 86400000)
	if(dayElapsed > 10) {
		dayElapsed = 10
	}
	user = updateShield(user)
	if(user.shieldHealth < 100) {
		user.shieldHealth = 100
		user.shieldUpdatedAt = currentTime
	}
	user.lastCloaked = currentTime
	let addedFuel = Math.floor(dayElapsed / 2)
	let addedMilitary = dayElapsed * 200
	let addedCity = dayElapsed * 200
	user.equipmentFuel += addedFuel
	user.military += addedMilitary 
	user.city += addedCity
	user = updateEnergy(user)
	await db.putUser(user)
	let response = 'Welcome back to the war! Your forces have regrouped and resupplied while you were away granting you ' + addedFuel + ' fuel reserves, ' + addedMilitary + ' military, ' + addedCity + ' city and an active cloak and shield. Use /vw help to review how to play.'
	return respondAndCheckForCloak(user, response)
}


function timeRemainingAsCountdown(remainingMillis) {
	if(remainingMillis < 1) {
		return 0
	}
	let seconds = Math.floor((remainingMillis / 1000) % 60)
	let minutes = Math.floor((remainingMillis / 1000 / 60) % 60)
	let hours = Math.floor((remainingMillis / 1000 / 60 / 60) % 24)
	let days = Math.floor(remainingMillis / 1000 / 60 / 60 / 24)

	// 00d:00h:12m:10s
	let timeRemaining = ''
	if(days > 0) {
		timeRemaining += (days).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + 'd:'
	}
	if(hours > 0) {
		timeRemaining += (hours).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + 'h:'
	}
	if(minutes > 0) {
		timeRemaining += (minutes).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + 'm:'
	}
	if(seconds > 0) {
		timeRemaining += (seconds).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + 's'
	}	
	console.log(timeRemaining); // 21 
	return timeRemaining
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
  \nAcquire more vibranium bars than your opponents.\
  \n\
  \nHow to play:\
  \nUse /vw mine command to mine for vibranium ore & rare equipment chests.\
  \n\
  \nUse /vw build & /vw train to increase your city & military size.\
  \n\
  \nUse /vw attack to attack & steal a portion of a player\'s ore. The amount stolen is determined by the attacking military & the defending city sizes. An attacking military 4 times larger than the defending city constitutes a rout, awarding 15% more ore. If the opponent\'s warehouse is "located", routs also have a chance to steal equipment & even shatter an opponent\'s bar back into ore.\
  \n\
  \nUse /vw smelt to convert 10,000 ore into a vibranium bar. Bars cannot be stolen.\
  \n\
  \nEquipment chests unlock advanced commands. These can be purchased with ore using /vw buy, or found during mining.\
  \n\Fuel - Gain 20 energy, 30m cool down\
  \n\Cloak - Hide your stats & non-offensive moves from other players for 8h\
  \n\Stealth - Anonymize your offensive moves from other players for 10m\
  \n\Jam - Prevent opponent from using attack command for 30m\
  \n\Shield - Absorb incoming damage until shield integrity reaches 0% or upon your next offensive move. Reinforced shields degrade at a rate of 3% per hour for the first reinforced stack, increasing exponentially per each additional stack\
  \n\Sabotage - Destroy 30% of an opponent\'s city\
  \n\Strike - Destroy 30% of an opponent\'s military\
  \n\Nuke - Destroy 40% of an opponent\'s city & military\
  \n\
  \nUse /vw leaderboard to check this war\'s standings & /vw stats for individual player info.\
  \nEnergy regens 1 per every 5m.\
  \n\
  \n\End game: \
  \n\Use /vw hall to view the historical leaderboard for this server\'s Vibranium Wars players (COMING SOON).\
  \n\
  \nCreator & developer:\
  \nGeneral Ronimus\
  \n\
  \nGame design:\
  \nPlayBoyPK\
  \n```\
  '