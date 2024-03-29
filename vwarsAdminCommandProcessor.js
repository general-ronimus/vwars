/**
 * VWARS ADMIN DISCORD SLASH COMMAND PROCESSOR
 * 
 */

const db = require('./vwarsDbService.js')
const warService = require('./warService.js')
let currentTime = null

module.exports ={
	processCommand
    }


async function processCommand(slashCommandBody) {
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
	} else if('leaderboard' === slashCommand.subCommand) {
		return await leaderboard(slashCommand)
	}
	return respondEphemeral('Invalid command')
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
		return respondEphemeral(createdWarResponseString)
	} else {
		return respondEphemeral("Unable to create war.")
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
		responseString = responseString += '\nID: ' + war.warId + ', Name: ' + war.name + ', Active: ' + war.isActive + ', Concluded: ' + war.isConcluded
	 });
	 console.log(responseString)
	 return respondEphemeral(responseString)
}

async function remove(slashCommand) {
	let warId = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.size > 0) {
		if(slashCommand.subCommandArgs.get('id')) {
			warId = slashCommand.subCommandArgs.get('id')
		} else {
			return respondEphemeral('Missing or improperly formatted argument.')
		}
	}

	let warRecord = await db.getWar(slashCommand.guildId, warId)
	let retrievedWar = warRecord.Item
	if(!retrievedWar) {
		return respondEphemeral('No war found with id: ' + warId)
	} 
	if(retrievedWar.isActive) {
		return respondEphemeral('Unable to delete an active war: ' + warId)
	}

    let usersDeleted = 0
	let users = await db.getUsers(warId)
    if( users.Items.length > 0) {
        for (const user of users.Items) {
			let result = db.deleteUser(warId, user.userId)
			if(result) {
				usersDeleted += 1
			}
		}
	}

	let result = await db.deleteWar(slashCommand.guildId, warId)
	let account = 'accounts have'
	if(usersDeleted === 1) {
		account = 'account has'
	}
	if(result) {
		return respondEphemeral('War ' + warId + ' and ' + usersDeleted + ' ' + account + ' been deleted.')
	} else {
		return respondEphemeral("Unable to delete war: " + warId)
	}
}

async function activate(slashCommand) {
	let defaultWarLengthMillis = 1000 * 60 * 40320
	let warId = null
	let start = null
	let expiration = null
	let energy = null
	let prerelease = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.size > 0) {
		if(slashCommand.subCommandArgs.get('id')) {
			warId = slashCommand.subCommandArgs.get('id')
		} else {
			return respondEphemeral('Missing or improperly formatted argument.')
		}
		if(slashCommand.subCommandArgs.get('start')) {
			if(!isNumeric(slashCommand.subCommandArgs.get('start')) || slashCommand.subCommandArgs.get('start') < 0) {
				return respondEphemeral('Improperly formatted argument.')
			}
			start = parseInt(slashCommand.subCommandArgs.get('start'))
		}  
		if(slashCommand.subCommandArgs.get('expire')) {
			if(!isNumeric(slashCommand.subCommandArgs.get('expire')) || slashCommand.subCommandArgs.get('expire') < 0) {
				return respondEphemeral('Improperly formatted argument.')
			}
			expiration = parseInt(slashCommand.subCommandArgs.get('expire'))
		} 
		if(slashCommand.subCommandArgs.get('energy')) {
			if(!isNumeric(slashCommand.subCommandArgs.get('energy')) || slashCommand.subCommandArgs.get('energy') < 0) {
				return respondEphemeral('Improperly formatted argument.')
			}
			energy = parseInt(slashCommand.subCommandArgs.get('energy'))
		}
		if(slashCommand.subCommandArgs.get('prerelease')) {
			prerelease = JSON.parse(slashCommand.subCommandArgs.get('prerelease'))
		} 
	}

	let activeWar = await warService.getActiveWar(slashCommand.guildId, currentTime)
	if(activeWar) {
		return respondEphemeral('There is already an active war on this server: ' + activeWar.warId)
	}
	let warRecord = await db.getWar(slashCommand.guildId, warId)
	let warToActivate = warRecord.Item
	if(!warToActivate) {
		return respondEphemeral('Unable to activate non-existent war: ' + warId)
	} 
	if(warToActivate.isConcluded) {
		return respondEphemeral('Unable to activate an already concluded war: ' + warId)
	}


	if(start) {
		warToActivate.start = start
	} else if(!warToActivate.start) {
		warToActivate.start = currentTime
	}
	if(expiration) {
		warToActivate.expiration = expiration
	} else if(!warToActivate.expiration) {
		warToActivate.expiration = warToActivate.start + defaultWarLengthMillis
	}
	if(energy) {
		warToActivate.energyRefreshMinutes = energy
	}
	if(prerelease) {
		warToActivate.isPreRelease = prerelease
	}
	if(warToActivate.expiration > currentTime) {
		warToActivate.isActive = true
		await db.putWar(warToActivate)
		return respondEphemeral("War " + warId + ' activated.' +
		 '\start: ' + warToActivate.start + 
		 '\nexpiration: ' + warToActivate.expiration +
		 '\nenergy: ' + warToActivate.energyRefreshMinutes +
		 '\nprerelease: ' + warToActivate.isPreRelease)
	} else {
		return respondEphemeral('This war already expired at: ' + warToActivate.expiration)
	}

}

