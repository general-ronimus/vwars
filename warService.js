const db = require('./vwarsDbService.js')
const crypto = require('crypto');

module.exports ={
    warsExist, getActiveWar, createWar, createDefaultActiveWar
}

async function warsExist(guildId) {
    let wars = await db.getWars(guildId)
    if(wars.Items.length > 0) {
        return true
    }
    return false
}

async function getActiveWar(guildId, currentTime) {
    let wars = await db.getWars(guildId)
    let activeWar = null
    wars.Items.forEach(function(war) {
        if(war.isActive) {
            activeWar = war
        }
    })
    if(activeWar.expiration && activeWar.expiration <= currentTime) {
        activeWar.isActive = false
        await db.putWar(activeWar)
        return null
    }
    return activeWar
}

/**
 * Create war
 * @param {*} requestedWar 
 * requestedWar {
 *  uuid,
 *  name,
 *  expiration,
 *  energyRefreshMinutes,
 *  cycleTimeMinutes,
 *  isActive
 * }
 * @returns 
 */
async function createWar(requestedWar) {
    let uuid = crypto.randomUUID()
	let name = uuid
	let expiration = null
	let energyRefreshMinutes = 10
	let cycleTimeMinutes = 240
    let isActive = false
    if(requestedWar.name) {
        name = requestedWar.name
    }
    if(requestedWar.expiration) {
        expiration = requestedWar.expiration
    }
    if(requestedWar.energyRefreshMinutes) {
        energyRefreshMinutes = requestedWar.energyRefreshMinutes
    }
    if(requestedWar.cycleTimeMinutes) {
        cycleTimeMinutes = requestedWar.cycleTimeMinutes
    }
    if(requestedWar.isActive) {
        isActive = requestedWar.isActive
    }
    
	let initializedWar = {
		guildId: requestedWar.guildId,
		warId: uuid,
		name: name,
		expiration: expiration,
		isActive: isActive,
		energyRefreshMinutes: energyRefreshMinutes,
		cycleTimeMinutes: cycleTimeMinutes
	};
    console.log('Creating new war: ' + JSON.stringify(initializedWar))
	return await db.putWar(initializedWar)
}


async function createDefaultActiveWar(guildId) {
    let requestedWar = {
        guildId: guildId,
		name: 'default',
		isActive: true 
    }
	return await createWar(requestedWar)
}