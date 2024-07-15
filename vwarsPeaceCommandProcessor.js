/**
 * VWARS DISCORD SLASH COMMAND PROCESSOR
 * 
 */

const db = require('./vwarsDbService.js')
const userService = require('./userService.js')
const warService = require('./warService.js')
const queuingService = require('./vwarsQueuingService.js')
const { MessageEmbed } = require('discord.js');
const { EmbedBuilder } = require('@discordjs/builders');
const smallPrizeMap = new Map([[1, 0], [2, 1], [3, 3], [4, 6], [5, 11], [6, 15], [7, 18], [8, 24], [9, 30]]);
const mediumPrizeMap = new Map([[1, 25], [2, 32], [3, 40], [4, 48], [5, 59], [6, 76], [7, 115], [8, 135], [9,177]]);
const largePrizeMap = new Map([[1, 100], [2, 125], [3, 142], [4, 165], [5, 243], [6, 291], [7, 375], [8, 850], [9, 1330]]);
const xlPrizeMap = new Map([[1, 2000], [2, 3000], [3, 4000], [4, 5000], [5, 6000]]);
const maxEnergy = 100
//let energyIntervalMinutes = 4
let energyIntervalMinutes = 0.1
let idleIntervalMinutes = 2880
let speed = 1
let currentTime = null
let defaultPeaceMiningRate = 0.1

module.exports ={
        processCommand
    }


