/**
 * VWARS DISCORD SLASH COMMAND PROCESSOR
 * 
 */

const db = require('./vwarsDbService.js')
const smallPrizeMap = new Map([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 10], [7, 15], [8, 25], [9,0]]);
const mediumPrizeMap = new Map([[1, 50], [2, 75], [3, 100], [4, 125], [5, 150], [6, 175], [7, 200], [8, 250], [9,300]]);
const largePrizeMap = new Map([[1, 400], [2, 500], [3, 600], [4, 700], [5, 800], [6, 1000], [7, 1500], [8, 2000], [9, 5000]]);
const maxEnergy = 100
const energyIntervalMinutes = 10
const cloakIntervalMinutes = 1440
const shieldIntervalMinutes = 1440

module.exports ={
        process
    }


async function process(slashCommandBody) {
	var currentTime = Date.now()
	let slashCommand = parseSlashCommand(slashCommandBody)
	let userRecord = await db.getUser(slashCommand.userId)
	let user = userRecord.Item
	console.log('Retrieved user: ' + JSON.stringify(user))
	if( null == user) {
		user = initUser()
		await db.putUser(user)
		console.log('Created user: ' + JSON.stringify(user))
	}
	user = updateEnergy(user)

	if('mine' === slashCommand.subCommand) {
		return await mine(user, slashCommand)
	} else if('build' === slashCommand.subCommand) {
		return await build(user, slashCommand)
	} else if('train' === subCommand) {
		return await train(user, slashCommand)
	} else if('attack' === subCommand) {
		return await attack(user, slashCommand)
	} else if('fuel' === subCommand) {
		return await fuel(user, slashCommand)
	} else if('cloak' === subCommand) {
		return await cloak(user, slashCommand)
	} else if('shield' === subCommand) {
		return await shield(user, slashCommand)
	} else if('sabotage' === subCommand) {
		return await sabotage(user, slashCommand)
	} else if('strike' === subCommand) {
		return await strike(user, slashCommand)
	} else if('nuke' === subCommand) {
		return await nuke(user, slashCommand)
	} else if('buy' === subCommand) {
		return await buy(user, slashCommand)
	} else if('stats' === subCommand) {
		return await stats(user, slashCommand)
	} else if('leaderboard' === subCommand) {
		return await leaderboard(user, slashCommand)
	}
	return respond('Invalid command')
}

