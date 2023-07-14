/**
 * VWARS TASK MASTER, A POST PROCESSING PROGRAM
 * 
 */

const token = process.env.DISCORD_BOT_TOKEN
const { Client, Events, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let readyPromise = new Promise((resolve, reject) => {
	client.once(Events.ClientReady, c => {
		console.log(`Ready! Logged in as ${c.user.tag}`);
		resolve();
	});
});
	client.login(token);
let currentTime = null
 
 module.exports ={
	processTask
	}
 
 async function processTask(event) {
	await readyPromise
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
	return
 }
 
 async function message(record) {
	let message = record.body.replace(/\"/g, "")
	let channelId = JSON.stringify(record.messageAttributes.channel.stringValue).replace(/\"/g, "")
	console.log('Message task received')

	let channel = await client.channels.fetch(channelId)
	if(channel) {
		try {
			let result = await channel.send({content: message});
			console.log(`Message sent: ${result.content}`);
		} catch (error) {
			console.error(`Failed to send message: ${error}`);
		}
	} else {
		console.log("Unable to access channelId: " + channelId)
	}
	return
 }
 
 async function conclude(taskPayload) {
	 console.log("Conclude command received: " + JSON.stringify(record))
	 return null
 }
 
 async function drone(taskPayload) {
	 console.log("Drone command received: " + JSON.stringify(record))
	 return null
 }
 
 