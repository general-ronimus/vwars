/**
 * VWARS ADMIN DISCORD SLASH COMMAND PROCESSOR
 * 
 */

const crypto = require('crypto');
const db = require('./vwarsDbService.js')

let currentTime = null

module.exports ={
        process
    }


async function process(slashCommandBody) {
	currentTime = Date.now()
	let slashCommand = parseSlashCommand(slashCommandBody)
	//TODO: If no guild exists, go ahead and create guild with no active war

	if('create' === slashCommand.subCommand) {
		return await create(user, slashCommand)
	} else if('list' === slashCommand.subCommand) {
		return await list(user, slashCommand)
	} else if('delete' === slashCommand.subCommand) {
		return await delete(user, slashCommand)
	} else if('activate' === slashCommand.subCommand) {
		return await activate(user, slashCommand)
	} else if('deactivate' === slashCommand.subCommand) {
		return await deactivate(user, slashCommand)
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
 * theatre create [name]
create a new theatre of war, with name of [name]. Theatres are created in deactivated state
theatre list
list theatres associated with this guild, * indicates the active theatre -theatre delete [name]
end a theatre [name], prompt admin on whether to issue medals
🥇🥈🥉 final top three
🎖 most overall market control
🏅 most vibranium at any point
theatre activate [name] [expiration]
make theatre [name] the active theatre, optionally have the theatre auto-deactivate on [expiration]
theatre deactivate
deactivate the active theatre
theatre leaderboard [name]
display the leaderboard for theatre [name]
theatre cycle [name] [hours]
set market cycle length to [hours] for theatre [name]. Default is random between 1 and 24. When a market cycle concludes, winners for that specific cycle gain an equipment chest
 */

/**
 * VWARS ADMIN SUBCOMMANDS
 * 
 */
 

/**
 * create [name] [expiration]
 * Create a new war with name and expiration
 */
async function create(user, slashCommand) {
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
	return respond("New war created!")
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
  