async function deactivate(slashCommand) {
	let warId = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.size > 0) {
		if(slashCommand.subCommandArgs.get('id')) {
			warId = slashCommand.subCommandArgs.get('id')
		} else {
			return respondEphemeral('Missing or improperly formatted argument.')
		}
	}

	let warRecord = await db.getWar(slashCommand.guildId, warId)
	let retrievedWar = warRecord.Item
	if(!retrievedWar) {
		return respondEphemeral('No war found for given id: ' + warId)
	} else {
		if(retrievedWar.isActive) {
			retrievedWar.isActive = false
			await db.putWar(retrievedWar)
			return respondEphemeral('War ' + warId + ' is now deacivated.')
		} else {
			return respondEphemeral('Unable to deactivate. War ' + warId + ' is already inactive.')
		}
	}
}

async function conclude(slashCommand) {
	let warId = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.size > 0) {
		if(slashCommand.subCommandArgs.get('id')) {
			warId = slashCommand.subCommandArgs.get('id')
		} else {
			return respondEphemeral('Missing or improperly formatted argument.')
		}
	}

	let warRecord = await db.getWar(slashCommand.guildId, warId)
	let warToConclude = warRecord.Item
	if(!warToConclude) {
		return respondEphemeral('No war found with id: ' + warId)
	}
	if(warToConclude.isActive) {
		return respondEphemeral('Unable to conclude an active war.')
	}	
	if(warToConclude.isConcluded) {
		return respondEphemeral('Unable to conclude an already concluded war.')
	}
	let result = await warService.concludeWar(warToConclude)
	if(!result) {
		return respondEphemeral('An issue has occurred while trying to conclude war ' + warId)
	}
	return respondEphemeral('War ' + warId + ' has been concluded. ' + result + ' users\' server records have been updated.')
}

async function leaderboard(slashCommand) {
	let warId = null
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.size > 0) {
		if(slashCommand.subCommandArgs.get('id')) {
			warId = slashCommand.subCommandArgs.get('id')
		} else {
			return respondEphemeral('Missing or improperly formatted argument.')
		}
	}

	let warRecord = await db.getWar(slashCommand.guildId, warId)
	let retrievedWar = warRecord.Item

	if(!retrievedWar.isConcluded) {
		return respondEphemeral('Unable to reveal results of an unconcluded war.')
	}

	let responseString = '```Leaderboard'
	responseString += '\nWar: ' + retrievedWar.name
	responseString += '\n💠 - Vibranium bars\n🪨 - Vibranium ore'

	let retrievedUsers = await db.getUsers(retrievedWar.warId)
	if(retrievedUsers.Items.length > 0) {
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
	 return respond(responseString)
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
  
