/**
 * VWARS DISCORD SLASH COMMAND PROCESSOR
 * 
 */

 const db = require('./vwarsDbService.js')
 const warService = require('./warService.js')
 //const token = process.env.DISCORD_BOT_TOKEN
 const token = 'MTA0NjA4Nzc2NjA2MjE0OTY5Mw.GGCErS.G8e9v2BfFFGza0-rNgC3AehfGqso_KbzLhCb9k'
 let currentTime = null
 // Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Log in to Discord with your client's token

 
 module.exports ={
		 process
	 }
 
 async function process(event) {
	 
	 currentTime = Date.now()
	 for (const record of event.Records) {
		 console.log("Message record: " + JSON.stringify(record))
		 let taskPayload = JSON.parse(record.body)
		 if('message' === taskPayload.task) {
			 await message(taskPayload)
		 } else if('conclude' === taskPayload.task) {
			 await conclude(taskPayload)
		 } else if('drone' === taskPayload.task) {
			 await drone(taskPayload)
		 }
	 }
	 return null
 }
 
 async function message(taskPayload) {
	console.log("Message command received: " + JSON.stringify(taskPayload))
	client.login(token);
	//let channel = await client.channels.fetch(taskPayload.channelId)
	let channel = await client.channels.fetch('1046295026742853723')
	channel.send({content: "Example Message"})
	return null
 }
 
 async function conclude(recordBody) {
	 console.log("Conclude command received: " + JSON.stringify(recordBody))
	 return null
 }
 
 async function drone(recordBody) {
	 console.log("Drone command received: " + JSON.stringify(recordBody))
	 return null
 }
 
 