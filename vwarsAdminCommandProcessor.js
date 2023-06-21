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
	
	/* Comment out as we will likely use the create function from war service
	let name = null
	let expiration = null
	let energyRefreshMinutes = 10
	let cycleTimeMinutes = 240
	if(null != slashCommand.subCommandArgs && slashCommand.subCommandArgs.length > 0) {
		if(slashCommand.subCommandArgs[0].length > 0) {
			name = slashCommand.subCommandArgs[0]
		} else {
			return respond('Missing or improperly formatted argument.')
		}
		if(slashCommand.subCommandArgs[1].length > 0 && isNumeric(slashCommand.subCommandArgs[1])) {
			expiration = slashCommand.subCommandArgs[1]
		} else {
			return respond('Missing or improperly formatted argument.')
		}
	}
	let uuid = crypto.randomUUID
	let initializedWar = {
		guildId: slashCommand.guildId,
		warId: uuid,
		name: name,
		expiration: expiration,
		isActive: false,
		energyRefreshMinutes: energyRefreshMinutes,
		cycleTimeMinutes: cycleTimeMinutes
	};
	await db.putWar(initializedWar)
	*/
	return respond("Create command coming soon!")
}

async function list(slashCommand) {
	return respond("List command coming soon!")
}

async function remove(slashCommand) {
	return respond("Delete command coming soon!")
}

async function activate(slashCommand) {
	return respond("Activate command coming soon!")
}

async function deactivate(slashCommand) {
	return respond("Deactivate command coming soon!")
}

async function conclude(slashCommand) {
	return respond("Conclude command coming soon!")
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
  
