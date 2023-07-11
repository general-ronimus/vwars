/**
 * VWARS DISCORD SLASH COMMAND PROCESSOR
 * 
 */

const db = require('./vwarsDbService.js')
const userService = require('./userService.js')
const warService = require('./warService.js')
const queuingService = require('./vwarsQueuingService.js')
const smallPrizeMap = new Map([[1, 0], [2, 1], [3, 2], [4, 5], [5, 10], [6, 15], [7, 16], [8, 20], [9,25]]);
const mediumPrizeMap = new Map([[1, 25], [2, 30], [3, 35], [4, 40], [5, 50], [6, 70], [7, 100], [8, 125], [9,160]]);
const largePrizeMap = new Map([[1, 100], [2, 100], [3, 125], [4, 150], [5, 225], [6, 275], [7, 350], [8, 700], [9, 1200]]);
const maxEnergy = 100
const cloakIntervalMinutes = 480
const stealthIntervalMinutes = 20
const fuelIntervalMinutes = 30
const jamIntervalMinutes = 20
let energyIntervalMinutes = 5
let idleIntervalMinutes = 2880
let currentTime = null
let activeWar = null

module.exports ={
        processCommand
    }


async function processCommand(slashCommandBody) {
	currentTime = Date.now()
	let slashCommand = parseSlashCommand(slashCommandBody)
	if('help' === slashCommand.subCommand) {
		return await help()
	} else if('hall' === slashCommand.subCommand) {
		return await hall(slashCommand)
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
		user = userService.initUser(activeWar.warId, slashCommand, currentTime, maxEnergy)
		await db.putUser(user)
		console.log('User record created for userId ' + user.userId)
		millisElapsed = currentTime - activeWar.start
	} else {
		user = userService.migrateUser(user)
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
	let chaosRoll = randomInteger(1, Math.round(50 * spend))
	if(chaosRoll === 1) {
		user.energy -= spend
		let cityDamage = Math.round(user.city * .10 * (spend / 100))
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
	let equipmentMap = new Map([['fuel reserve', 0], ['cloaking device', 0], ['stealth UAV', 0], ['communications jammer', 0], ['shield generator', 0], ['ballistic missle', 0], ['explosive', 0], ['nuclear warhead', 0]]);
	let rolls = 'rolls: '
	for(let i = 0; i < spend; i++) {
		let roll = randomInteger(1, 1209)
		console.log('Roll: ' + roll)
		rolls += roll + ' '
		if(roll <= 900) {
			oreFound = true
			minedOre += smallPrizeMap.get(randomInteger(1,9))
		} else if(roll <= 1080) {
			oreFound = true
			minedOre += mediumPrizeMap.get(randomInteger(1,9))
		} else if(roll <= 1200) {
			oreFound = true
			minedOre += largePrizeMap.get(randomInteger(1,9))
		} else if(roll <= 1201) {
			oreFound = true
			minedOre += 4000
		} else {
			equipmentFound += 1
			if(roll <= 1202) {
				user.equipmentFuel += 1
				equipmentMap.set('fuel reserve', equipmentMap.get('fuel reserve') + 1)
			} else if(roll <= 1203) {
				user.equipmentCloak += 1
				equipmentMap.set('cloaking device', equipmentMap.get('cloaking device') + 1)
			} else if(roll <= 1204) {
				user.equipmentShield += 1
				equipmentMap.set('shield generator', equipmentMap.get('shield generator') + 1)
			} else if(roll <= 1205) {
				user.equipmentStrike += 1
				equipmentMap.set('ballistic missle', equipmentMap.get('ballistic missle') + 1)
			} else if(roll <= 1206) {
				user.equipmentSabotage += 1
				equipmentMap.set('explosive', equipmentMap.get('explosive') + 1)
			} else if(roll == 1207) {
				user.equipmentNuke += 1
				equipmentMap.set('nuclear warhead', equipmentMap.get('nuclear warhead') + 1)
			} else if(roll == 1208) {
				user.equipmentJam += 1
				equipmentMap.set('communications jammer', equipmentMap.get('communications jammer') + 1)
			} else if(roll == 1209) {
				user.equipmentStealth += 1
				equipmentMap.set('stealth UAV', equipmentMap.get('stealth UAV') + 1)
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
			if(routRoll >= 11 && routRoll <= 18 ) {
				isRoutBar = true
			} else if(routRoll >= 1 && routRoll <= 8) {
				isRoutEquipment = true
			}
		}
	}

	//Rout special scenarios logic
	if(isRoutBar && targetUser.shieldHealth <= 0) {
		let shatteredOre = randomInteger(8500, 12000)
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
				equipmentStolen = 'stealth UAV'
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
		userService.migrateUser(targetUser)
	}
	let shieldIntegrity = 'None active'
	if(targetUser.shieldHealth > 0) {
		shieldIntegrity = targetUser.shieldHealth + '%'
	}
	let warehouse = 'Unknown'
	if(isVulnerable(targetUser)) {
		warehouse = 'Location known'
	} else {
		let invulnerableIntervalMinutes = getInvulnerableIntervalMinutes(targetUser)
		if(invulnerableIntervalMinutes != null) {
			let remainingMillis = (targetUser.lastShattered + (invulnerableIntervalMinutes * 60 * 1000)) - currentTime
			warehouse = 'Location in ' + timeRemainingAsCountdown(remainingMillis)
		}	
	}

	let response = '```Situational Report\n'
	response += 'Player: ' + targetUser.username + 
		'\n💠: ' + targetUser.bar +
		'\n🪨: ' + targetUser.ore +
		'\nCity: ' + targetUser.city +
		'\nMilitary: ' + targetUser.military +
		'\nEnergy: ' + targetUser.energy + '/' + maxEnergy +
		'\nShield integrity: ' + shieldIntegrity +
		'\nWarehouse: ' + warehouse +
		'\nEquipment' +
		'\n| fuel|  cloak|  stealth| shield|' +
		'\n|' + targetUser.equipmentFuel.toString().padStart(3) + '/5|'+ targetUser.equipmentCloak.toString().padStart(5) + '/5|'+ targetUser.equipmentStealth.toString().padStart(7) + '/5|'+ targetUser.equipmentShield.toString().padStart(5) + '/5|' +
		'\n|  jam| strike| sabotage|   nuke|' +
		'\n|' + targetUser.equipmentJam.toString().padStart(3) + '/5|'+ targetUser.equipmentStrike.toString().padStart(5) + '/5|'+ targetUser.equipmentSabotage.toString().padStart(7) + '/5|'+ targetUser.equipmentNuke.toString().padStart(5) + '/5|' +
		'```'

	return respondAndCheckForCloak(user, response)
}


/**
 * LEADERBOARD
 * 
 */
async function leaderboard(user, slashCommand) {
	let responseString = '```Leaderboard'
	responseString += '\nWar: ' + activeWar.name
	let timeRemaining = 'n/a'
	if(activeWar.expiration) {
		timeRemaining = timeRemainingAsCountdown(activeWar.expiration - currentTime)
	}
	responseString += '\nTime remaining: ' + timeRemaining
	responseString += '\n💠 - Vibranium bars\n🪨 - Vibranium ore'

	let retrievedUsers = await db.getUsers(activeWar.warId)
	if(retrievedUsers.Items.length > 0) {
		// Obfuscate cloaked players
		retrievedUsers.Items.forEach(function(user) {
			if(isCloaked(user.lastCloaked)) {
				user.bar = '??'
				user.ore = '??'
			}
		})

		// Calculate the maximum length for each column
		let longestBars = 1
        let longestOre = 1
        retrievedUsers.Items.forEach(user => {
            if (user.bar.toString().length > longestBars) longestBars = user.bar.toString().length;
            if (user.ore.toString().length > longestOre) longestOre = user.ore.toString().length;
        });

        // Generate table data
        retrievedUsers.Items.sort(compare).forEach(user => {
            responseString += `\n|${user.bar.toString().padStart(longestBars)}💠|${user.ore.toString().padStart(longestOre)}🪨|${user.username}`;
        });
    }

	 responseString += '```'
	 return respondAndCheckForCloak(user, responseString)
}


/**
 * Hall
 * 
 */
async function hall(slashCommand) {

	let responseString = '```Hall of Legends'
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {

		let targetUserId = slashCommand.subCommandArgs[0]
		let targetUserRecord = await db.getGuildUser(slashCommand.guildId, targetUserId)
		let guildUser = targetUserRecord.Item
		if(null == guildUser) {
			return respond('Invalid user.')
		}
		responseString += '\nPlayer: ' + guildUser.username
		let medalColumnLength = 4
		responseString += '\nAccolades\n| ' + (guildUser.medalFirst || 0).toString().padStart(medalColumnLength) + '🥇| ' + (guildUser.medalSecond || 0).toString().padStart(medalColumnLength) + '🥈| ' + (guildUser.medalThird || 0).toString().padStart(medalColumnLength) + '🥉| ' + (guildUser.medalStar || 0).toString().padStart(medalColumnLength) + '🎖|'
		responseString += '\n💠(total earned): ' + guildUser.barHistoricalVibranium
		responseString += '\nWars fought: ' + guildUser.wars

		responseString += '\n\nStatistics'
		responseString += '\nBuildings burned: ' + guildUser.netCityDamage
		responseString += '\nTroops destroyed: ' + guildUser.netMilitaryDamage
		responseString += '\nOre mined: ' + guildUser.netMined
		responseString += '\nOre stolen: ' + guildUser.netStolen
		responseString += '\nBarrels of fuel used: ' + guildUser.netFuel
		responseString += '\nCloaking devices activated: ' + guildUser.netCloak
		responseString += '\nStealth missions completed: ' + guildUser.netStealth
		responseString += '\nRadio communications jammed: ' + guildUser.netJam
		responseString += '\nShield generators engaged: ' + guildUser.netShield
		responseString += '\nBallistic missiles launched: ' + guildUser.netStrike
		responseString += '\nExplosives detonated: ' + guildUser.netSabotage
		responseString += '\nNukes launched: ' + guildUser.netNuke

		responseString += '\n\nCapital city'
		responseString += '\nPopulation: ' + guildUser.population
		responseString += '\nFuel depot: ' + guildUser.structFuelDepot + '/5'
		responseString += '\nReinforced hangar: ' + guildUser.structReinforcedHangar + '/5'
		responseString += '\nResearch facility: ' + guildUser.structResearchFacility + '/5'
		responseString += '\nComms array: ' + guildUser.structCommsArray + '/5'
		responseString += '\nNaval base: ' + guildUser.structNavalBase + '/5'
		responseString += '\nMunitions depot: ' + guildUser.structMunitionsDepot + '/5'
		responseString += '\nSupercapicitors: ' + guildUser.structSupercapacitors + '/5'
		responseString += '\nNuclear silo: ' + guildUser.structNuclearSilo + '/5     '

		responseString += '\n\nResources'
		let resourceColumnLength = 10
		let countColumnLength = 7
		responseString += '\n|' + 'Material'.padStart(resourceColumnLength) + '|' + 'Ore'.padStart(countColumnLength) + '|' + 'Bars'.padStart(countColumnLength) + '|'
		responseString += '\n|' + '-'.repeat(resourceColumnLength) + '|' + '-'.repeat(countColumnLength) + '|' + '-'.repeat(countColumnLength) + '|'
		//Future full set of materials let resourceNames = ['vibranium','uranium', 'beryllium', 'gold', 'silver', 'tungsten', 'titanium', 'cobalt', 'copper', 'lead', 'iron', 'aluminum'];
		let resourceNames = ['vibranium','uranium','gold', 'lead', 'iron', 'aluminum'];
		for(let resource of resourceNames) {
    		let oreField = 'ore' + resource.charAt(0).toUpperCase() + resource.slice(1);
    		let barField = 'bar' + resource.charAt(0).toUpperCase() + resource.slice(1);
    		responseString += '\n|' + resource.padStart(resourceColumnLength) + '|' + (guildUser[oreField] || 0).toString().padStart(countColumnLength) + '|' + (guildUser[barField] || 0).toString().padStart(countColumnLength) + '|';
		}

	} else {		
		responseString += '\n1 - First place medals 🥇\n2 - Second place medals 🥈\n3 - Third place medals 🥉\nBar - 💠 (total earned)\nWar - Wars fought'
		let retrievedGuildUsers = await db.getGuildUsers(slashCommand.guildId)
		let playerColumnWidth = 15
		let medalColumnWidth = 2
		let barColumnWidth = 5
		let warColumnWidth = 3
		if(retrievedGuildUsers.Items.length > 0) {
			responseString += '\n|Player         | 1| 2| 3|  Bar|War|'
			responseString += '\n|----------------------------------|'
			retrievedGuildUsers.Items.sort(compareGuildUser).forEach(guildUser => {
				responseString += `\n|${(guildUser.username.substring(0, playerColumnWidth).padStart(playerColumnWidth) || 0)}|${(guildUser.medalFirst.toString().padStart(medalColumnWidth) || 0)}|${(guildUser.medalSecond.toString().padStart(medalColumnWidth) || 0)}|${(guildUser.medalThird.toString().padStart(medalColumnWidth) || 0)}|${(guildUser.barHistoricalVibranium.toString().padStart(barColumnWidth) || 0)}|${(guildUser.wars.toString().padStart(warColumnWidth) || 0)}|`;
			});
		}
	}
	responseString += '```'
	return respond(responseString)
	
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
		if(user.equipmentFuel >= 5) {
			return respondAndCheckForCloak(user, 'Your inventory for this equipment is full.')
		}
		if(user.ore >= 2500) {
			user.ore -= 2000
			user.equipmentFuel += 1
			itemPurchased = 'fuel reserve'
		} else {
			return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
		}
	} else if('cloak' === item) {
		if(user.equipmentCloak >= 5) {
			return respondAndCheckForCloak(user, 'Your inventory for this equipment is full.')
		}
		if(user.ore >= 3500) {
			user.ore -= 3500
			user.equipmentCloak += 1
			itemPurchased = 'cloaking device'
		} else {
			return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
		}	
	} else if('stealth' === item) {
		if(user.equipmentStealth >= 5) {
			return respondAndCheckForCloak(user, 'Your inventory for this equipment is full.')
		}
		if(user.ore >= 3500) {
			user.ore -= 3500
			user.equipmentStealth += 1
			itemPurchased = 'stealth UAV'
		} else {
			return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
		}	
	} else if('jam' === item) {
		if(user.equipmentJam >= 5) {
			return respondAndCheckForCloak(user, 'Your inventory for this equipment is full.')
		}
		if(user.ore >= 4000) {
			user.ore -= 4000
			user.equipmentJam += 1
			itemPurchased = 'communications jammer'
		} else {
			return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
		}
	} else if('shield' === item) {
		if(user.equipmentShield >= 5) {
			return respondAndCheckForCloak(user, 'Your inventory for this equipment is full.')
		}
		if(user.ore >= 5000) {
			user.ore -= 5000
			user.equipmentShield += 1
			itemPurchased = 'shield generator'
		} else {
			return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
		}	
	} else if('sabotage' === item) {
		if(user.equipmentSabotage >= 5) {
			return respondAndCheckForCloak(user, 'Your inventory for this equipment is full.')
		}
		if(user.ore >= 2000) {
			user.ore -= 2000
			user.equipmentSabotage += 1
			itemPurchased = 'explosive'
		} else {
			return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
		}	
	} else if('strike' === item) {
		if(user.equipmentStrike >= 5) {
			return respondAndCheckForCloak(user, 'Your inventory for this equipment is full.')
		}
		if(user.ore >= 2000) {
			user.ore -= 2000
			user.equipmentStrike += 1
			itemPurchased = 'ballistic missle'
		} else {
			return respondAndCheckForCloak(user, 'You do not have enough vibranium ore.')
		}	
	} else if('nuke' === item) {
		if(user.equipmentNuke >= 5) {
			return respondAndCheckForCloak(user, 'Your inventory for this equipment is full.')
		}
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
		return respondEphemeral('You have no stealth UAVs in your inventory.')
	}
	if(isStealthed(user.lastStealthed)) {
		let remainingMillis = (user.lastStealthed + (stealthIntervalMinutes * 60 * 1000)) - currentTime
		return respondEphemeral('You already have a stealth UAV deployed. Time remaining: ' + timeRemainingAsCountdown(remainingMillis))
	}
	user.equipmentStealth -= 1
	user.netStealth += 1
	user.lastStealthed = currentTime
	await db.putUser(user)
	return respondEphemeral('You deploy a stealth UAV. Your offensive movements are anonymized for the next 20 minutes.')
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

	let response = user.username + ' jams ' + targetUser.username + '\'s communications rendering them unable to attack for the next 20 minutes!'
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
			let anonymizedMessage = message.replace(user.username, 'Someone');
			await queuingService.queueMessageTask(channelId, anonymizedMessage)
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
	if(user.bar <= 5) {
		return null
	}
	let minInvulnerableIntervalMinutes = 480

	// Starting with a max cooldown of 5 days (120 hours), for every bar a user owns reduce the cooldown by 4 hours
	let invulnerableIntervalMinutes = 60 * (120 - 4 * user.bar)
	if(invulnerableIntervalMinutes < minInvulnerableIntervalMinutes) {
		invulnerableIntervalMinutes = minInvulnerableIntervalMinutes
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


  function compareGuildUser( a, b ) {
	if ( a.medalFirst < b.medalFirst ){ 
		return 1;
	}
	if ( a.medalFirst > b.medalFirst ){
		return -1;
	}

	if ( a.medalSecond < b.medalSecond ){ 
		return 1;
	}
	if ( a.medalSecond > b.medalSecond ){
		return -1;
	}

	if ( a.medalThird < b.medalThird ){ 
		return 1;
	}
	if ( a.medalThird > b.medalThird ){
		return -1;
	}

	if ( a.barHistoricalVibranium < b.barHistoricalVibranium ){ 
		return 1;
	}
	if ( a.barHistoricalVibranium > b.barHistoricalVibranium ){
		return -1;
	}

	if ( a.wars < b.wars ){ 
		return 1;
	}
	if ( a.wars > b.wars ){
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
  \nUse /vw attack to attack & steal a portion of a player\'s ore. The amount stolen is determined by the attacking military & the defending city sizes. An attacking military 4 times larger than the defending city constitutes a rout, awarding 15% more ore. If the opponent\'s warehouse is "Location known", routs also have a chance to steal equipment & even shatter an opponent\'s bar back into ore.\
  \n\
  \nUse /vw smelt to convert 10,000 ore into a vibranium bar. Bars cannot be stolen.\
  \n\
  \nEquipment chests unlock advanced commands. These can be purchased with ore using /vw buy, or found during mining.\
  \n\Fuel - Gain 20 energy, 30m cool down\
  \n\Cloak - Hide your stats & non-offensive moves from other players for 8h\
  \n\Stealth - Anonymize your offensive moves from other players for 20m\
  \n\Jam - Prevent opponent from using attack command for 20m\
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
