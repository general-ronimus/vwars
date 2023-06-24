/**
 * VWARS DISCORD SLASH COMMAND PROCESSOR
 * 
 */

//const db = require('./vwarsDbService.js')
//const warService = require('./warService.js')
const token = process.env.DISCORD_BOT_TOKEN
const { Client, Events, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});
let currentTime = null

 
 module.exports ={
		 process
	 }
 
 async function process(event) {
	 currentTime = Date.now()
	 for (const record of event.Records) {
		 console.log("Event record: " + JSON.stringify(record))
		 let task = JSON.stringify(record.messageAttributes.task.stringValue).replace(/\"/g, "")
		 if('message' === task) {
			 await message(record)
		 } else if('conclude' === task) {
			 await conclude(record)
		 } else if('drone' === task) {
			 await drone(record)
		 }
	 }
	 return null
 }
 
 async function message(record) {
	let message = JSON.stringify(record.body).replace(/\"/g, "")
	let channelId = JSON.stringify(record.messageAttributes.channel.stringValue).replace(/\"/g, "")
	console.log('Message task received')

	client.login(token);
	let channel = await client.channels.fetch(channelId)
	//let channel = await client.channels.fetch('1046295026742853723')
	if(channel) {
		channel.send({content: message})
		console.log("Sent to channel: " + channelId + " message: " + message)
	} else {
		console.log("Unable to access channelId: " + channelId)
	}

	return null
 }
 
 async function conclude(taskPayload) {
	 console.log("Conclude command received: " + JSON.stringify(record))
	 return null
 }
 
 async function drone(taskPayload) {
	 console.log("Drone command received: " + JSON.stringify(record))
	 return null
 }
 
 