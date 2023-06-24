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
		 let task = JSON.stringify(record.messageAttributes.task)
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
	let message = JSON.stringify(record.body)
	let channelId = JSON.stringify(record.messageAttributes.channel)
	console.log('Message task received')

	client.login(token);
	let channel = await client.channels.fetch(channelId)
	//let channel = await client.channels.fetch('1046295026742853723')
	channel.send({content: message})
	console.log("Sent to channel: " + channelId + " message: " + message)
	return null
 }
 
 async function conclude(taskPayload) {
	 console.log("Conclude command received: " + JSON.stringify(taskPayload))
	 return null
 }
 
 async function drone(taskPayload) {
	 console.log("Drone command received: " + JSON.stringify(taskPayload))
	 return null
 }
 
 