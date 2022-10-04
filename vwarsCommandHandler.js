//Discord application command handler
const db = require('./vwarsDbService.js')

const mineMap = new Map([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 10], [7, 20], [8, 50], [9,0]]);

module.exports ={
        handle
    }

async function handle(slashCommandBody) {
	console.log('Slash command body: ' + JSON.stringify(slashCommandBody))
	let userId = JSON.stringify(slashCommandBody.member.user.id).replace(/\"/g, "")
	let username = JSON.stringify(slashCommandBody.member.user.username).replace(/\"/g, "")
	let command = JSON.stringify(slashCommandBody.data.name).replace(/\"/g, "");
	let subCommand = JSON.stringify(slashCommandBody.data.options[0].name).replace(/\"/g, "");
	let targetUserId = null
	let wager = 1
	if(('attack' == subCommand || 'stats' == subCommand) && slashCommandBody.data.options[0].hasOwnProperty('options') 
		&& slashCommandBody.data.options[0].options.length > 0) {
		targetUserId = JSON.stringify(slashCommandBody.data.options[0].options[0].value).replace(/\"|@|<|>|!/g, "")
	}
	if(('build' == subCommand || 'train' == subCommand) && slashCommandBody.data.options[0].hasOwnProperty('options')
		&& slashCommandBody.data.options[0].options.length > 0) {
		wager = JSON.stringify(slashCommandBody.data.options[0].options[0].value).replace(/\"|@|<|>|!/g, "")
	}

	console.log('Requested command: ' + command + ' ' + subCommand)
	let userRecord = await db.getUser(userId)
	let user = userRecord.Item
	let currentTime = Date.now()
	console.log('Retrieved user: ' + JSON.stringify(user))

	if( null == user) {
		user = {
			userid: userId,
			username: username,
			ore: 1,
			city: 1,
			military: 1,
			energy: 20,
			energyUpdatedAt: currentTime
		}
		await db.putUser(user)
		console.log('Created user: ' + JSON.stringify(user))
	}
	const energyInterval = 300000
	//const energyInterval = 30000
	if(currentTime > user.energyUpdatedAt + energyInterval) {
		let timePassed = currentTime - user.energyUpdatedAt
		let energyGain = Math.floor(timePassed / energyInterval)
		let timeRemainder = timePassed % energyInterval
		if(user.energy + energyGain > 20) {
			user.energy = 20
		} else {
			user.energy = user.energy + energyGain
		}
		user.energyUpdatedAt = currentTime - timeRemainder
	} 

	if('mine' === subCommand) {
		console.log('Executing mine subcommand')
		if(user.energy < 1) {
			return respond('You do not have enough energy')
		}
		let result = randomInteger(1, 9)
		let minedOre = mineMap.get(result)
		user.energy -= 1
		user.ore += minedOre
		await db.putUser(user)
		return respond('You found ' + minedOre +  ' vibranium!')
	} else if('build' === subCommand) {
		console.log('Executing build subcommand')
		if(user.energy < 1) {
			return respond('You do not have enough energy')
		}
		if(!isNumeric(wager)) {
			return respond('Must be a numeric value')
		}
		wager = parseInt(wager)
		if(user.ore < wager) {
			return respond('You do not have enough vibranium')
		}

		user.energy -= 1
		user.ore -= wager
		user.city += wager
		await db.putUser(user)
		return respond('Your city is now size ' + user.city + ', you have ' + user.ore + ' vibranium remaining.')
	} else if('train' === subCommand) {
		console.log('Executing train subcommand')
		if(user.energy < 1) {
			return respond('You do not have enough energy')
		}
		if(!isNumeric(wager)) {
			return respond('Must be a numeric value')
		}
		wager = parseInt(wager)
		if(user.ore < wager) {
			return respond('You do not have enough vibranium')
		}
		user.energy -= 1
		user.ore -= wager
		user.military += wager
		await db.putUser(user)
		return respond('Your military is now size ' + user.military + ', you have ' + user.ore + ' vibranium remaining.')
	} else if('attack' === subCommand) {
		console.log('Executing attack subcommand')
		if(user.energy < 1) {
			return respond('You do not have enough energy')
		}
		let targetUserRecord = await db.getUser(targetUserId)
		let targetUser = targetUserRecord.Item
		if(null == targetUser || targetUserId == userId) {
			return respond('Not a valid target')
		}
		let conflict = user.military + targetUser.city
		let gainsPercentage = user.military/conflict * 0.15
		stolenOre = Math.round(targetUser.ore * gainsPercentage)
		user.ore += stolenOre
		targetUser.ore -= stolenOre
		user.energy -= 1
		await db.putUser(user)
		await db.putUser(targetUser)
		return respond('You have stolen ' + stolenOre + ' vibranium from ' + targetUser.username + '!')
	} else if('stats' === subCommand) {
		console.log('Executing stats subcommand')
		let statsUser = user
		if(null != targetUserId) {
			let targetUserRecord = await db.getUser(targetUserId)
			let targetUser = targetUserRecord.Item
			if(null == targetUser) {
				return respond('Not a valid target')
			}
			statsUser = targetUser
		}
			return respond('Statistics for ' + statsUser.username +
				'\nTotal Vibranium: ' + statsUser.ore + 
				'\nCity size: ' + statsUser.city + 
				'\nMilitary size: ' + statsUser.military +
				'\nEnergy: ' + statsUser.energy)
	} else if('leaderboard' === subCommand) {
		let responseString = 'Vibranium Wars Leaderboard'
		let retrievedUsers = await db.getUsers()
		retrievedUsers.Items.sort(compare).forEach(function(user) {
			responseString = responseString.concat('\n', user.username + ': ' + user.ore)
		 });
		 console.log(responseString)
		 return respond(responseString)
	}

	return respond('Invalid command')
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

function compare( a, b ) {
	if ( a.ore < b.ore ){
	  return 1;
	}
	if ( a.ore > b.ore ){
	  return -1;
	}
	return 0;
  }
  