function parseSlashCommand(slashCommandBody) {
	console.log('Slash command body: ' + JSON.stringify(slashCommandBody))
	let userId = JSON.stringify(slashCommandBody.member.user.id).replace(/\"/g, "")
	let username = JSON.stringify(slashCommandBody.member.user.username).replace(/\"/g, "")
	let command = JSON.stringify(slashCommandBody.data.name).replace(/\"/g, "");
	let subCommand = JSON.stringify(slashCommandBody.data.options[0].name).replace(/\"/g, "");
	let arguments = [];
	if(slashCommandBody.data.options[0].hasOwnProperty('options') && slashCommandBody.data.options[0].options.length > 0) {
		for (let i = 0; i < slashCommandBody.data.options[0].options.length; i++) {
			arguments.push(JSON.stringify(slashCommandBody.data.options[0].options[i].value).replace(/\"|@|<|>|!/g, ""))
		}
	}
	let slashCommand = {
		userId: userId,
		username: username,
		command: command,
		subCommand: subCommand,
		arguments: arguments
	  };
	  console.log('Command parsed, userId: ' + userId + ', username: ' + username + ', command' + command + ', subcommand: ' + subCommand + ', arguments: ' + arguments)
	  return slashCommand
}



/**
 * VWARS SLASH SUBCOMMANDS
 * 
 */
 

/**
 * mine [x]
 * spend x energy for x chances at vibranium and rare equipment chests
 */
async function mine(user, slashCommand) {
	let spend = 1
	if(null != slashCommands.arguments && slashCommand.arguments.length > 0) {
		if(!isNumeric(slashCommand.arguments[0])) {
			respond('Improperly formatted argument')
		}
		spend = slashCommand.arguments[0]
	}
	if(user.energy < spend) {
		return respond('You do not have enough energy')
	}

	let minedOre = 0
	let oreFound = false
	let equipmentFound = 0
	let equipmentMap = new Map([['fuel deposit', 0], ['cloaking device', 0], ['shield generator', 0], ['ballistic missle', 0], ['explosive', 0], ['nuclear warhead', 0]]);
	for(let i = 0; i < spend; i++) {
		let roll = randomInteger(1, 1006)
		if(roll <= 750) {
			oreFound = true
			minedOre += smallPrizeMap.get(randomInteger(1,9))
		} else if(roll <= 900) {
			oreFound = true
			minedOre += mediumPrizeMap.get(randomInteger(1,9))
		} else if(roll <= 990) {
			oreFound = true
			minedOre += largePrizeMap.get(randomInteger(1,9))
		} else {
			equipmentFound += 1
			if(roll <= 994) {
				user.equipmentFuel += 1
				equipmentMap.set('fuel deposit', equipmentMap.get('fuel deposit') += 1)
			} else if(roll <= 998) {
				user.equipmentCloak += 1
				equipmentMap.set('cloaking device', equipmentMap.get('cloaking device') += 1)
			} else if(roll <= 1001) {
				user.equipmentShield += 1
				equipmentMap.set('shield generator', equipmentMap.get('shield generator') += 1)
			} else if(roll <= 1003) {
				user.equipmentStrike += 1
				equipmentMap.set('ballistic missle', equipmentMap.get('ballistic missle') += 1)
			} else if(roll <= 1005) {
				user.equipmentSabotage += 1
				equipmentMap.set('explosive', equipmentMap.get('explosive') += 1)
			} else if(roll == 1006) {
				user.equipmentNuke += 1
				equipmentMap.set('nuclear warhead', equipmentMap.get('nuclear warhead') += 1)
			}
		}
	}
	user.energy -= spend
	user.ore += minedOre
	await db.putUser(user)

	//Form mining summary response
	let miningResponse = 'You found '
	if(oreFound) {
		miningResponse.concat(minedOre + ' vibranium')
		if(equipmentFound > 0) {
			miningResponse.concat(' and ')
		}
	}
	if(equipmentFound > 0) {
		miningResponse.concat('an equipment chest containing')

		let equipmentIter = 0
		equipmentMap.forEach(function(value, key) {
			if(value == 1) {
				miningResponse.concat(' ' + value + ' ' + key)
			} else if(value > 1) {
				miningResponse.concat(' ' + value + ' ' + key + 's')
			}
			equipmentIter += 1
			if(equipmentFound > 1) {
				if(equipmentIter == equipmentFound) {
					miningResponse.concat(' and')	
				} else {
					miningResponse.concat(',')
				}
			} 	
		})
	}
 
	return respond(miningResponse)
}


/**
 * build [x]
 * spend x energy to convert x vibranium to x city size
 */
async function build(user, slashCommand) {
	let spend = 1
	if(null != slashCommands.arguments && slashCommand.arguments.length > 0) {
		if(!isNumeric(slashCommand.arguments[0])) {
			return respond('Missing or improperly formatted argument')
		}
		spend = slashCommand.arguments[0]
	}
	if(user.energy < spend) {
		return respond('You do not have enough energy')
	}
	if(user.ore < spend) {
		return respond('You do not have enough vibranium')
	}

	user.energy -= spend
	user.ore -= spend
	user.city += spend
	await db.putUser(user)
	return respond('Your city is now size ' + user.city + ', you have ' + user.ore + ' vibranium and ' + user.energy + ' energy remaining.')
}


/**
 * train [x]
 * spend x energy to convert x vibranium to x military size
 */
 async function train(user, slashCommand) {
	let spend = 1
	if(null != slashCommands.arguments && slashCommand.arguments.length > 0) {
		if(!isNumeric(slashCommand.arguments[0])) {
			return respond('Missing or improperly formatted argument')
		}
		spend = slashCommand.arguments[0]	
	}
	if(user.energy < spend) {
		return respond('You do not have enough energy')
	}
	if(user.ore < spend) {
		return respond('You do not have enough vibranium')
	}

	user.energy -= spend
	user.ore -= spend
	user.military += spend
	await db.putUser(user)
	return respond('Your military is now size ' + user.military + ', you have ' + user.ore + ' vibranium and ' + user.energy + ' energy remaining.')
}


/**
 * attack [player]
 * spend 10 energy to attack [player], gain up to 10% of their vibranium, damage up to 10% of their city, incur up to 10% casualties
 */
 async function attack(user, slashCommand) {
	let targetUser = null
	if(null != slashCommands.arguments && slashCommand.arguments.length > 0 ) {
		let targetUserId = slashCommand.arguments[0]
		let targetUserRecord = await db.getUser(targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(null == targetuser) {
		return respond('Invalid target')
	}
	let conflict = user.military + targetUser.city
	let winPercentage = user.military/conflict * 0.10
	let lossPercentage = targetUser.city/conflict * 0.10
	let stolenOre = Math.round(targetUser.ore * winPercentage)
	let cityDamage = Math.round(targetUser.city * winPercentage)
	let casualties = Math.round(user.military * lossPercentage)
	/**
	 * TODO: War outcome reversal?
	 * The above is how a battle typically goes with the strong opponent gaining the most and losing the least
	 * but the strong opponent doesn't always win in war, every battle has a 1/10 chance to favor the weaker opponent
	 * when this happens, war outcomes are reversed
	 */

	user.ore += stolenOre
	user.military -= casualties
	targetUser.ore -= stolenOre
	targetUser.city -= cityDamage
	user.energy -= 1
	await db.putUser(user)
	await db.putUser(targetUser)
	return respond(user.username + ' attacks ' + targetUser.username + ' stealing ' + stolenOre + ' vibranium! ' + casualties + ' casualties incurred in the attack. Defending city reduced by ' + cityDamage + '.')
}


/**
 * fuel
 * Increase returns from mine, build and train commands by 30% for 24 hours
 */
async function fuel(user, slashCommand) {

	//TODO: Add fuel logic here, similar to cloak and shield. Will get called from mine, train and build

	return respond('You release fossil fuel reserves increasing production. Yields from mine, build and train commands increased by 30% for the next 24 hours')
}


/** 
 * cloak
 * Hide your activity and stats from other players for 24 hours
 */
async function cloak(user, slashCommand) {
	if(user.equipmentCloak < 1) {
		return respond('You have no cloaking devices in your inventory.')
	}
	if(isCloaked(user.lastCloaked)) {
		return respond('You are already cloaked.')
	}
	user.equipmentCloak -= 1
	user.lastCloaked = currentTime
	await db.putUser(user)
	return respond('You are now cloaked. Players will be unable to see your stats for 24 hours')
}


/** 
 * shield
 * protection from attack, sabotage, strike and nuke for 24 hours
 */
async function shield(user, slashCommand) {
	if(user.equipmentShield < 1) {
		return respond('You have no shield generators in your inventory.')
	}
	if(isShielded(user.lastShielded)) {
		return respond('You already have shields up.')
	}
	user.equipmentShield -= 1
	user.lastShielded = currentTime
	await db.putUser(user)
	return respond('You now have shields up granting immunity to attack, sabotage, strike or nuke for 24 hours')
}

/**
 * sabotage [player]
 * reduce [player] city by 25%
 */
async function sabotage(user, slashCommand) {
	let targetUser = null
	if(user.equipmentSabotage < 1) {
		return respond('You have no saboteurs in your inventory.')
	}
	if(null != slashCommands.arguments && slashCommand.arguments.length > 0 ) {
		let targetUserId = slashCommand.arguments[0]
		let targetUserRecord = await db.getUser(targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(null == targetuser) {
		return respond('Invalid target')
	}
	let cityDamage = Math.round(targetUser.city * .25)
	targetUser.city -= cityDamage
	user.equipmentSabotage -= 1
	await db.putUser(user)
	await db.putUser(targetUser)
	return respond(user.username + ' sabotages ' + targetUser.username + ' reducing city size by ' + cityDamage + '!')
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
	if(null != slashCommands.arguments && slashCommand.arguments.length > 0 ) {
		let targetUserId = slashCommand.arguments[0]
		let targetUserRecord = await db.getUser(targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(null == targetuser) {
		return respond('Invalid target')
	}
	let militaryDamage = Math.round(targetUser.military * .25)
	targetUser.military -= militaryDamage
	user.equipmentStrike -= 1
	await db.putUser(user)
	await db.putUser(targetUser)
	return respond(user.username + ' launches a missle strike on ' + targetUser.username + ' reducing military size by ' + militaryDamage + '!')
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
	if(null != slashCommands.arguments && slashCommand.arguments.length > 0 ) {
		let targetUserId = slashCommand.arguments[0]
		let targetUserRecord = await db.getUser(targetUserId)
		targetUser = targetUserRecord.Item
	}
	if(null == targetuser) {
		return respond('Invalid target')
	}
	let militaryDamage = Math.round(targetUser.military * .50)
	let cityDamage = Math.round(targetUser.city * .50)
	targetUser.city -= cityDamage
	targetUser.military -= militaryDamage
	user.equipmentNuke -= 1
	await db.putUser(user)
	await db.putUser(targetUser)
	return respond(user.username + ' launches a nuclear strike on ' + targetUser.username + ' reducing military size by ' + militaryDamage + ' and city size by ' + cityDamage + '!')
}


/**
 * buy
 * Purchase a chest from the equipment shop at the cost of vibranium
 */
 async function buy(user, slashCommand) {

	let item = null
	let itemPurchased = null
	if(null != slashCommands.arguments && slashCommand.arguments.length > 0) {
		item = slashCommand.arguments[0]
	}

	if('fuel' === item) {
		if(user.ore >= 1000) {
			user.ore -= 1000
			user.equipmentFuel += 1
			itemPurchased = 'fuel deposit'
		} else {
			return respond('You do not have enough vibranium.')
		}
	} else if('cloak' === subCommand) {
		if(user.ore >= 1000) {
			user.ore -= 1000
			user.equipmentCloak += 1
			itemPurchased = 'cloaking device'
		} else {
			return respond('You do not have enough vibranium.')
		}	
	} else if('shield' === subCommand) {
		if(user.ore >= 2000) {
			user.ore -= 2000
			user.equipmentShield += 1
			itemPurchased = 'shield generator'
		} else {
			return respond('You do not have enough vibranium.')
		}	
	} else if('sabotage' === subCommand) {
		if(user.ore >= 3000) {
			user.ore -= 3000
			user.equipmentSabotage += 1
			itemPurchased = 'explosive'
		} else {
			return respond('You do not have enough vibranium.')
		}	
	} else if('strike' === subCommand) {
		if(user.ore >= 3000) {
			user.ore -= 3000
			user.equipmentStrike += 1
			itemPurchased = 'ballistic missle'
		} else {
			return respond('You do not have enough vibranium.')
		}	
	} else if('nuke' === subCommand) {
		if(user.ore >= 5000) {
			user.ore -= 5000
			user.equipmentNuke += 1
			itemPurchased = 'nuclear warhead'
		} else {
			return respond('You do not have enough vibranium.')
		}	
	} else {
		return respond('Not a valid option.')
	}

	await db.putUser(user)
	return respond('You have purchased an equipment chest containing one ' + itemPurchased + '.')
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
	if(null != slashCommands.arguments && slashCommand.arguments.length > 0 ) {

		let targetUserId = slashCommand.arguments[0]
		let targetUserRecord = await db.getUser(targetUserId)
		targetUser = targetUserRecord.Item
		if(null == targetuser) {
			return respond('Invalid target')
		}
	}
	if(isCloaked(targetUser.lastCloaked)) {
		return respond('This player is cloaked.')
	}
	return respond('Statistics for ' + targetUser.username +
				'\nTotal Vibranium: ' + targetUser.ore + 
				'\nCity size: ' + targetUser.city + 
				'\nMilitary size: ' + targetUser.military +
				'\nEnergy: ' + targetUser.energy + '/' + maxEnergy +
				'\nEquipment: cloak(' + targetUser.equipmentCloak + 
					'), strike(' + targetUser.equipmentStrike + 
					'), sabotage(' + targetUser.equipmentSabotage + 
					'), nuke(' + targetUser.equipmentNuke + ')')
}


/**
 * leaderboard
 */
async function leaderboard(user, slashCommand) {
	let responseString = 'Vibranium Wars Leaderboard'
	let retrievedUsers = await db.getUsers()
	//retrieve, cloak, sort and form leaderboard response
	retrievedUsers.Items.forEach(function(user) {
			if(isCloaked(user.lastCloaked)) {
				user.ore = '??'
			}
		})
	.sort(compare)
	.forEach(function(user) {
		responseString = responseString.concat('\n', user.username + ': ' + user.ore)
	 });
	 console.log(responseString)
	 return respond(responseString)
}





async function initUser() {
	user = {
		userid: slashCommand.userId,
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
		energy: maxEnergy,
		energyUpdatedAt: currentTime
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

function respond(message) {
	const responseBody = {type: 4, data: {content: message}}
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

function isCloaked(lastCloaked) {
	let cloakIntervalMillis = 1000 * 60 * cloakIntervalMinutes
	if(currentTime > lastCloaked + cloakIntervalMillis) {
		return true
	}
	return false
}

function isShielded(lastShielded) {
	let shieldIntervalMillis = 1000 * 60 * shieldIntervalMinutes
	if(currentTime > lastShielded + shieldIntervalMillis) {
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
  
