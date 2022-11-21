/**
 * VWARS DISCORD SLASH COMMAND PROCESSOR
 * 
 */

const db = require('./vwarsDbService.js')
const warService = require('./warService.js')
let currentTime = null

module.exports ={
        process
    }

async function process(eventBody) {
	currentTime = Date.now()
	if('message' === eventBody.task) {
		message(eventBody)
	} else if('conclude' === eventBody.task) {
		conclude(eventBody)
	} else if('drone' === eventBody.task) {
		drone(eventBody)
	}
}

async function message(eventBody) {
	return null
}

async function conclude(eventBody) {
	return null
}

async function drone(eventBody) {
	return null
}

