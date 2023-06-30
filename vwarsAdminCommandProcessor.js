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
 * VWARS ADMIN SUBCOMMANDS
 * 
 */
 

/**
 * Create a new war with name and expiration
 */
async function create(slashCommand) {
	let name = 'War ' + currentTime
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.size > 0) {
		if(slashCommand.subCommandArgs.get('name')) {
			name = slashCommand.subCommandArgs.get('name')
		} 
	}

	let requestedWar = {
        guildId: slashCommand.guildId,
		name: name
    }
	let createdWar = await warService.createWar(requestedWar)

	if(createdWar) {
		let createdWarResponseString = 'New war created! \nwarId: ' + createdWar.warId + '\nname: ' + createdWar.name
		return respond(createdWarResponseString)
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
	let start = null
	let expiration = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.size > 0) {
		if(slashCommand.subCommandArgs.get('id')) {
			warId = slashCommand.subCommandArgs.get('id')
		} else {
			return respond('Missing or improperly formatted argument.')
		}
		if(slashCommand.subCommandArgs.get('start')) {
			if(!isNumeric(slashCommand.subCommandArgs.get('start')) || slashCommand.subCommandArgs.get('start') < 0) {
				return respond('Improperly formatted argument.')
			}
			start = parseInt(slashCommand.subCommandArgs.get('start'))
		}  
		if(slashCommand.subCommandArgs.get('expire')) {
			if(!isNumeric(slashCommand.subCommandArgs.get('expire')) || slashCommand.subCommandArgs.get('expire') < 0) {
				return respond('Improperly formatted argument.')
			}
			expiration = parseInt(slashCommand.subCommandArgs.get('expire'))
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
		if(start) {
			warToActivate.start = start
		}

		if(warToActivate.expiration > currentTime) {
            warToActivate.isActive = true
            await db.putWar(warToActivate)
			return respond("War " + warId + ' activated. Start: ' + warToActivate.start + ', expiration: ' + warToActivate.expiration)
        } else {
            return respond('This war already expired at: ' + warToActivate.expiration)
        }
	}
}

async function deactivate(slashCommand) {
	let warId = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.size > 0) {
		if(slashCommand.subCommandArgs.get('id')) {
			warId = slashCommand.subCommandArgs.get('id')
		} else {
			return respond('Missing or improperly formatted argument.')
		}
	}

	let warRecord = await db.getWar(slashCommand.guildId, warId)
	let retrievedWar = warRecord.Item
	if(!retrievedWar) {
		return respond('No war found for given id: ' + warId)
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
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.size > 0) {
		if(slashCommand.subCommandArgs.get('id')) {
			warId = slashCommand.subCommandArgs.get('id')
		} else {
			return respond('Missing or improperly formatted argument.')
		}
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

	return respond('War ' + warId + ' has been concluded. ' + result + ' users\' server records have been updated.')
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
  