async function processCommand(slashCommandBody) {
	currentTime = Date.now()
	let slashCommand = parseSlashCommand(slashCommandBody)

	// TODO: global settings retrieval and housekeeping

	// User retrieval and housekeeping
	let firstTime = false
	let userRecord = await db.getGlobalUser(slashCommand.userId)
	let user = userRecord.Item
	console.log('Retrieved user: ' + JSON.stringify(user))
	let millisElapsed = 0
	if(!user) {
		user = userService.initGlobalUser(slashCommand, currentTime, maxEnergy)
		await db.putGlobalUser(user)
		console.log('Global user record created for userId ' + user.userId)
		millisElapsed = currentTime
		firstTime = true
	} else {
		user = userService.migrateGlobalUser(user)
		millisElapsed = currentTime - user.energyUpdatedAt
	}

	// TODO: handling of idle or first time players

	user = updateEnergy(user)

	if('mine' === slashCommand.subCommand) {
		return await mine(user, slashCommand)
	} else if('smelt' === slashCommand.subCommand) {
		return await smelt(user, slashCommand)
	} else if('construct' === slashCommand.subCommand) {
		return await construct(user, slashCommand)
	} else if('profile' === slashCommand.subCommand) {
		return await profile(user, slashCommand)
	} else if('leaderboard' === slashCommand.subCommand) {
		return await leaderboard(user, slashCommand)	
	} else if('help' === slashCommand.subCommand) {
		return await help()	
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
	let subCommandArgs = new Map();

	if(slashCommandBody.data.options[0].hasOwnProperty('options') && slashCommandBody.data.options[0].options.length > 0) {
		for (let i = 0; i < slashCommandBody.data.options[0].options.length; i++) {
			subCommandArgs.set(JSON.stringify(slashCommandBody.data.options[0].options[i].name).replace(/\"|@|<|>|!/g, ""),JSON.stringify(slashCommandBody.data.options[0].options[i].value).replace(/\"|@|<|>|!/g, ""))
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
 * SUBCOMMANDS
 * 
 */


/**
 * MINE
 * 
 */
async function mine(user, slashCommand) {
	let spend = 1
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.size > 0) {
		if(slashCommand.subCommandArgs.get('spend')) {
			if(!isNumeric(slashCommand.subCommandArgs.get('spend')) || slashCommand.subCommandArgs.get('spend') < 0) {
				respond('Improperly formatted argument.')
			}
			spend = parseInt(slashCommand.subCommandArgs.get('spend'))
		} 
	}
	if(user.energy < spend) {
		return respondEphemeral(user, 'You do not have enough energy.')
	}

	/**
	 * MIRACLE AND CHAOS ROLLS
	 * Natural daily energy gain: 288 
	 * Maximum daily energy gain if average ore gains are spent on fuel: 470
	 * At 10,000 chaos roll, chance per 100 energy spent of each chaos event is 1 in 100
	 * At 10,000 chaos roll, natural daily chance of each chaos event is 1 in 35
	 * At 10,000 chaos roll, maximum daily chance of each chaos event is 1 in 21
	 */
	/*
	let chaosRoll = randomInteger(1, Math.round(50 * spend))
	if(chaosRoll === 1) {
		user.energy -= spend
		let cityDamage = Math.round(user.city * .10 * (spend / 100))
		user.city -= cityDamage
		await db.putUser(user)
		return respondAndCheckForCloak(user, 'Your vibranium mine collapsed unexpectedly reducing city size by ' + cityDamage + '!')
	}
	*/
	//TODO: Refactor miracle and chaos rolls to trigger other events such as striking oil
	let miracleRoll = randomInteger(1, Math.round(5000 / spend))
	if(miracleRoll === 1) {
		user.energy -= spend
		user.barVibranium += 1
		await db.putUser(user)
		return respondAndCheckForCloak(user, 'You found an abandoned shipping crate containing 1 vibranium bar!')
	}


	// STANDARD ROLL
	let minedOre = 0
	let oreFound = false
	let equipmentFound = 0
	let equipmentMap = new Map([['TODO1', 0], ['TODO2', 0]]);
	let rolls = 'rolls: '
	for(let i = 0; i < spend; i++) {
		let roll = randomInteger(1, 1000)
		console.log('Roll: ' + roll)
		rolls += roll + ' '
		let increasedLuck = 0
		if(user.structMiningFacility && isNumeric(user.structMiningFacility)) {
			increasedLuck = user.structMiningFacility * 20
		}
		if(roll <= (990 - increasedLuck)) {
			oreFound = true
			minedOre += smallPrizeMap.get(randomInteger(1,9))
		} else if(roll <= 1000) {
			oreFound = true
			minedOre += mediumPrizeMap.get(randomInteger(1,9))
		} else if(roll <= 1200) {
			oreFound = true
			minedOre += largePrizeMap.get(randomInteger(1,9))
		} else if(roll <= 1201) {
			oreFound = true
			minedOre += xlPrizeMap.get(randomInteger(1,5))
		} /*else {
			equipmentFound += 1
			if(roll <= 1202) {
				user.oreAluminum += 1
				equipmentMap.set('aluminum', equipmentMap.get('aluminum') + 1)
			} else if(roll <= 1203) {
				user.oreLead += 1
				equipmentMap.set('lead', equipmentMap.get('lead') + 1)
			} else if(roll <= 1204) {
				user.oreCopper += 1
				equipmentMap.set('copper', equipmentMap.get('copper') + 1)
			} else if(roll <= 1205) {
				user.oreIron += 1
				equipmentMap.set('iron', equipmentMap.get('iron') + 1)
			} else if(roll <= 1206) {
				user.oreSilver += 1
				equipmentMap.set('silver', equipmentMap.get('silver') + 1)
			} else if(roll <= 1207) {
				user.oreGold += 1
				equipmentMap.set('gold', equipmentMap.get('gold') + 1)
			} else if(roll <= 1208) {
				user.oreCobalt += 1
				equipmentMap.set('cobalt', equipmentMap.get('cobalt') + 1)
			} else if(roll == 1209) {
				user.oreTungsten += 1
				equipmentMap.set('tungsten', equipmentMap.get('tungsten') + 1)
			} else if(roll == 1210) {
				user.oreTitanium += 1
				equipmentMap.set('titanium', equipmentMap.get('titanium') + 1)
			} else if(roll == 1211) {
				user.oreBeryllium += 1
				equipmentMap.set('beryllium', equipmentMap.get('beryllium') + 1)
			} else if(roll == 1212) {
				user.oreUranium += 1
				equipmentMap.set('uranium', equipmentMap.get('uranium') + 1)
			}
		}*/
	}
	console.log(rolls)
	user.energy -= spend
	user.oreVibranium += minedOre
	user.netMined += minedOre
	await db.putGlobalUser(user)

	//Form vibranium found response
	let miningResponse = 'You found '
	if(oreFound) {
		miningResponse += minedOre + ' ' + oreType + ' ore'
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
					if(key === 'crate of artillery rounds') {
						miningResponse += ' ' + value + ' ' + 'crates of artillery rounds'
					} else {
						miningResponse += ' ' + value + ' ' + key + 's'
					}
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
	return respond(miningResponse)
}


/**
 * SMELT
 * 
 */
async function smelt(user, slashCommand) {
	if(user.ore < 10000) {
		return respond(user, 'You do not have enough vibranium ore.')
	}
	user.ore -= 10000
	user.bar += 1

	await db.putGlobalUser(user)
	let response = 'You have created a vibranium bar.'
	return respond(response)
}


/**
 * CONSTRUCT
 * 
 */
async function construct(user, slashCommand) {
	let arg = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.size > 0) {
		if(slashCommand.subCommandArgs.get('INSERT_ARG_NAME_HERE')) {
			arg = slashCommand.subCommandArgs.get('INSERT_ARG_NAME_HERE')
		} 
	}
	let response = 'Command coming soon!'
	return respondEphemeral(response)	
}


/**
 * PROFILE
 * 
 */
async function stats(user, slashCommand) {
	let targetUser = user
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0 ) {
		if(slashCommand.subCommandArgs.get('user')) {
			let targetUserId = slashCommand.subCommandArgs.get('user')
			let targetUserRecord = await db.getGlobalUser(targetUserId)
			targetUser = targetUserRecord.Item
			if(null == targetUser) {
				return respond('Invalid target.')
			}
			updateEnergy(targetUser)
			userService.migrateGlobalUser(targetUser)
		}
	}

	let response = '```Operational Report\n'
	response += 'Player: ' + targetUser.username + 
		'\nEnergy: ' + targetUser.energy + '/' + maxEnergy +
		'\nPopulation: ' + targetUser.population +		
		'\Global rank: ' + targetUser.rankGlobal +		
		'\Server rank: ' + targetUser.rankServer +		
		'\Vibranium bars: ' + targetUser.barVibranium +		
		'\Vibranium ore: ' + targetUser.oreVibranium +	
		'\Vibranium coins: ' + targetUser.coinVibranium	
		
		response += '\n\Structures'
		let structColumnLength = 20
		let structCountColumnLength = 7
		response += '\n|' + 'Structure'.padStart(structColumnLength) + '|' + 'Level'.padStart(structCountColumnLength) + '|' + 'Active'.padStart(structCountColumnLength) + '|'
		response += '\n|' + '-'.repeat(structColumnLength) + '|' + '-'.repeat(structCountColumnLength) + '|' + '-'.repeat(structCountColumnLength) + '|'
		let structNames = ['fuelDepot', 'reinforcedHanger', 'researchFacility', 'commsArray', 'navalBase', 'munitionsDepot', 'supercapacitors', 'nuclearSilo'];
		let activeStructs = targetUser['activeStructs']; // Assuming this is the correct property
		for (let struct of structNames) {
			let structField = 'struct' + struct.charAt(0).toUpperCase() + struct.slice(1);
			let isActive = activeStructs.includes(structField) ? 'X' : ' ';
			response += '\n|' + struct.padStart(structColumnLength) + '|' + (targetUser[structField] || 0).toString().padStart(structCountColumnLength) + '|' + isActive.padStart(structCountColumnLength) + '|';
		}
		/*
		response += '\n\nSmuggled Equipment' +
		'\n| fuel|  cloak| stealth| shield|' +
		'\n|' + targetUser.equipmentFuel.toString().padStart(3) + '/5|'+ targetUser.equipmentCloak.toString().padStart(5) + '/5|     ?/5|'+ targetUser.equipmentShield.toString().padStart(5) + '/5|' +
		'\n|  jam| strike|   shell|   nuke|' +
		'\n|' + targetUser.equipmentJam.toString().padStart(3) + '/5|'+ targetUser.equipmentStrike.toString().padStart(5) + '/5|'+ targetUser.equipmentSabotage.toString().padStart(6) + '/5|'+ targetUser.equipmentNuke.toString().padStart(5) + '/5|' +
		'```'
		*/

		response += '```'

	return respond(response)
}


/**
 * LEADERBOARD
 * 
 */
async function leaderboard(user, slashCommand) {
	let arg = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.size > 0) {
		if(slashCommand.subCommandArgs.get('INSERT_ARG_NAME_HERE')) {
			arg = slashCommand.subCommandArgs.get('INSERT_ARG_NAME_HERE')
		} 
	}
	let response = 'Command coming soon!'
	return respondEphemeral(response)	
}


/** 
 * HELP
 * 
 */
 async function help(slashCommand) {
	let page = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0) {
		page = slashCommand.subCommandArgs[0]
	}
	if('release notes' === page) {
		return respondWithHelpReleaseNotes()
	}
	return respondWithHelp()
}



/**
 * HELPER FUNCTIONS
 * 
 */



function updateEnergy(user) {
	let energyIntervalMillis = convertToSpeedAdjustedMillis(energyIntervalMinutes)
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

async function welcome(user, slashCommand) {
	let response = 'Welcome to Vibranium Wars!'
	let guildUserRecord = await db.getGuildUser(slashCommand.guildId, slashCommand.userId)
	let guildUser = guildUserRecord.Item
	if(guildUser) {
		let settlers = Math.floor(guildUser.population / 20)
		let maxSettlers = 10000
		if(settlers > maxSettlers) {
			settlers = maxSettlers
		}
		
		user.city += Math.floor(settlers / 2)
		user.military += Math.floor(settlers / 2)
		guildUser.population -= settlers
		user = updateEnergy(user)
		await db.putGuildUser(guildUser)
		await db.putUser(user)
		response += ' ' + settlers + ' troops have been conscripted from your capital city and deployed to your starting military and city.'
	}
	response += ' Use /vw help to review how to play & have fun!'
	return respondEphemeral(response)
}


async function welcomePreRelease(user) {
	user = updateShield(user)
	if(user.shieldHealth < 100) {
		user.shieldHealth = 100
		user.shieldUpdatedAt = currentTime
	}
	user.lastCloaked = currentTime
	user.ore = 20000
	user = updateEnergy(user)
	await db.putUser(user)
	let response = 'Welcome to Vibranium Wars (pre-release)! For testing purposes, you are entering this war cloaked, shielded and supplied with 20,000 ore to spend how you see fit. Use /vw help to review how to play & have fun!'
	return respondAndCheckForCloak(user, response)
}


async function welcomeBack(user, millisEllapsed) {
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
	user.equipmentFuel += addedFuel
	user = updateEnergy(user)
	await db.putGlobalUser(user)
	let response = 'Welcome back to Vibranium Wars! Your time away has resulted in a stockpile of ' + addedFuel + ' additional fueld reserves. Use /vw help to review how to play & have fun!'
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


function convertToSpeedAdjustedMillis(minutes) {
	let millis = (1000 * 60 * minutes)
	if(speed > 0 && millis > speed) {
		millis = Math.floor(millis / speed)
	}
	return millis
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


  function respondWithHelp() {

	const helpEmbed = new EmbedBuilder()
		.setTitle('Welcome to Vibranium Wars!')
		.setDescription('**Objective:** Acquire more vibranium bars than your opponents.')
		.setImage('https://vwars-assets.s3.us-west-2.amazonaws.com/vw_logo_prod.png')
		.addFields(
			{ name: 'How to play', value: 'Type `/vw` followed by the desired command and command options (when applicable). Here is an example of using `mine` command with required option `energy` of 10: \n`/vw mine 10`\n\n' },
			{ name: 'Basic Commands', value: '*Costs energy. Energy refreshes at a rate of 1 per 4m*\n`/vw mine` -  Mine for vibranium ore & rare equipment chests.\n`/vw build` & `/vw train` -  Increase your city & military size.\n`/vw attack` - Attack & steal a portion of another player\'s ore. The amount stolen is determined by the attacking military & the defending city sizes. An attacking military 4 times larger than the defending city constitutes a **rout**, awarding 15% more ore. If the opponent\'s warehouse location is known, routs also have a chance to steal equipment & even shatter an opponent\'s bar back into ore.\n`/vw smelt` - Convert 10,000 ore into a vibranium bar. Bars cannot be stolen.\n\n' },
			{ name: 'Informational Commands', value: '*No cost*\n`/vw stats` - Receive a war report on yourself or another player \n`/vw leaderboard` -  Check current war standings & time remaining\n`/vw hall` - Check overall server standings or player profiles\n\n' },
			{ name: 'Advanced Commands', value: '*Costs equipment inventory. Equipment chests can be purchased with ore using `/vw buy`, or found during mining.*\n`/vw fuel` - Replenish 20 energy, 30m cool down\n`/vw cloak` - Hide your stats & non-offensive moves from other players for 8h\n`/vw stealth` - Anonymize your offensive moves from other players for 20m\n`/vw jam` - Prevent opponent from using attack command for 20m\n`/vw shield` - Absorb incoming damage until shield integrity reaches 0% or upon your next offensive move. Reinforced shields degrade at a rate of 3% per hour for the first reinforced stack, increasing exponentially per each additional stack\n`/vw shell` - Destroy 30% of an opponent\'s city\n`/vw strike` - Destroy 30% of an opponent\'s military\n`/vw nuke` - Destroy 40% of an opponent\'s city & military\n\n' },
			{ name: 'Conclusion', value: 'At the conclusion of a war, the Hall of Legends is updated to include the results of the war including issued medals, issued titles, vibranium bars earned, player statistics and player population all viewable using the `/vw hall` command.\n\n' },
		  )
		.setFooter({ text: 'Creator & developer: General Ronimus\nGame design: PlayboyPK', iconURL: 'https://vwars-assets.s3.us-west-2.amazonaws.com/vw_logo_prod.png' });
			
	  const responseBody = { type: 4, data: { embeds: [helpEmbed.toJSON()], flags: 64 } };
  
	  const response = {
		  statusCode: 200,
		  body: JSON.stringify(responseBody),
	  };
  
	  return response;
  }

  function respondWithHelpReleaseNotes() {

	const helpEmbed = new EmbedBuilder()
		.setTitle('Release Notes')
		.setDescription('**Version:** v3.0')
		.addFields(
			{ name: 'Permanent player records', value: 'User standings and stats now persist at the server level. At the conclusion of each war, medals, stats & vibranium bars earned get saved to a player\'s permanent server record.\n\n' },
			{ name: 'New command: hall', value: 'Introduced new hall command for displaying a server\'s standings and player permanent records.\n\n' },
			{ name: 'New command: stealth', value: 'Introduced new stealth equipment & command for anonymizing your offensive movements.\n\n' },
			{ name: 'Improved help, stats & leaderboard', value: 'Aesthetic uplift to help, stats and leaderboard commands.\n\n' },
			{ name: 'Scaffolding for Structures', value: 'Structures (upon their full release) are permanent assets players can invest in during "peace" time (no active war) to give them a strategic advantage in future wars. v3.0 introduces structures as part of players\' hall profiles. The ability to build and utilize them will come in a later release. Example structure:'
			+ '\nNuclear Silo - 0/5\nFor each level invested, increase inventory cap by 1 & damage output by 2%. Nukes now deal an additional damage over time effect called *radiation*.' },
			{ name: 'Other updates and bug fixes', value: '* Bug fix to mining collapse rate\n* Rebalancing to equipment and shatter, most notably the introduction of inventory caps starting at 5 but expandable via structures\n* Add action options for activating, deactiving or checking timers & inventory for cloak and stealth' },
		  )
		.setFooter({ text: 'Creator & developer: General Ronimus\nGame design: PlayboyPK', iconURL: 'https://vwars-assets.s3.us-west-2.amazonaws.com/vw_logo_prod.png' });
			
	  const responseBody = { type: 4, data: { embeds: [helpEmbed.toJSON()], flags: 64 } };
  
	  const response = {
		  statusCode: 200,
		  body: JSON.stringify(responseBody),
	  };
  
	  return response;
  }
  