/**
 * VWARS ADMIN DISCORD SLASH COMMAND PROCESSOR
 * 
 */

const db = require('./vwarsDbService.js')
const warService = require('./warService.js')
let currentTime = null

module.exports ={
        process
    }


async function process(slashCommandBody) {
	currentTime = Date.now()
	let slashCommand = parseSlashCommand(slashCommandBody)
	//TODO: If no guild exists, go ahead and create guild with no active war

	if('create' === slashCommand.subCommand) {
		return await create(slashCommand)
	} else if('list' === slashCommand.subCommand) {
		return await list(slashCommand)
	} else if('delete' === slashCommand.subCommand) {
		return await remove(slashCommand)
	} else if('activate' === slashCommand.subCommand) {
		return await activate(slashCommand)
	} else if('deactivate' === slashCommand.subCommand) {
		return await deactivate(slashCommand)
	} else if('conclude' === slashCommand.subCommand) {
		return await conclude(slashCommand)
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
 * VWARS ADMIN SUBCOMMANDS
 * 
 */
 

/**
 * Create a new war with name and expiration
 */
async function create(slashCommand) {
	let name = 'War ' + currentTime
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0) {
		if(slashCommand.subCommandArgs[0].length > 0) {
			name = slashCommand.subCommandArgs[0]
		} else {
			return respond('Missing or improperly formatted argument.')
		}
	}

	let requestedWar = {
        guildId: slashCommand.guildId,
		name: name
    }
	let createdWarRecord = await warService.createWar(requestedWar)
	let createdWar = createdWarRecord.Item

	if(createdWar) {
		return respond("Created war: " + createdWar.warId)
	} else {
		return respond("Unable to create war.")
	}
}

/**
 * LEADERBOARD
 * 
 */
async function list(slashCommand) {
	let responseString = 'Wars'
	let retrievedWars = await db.getWars(slashCommand.guildId)
	//retrievedWars.Items.sort(compare)
	retrievedWars.Items.forEach(function(war) {
		responseString = responseString += '\nID: ' + war.warId + ', Name: ' + war.name + ', Active: ' + war.isActive
	 });
	 console.log(responseString)
	 return respond(responseString)
}

async function remove(slashCommand) {
	return respond("Delete command coming soon!")
}

async function activate(slashCommand) {
	let warId = null
	let expiration = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0) {
		warId = slashCommand.subCommandArgs[0]
		if(slashCommand.subCommandArgs.length > 1) {
			if(!isNumeric(slashCommand.subCommandArgs[1]) || slashCommand.subCommandArgs[1] < 0) {
				return respond('Improperly formatted argument.')
			}
			expiration = parseInt(slashCommand.subCommandArgs[1])
		}
	}

	let activeWar = await warService.getActiveWar(slashCommand.guildId, currentTime)
	if(activeWar) {
		return respond('There is already an active war on this server: ' + activeWar.warId)
	}
	let warRecord = await db.getWar(slashCommand.guildId, warId)
	let warToActivate = warRecord.Item
	if(!warToActivate) {
		return respond('Unable to activate non-existent war: ' + warId)
	} else {
        if(expiration) {
            warToActivate.expiration = expiration
        }

		if(warToActivate.expiration > currentTime) {
            warToActivate.isActive = true
            warToActivate = await db.putWar(warToActivate)
			//let timeRemaining = timeRemainingAsCountdown(warToActivate.expiration - currentTime)
			//return respond("War " + warId + ' activated. Expiration: ' + timeRemaining)
			return respond("War " + warId + ' activated.')
        } else {
            return respond('This war has an expired expiration date: ' + warToActivate.expiration)
        }
	}
}

async function deactivate(slashCommand) {
	let warId = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0) {
		warId = slashCommand.subCommandArgs[0]
	}

	let warRecord = await db.getWar(slashCommand.guildId, warId)
	let retrievedWar = warRecord.Item
	if(!retrievedWar) {
		return respond('No war found for given warId: ' + warId)
	} else {
		if(retrievedWar.isActive) {
			retrievedWar.isActive = false
			await db.putWar(retrievedWar)
			return respond('War ' + warId + ' is now deacivated.')
		} else {
			return respond('Unable to deactivate. War ' + warId + ' is already inactive.')
		}
	}
}

async function conclude(slashCommand) {
	let warId = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0) {
		warId = slashCommand.subCommandArgs[0]
	}
	
	let warRecord = await db.getWar(slashCommand.guildId, warId)
	let warToConclude = warRecord.Item
	if(!warToConclude) {
		return respond('No war found with id: ' + warId)
	}
	if(warToConclude.isActive) {
		return respond('Unable to conclude an active war.')
	}	
	if(warToConclude.isConcluded) {
		return respond('Unable to conclude an already concluded war.')
	}
	let result = await warService.concludeWar(warToConclude)

	return respond('War ' + warId + ' has been concluded. ' + result + ' users\' permanent records have been updated.')
}


/**
 * HELPER FUNCTIONS
 * 
 */

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

function compare( a, b ) {
	if ( a.ore < b.ore ){ 
	  return 1;
	}
	if ( a.ore > b.ore ){
	  return -1;
	}
	return 0;
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
  
