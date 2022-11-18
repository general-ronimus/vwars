const db = require('./vwarsDbService.js')
const crypto = require('crypto');

module.exports ={
    getActiveWar, createWar, createInitialWar, createNextWar, concludeWar, initGuildUser
}

async function getActiveWar(guildId, currentTime) {
    let activeWar = null
    let wars = await db.getWars(guildId)
    if(wars.Items.length < 1) {
        activeWar = createInitialWar(guildId)
    } else {
        wars.Items.forEach(function(war) {
            if(war.isActive) {
                activeWar = war
            }
        })
    }
    
    if(activeWar && activeWar.expiration && activeWar.expiration <= currentTime) {
        await concludeWar(activeWar)
        //activeWar.isActive = false
        //await db.putWar(activeWar)
        activeWar = await createNextWar(activeWar)
    }
    return activeWar
}

/**
 * Create war
 * @param {*} requestedWar 
 * requestedWar {
 *  uuid,
 *  name,
 *  start,
 *  expiration,
 *  energyRefreshMinutes,
 *  isActive,
 *  iteration
 * }
 * @returns 
 */
async function createWar(requestedWar) {
    let uuid = crypto.randomUUID()
	let name = uuid
    let start = null
	let expiration = null
	let energyRefreshMinutes = 5
    let isActive = false
    let iteration = 1
    if(requestedWar.name) {
        name = requestedWar.name
    }
    if(requestedWar.start) {
        start = requestedWar.start
    }
    if(requestedWar.expiration) {
        expiration = requestedWar.expiration
    }
    if(requestedWar.energyRefreshMinutes) {
        energyRefreshMinutes = requestedWar.energyRefreshMinutes
    }
    if(requestedWar.isActive) {
        isActive = requestedWar.isActive
    }
    if(requestedWar.iteration) {
        iteration = requestedWar.iteration
    }
    
	let initializedWar = {
		guildId: requestedWar.guildId,
		warId: uuid,
		name: name,
        start: start,
		expiration: expiration,
		isActive: isActive,
		energyRefreshMinutes: energyRefreshMinutes,
        iteration: iteration
	};
    console.log('Creating new war: ' + JSON.stringify(initializedWar))
	return await db.putWar(initializedWar)
}


async function createInitialWar(guildId) {
    let startDate = new Date()
    startDate.setUTCHours(0, 0, 0, 0)
    let endDate = new Date()
    endDate.setDate(startDate.getDate() + 28)
    endDate.setUTCHours(0, 0, 0, 0)
    
    let requestedWar = {
        guildId: guildId,
		name: 'War',
        iteration: '1',
		isActive: true,
        start: startDate.getMilliseconds,
        expiration: endDate.getMilliseconds 
    }
	return await createWar(requestedWar)
}

async function createNextWar(previousWar) {

    let startDate = new Date(previousWar.expiration)
    let proposedEndDate = new Date(previousWar.expiration)
    proposedEndDate.setDate(startDate + 35)
    proposedEndDate.setUTCHours(0, 0, 0, 0)
    if(Date.now() >= proposedEndDate.getMilliseconds) {
        startDate = new Date()
    }
    startDate.setDate(startDate.getDate() + 7)
    startDate.setUTCHours(0, 0, 0, 0)
    let endDate = new Date()
    endDate.setDate(startDate.getDate() + 28)
    endDate.setUTCHours(0, 0, 0, 0)

    let isActive = false
    if(Date.now() >= startDate && Date.now() < endDate) {
        isActive = true
    }

    let requestedWar = {
        guildId: previousWar.guildId,
		name: previousWar.name,
		isActive: isActive,
        start: startDate.getMilliseconds,
        expiration: endDate.getMilliseconds,
        iteration: previousWar.iteration + 1 
    }
	return await createWar(requestedWar)
}

async function concludeWar(activeWar) {
    activeWar.isActive = false
    activeWar.isConcluded = true
    await db.putWar(activeWar)
    let users = db.getUsers(activeWar.warId)
    let firstIssued = false
    let secondIssued = false
    let thirdIssued = false

    users.Items.map(function(user) {
        let assets = user.ore + user.city + user.military
        user.bar += Math.floor(assets / 10000)        
    }).sort(compare).forEach(function(user) {
        let guildUser = db.getGuildUser(activeWar.guildId, user.userId)
        if(!guildUser) {
            guildUser = initGuildUser(activeWar.guildId, user.userId, user.username)
        }

        guildUser.barHistoricalVibranium += user.bar
        guildUser.barVibranium += user.bar
        guildUser.wars += 1
        guildUser.netMined += user.netMined
        guildUser.netStolen += user.netStolen
        guildUser.netCityDamage += user.netCityDamage
        guildUser.netMilitaryDamage += user.netMilitaryDamage
        guildUser.netFuel += user.netFuel
        guildUser.netCloak += user.netCloak
        guildUser.netShield += user.netShield
        guildUser.netSabotage += user.netSabotage
        guildUser.netStrike += user.netStrike
        guildUser.netNuke += user.netNuke

        if(!firstIssued) {
            let bonusBars = Math.ceil(user.bar * .30)
            //guildUser.barHistoricalVibranium += bonusBars
            guildUser.barVibranium += bonusBars
            guildUser.medalFirst += 1
        } else if(!secondIssued) {
            let bonusBars = Math.ceil(user.bar * .20)
            //guildUser.barHistoricalVibranium += bonusBars
            guildUser.barVibranium += bonusBars
            guildUser.medalSecond += 1
        } else if(!thirdIssued) {
            let bonusBars = Math.ceil(user.bar * .10)
            //guildUser.barHistoricalVibranium += bonusBars
            guildUser.barVibranium += bonusBars
            guildUser.medalThird += 1
        }
        db.putGuildUser(guildUser)
    })

}

function compare( a, b ) {
    if ( a.bar < b.bar ){ 
        return 1;
    }
    if ( a.bar > b.bar ){
        return -1;
    }
    return 0;
}
  
function initGuildUser(guildId, userId, username) {
    console.log('Initializing new user for guildId: ' + guildId + ', userId: ' + userId + ", username: " + username)
    let initializedUser = {
        guildId: guildId,
        userId: userId,
        username: username,
        barHistoricalVibranium: 0,
        barVibranium: 0,
        medalFirst: 0,
        medalSecond: 0,
        medalThird: 0,
        wars: 0,
        titles: [],
        netMined : 0,
        netStolen : 0,
        netCityDamage : 0,
        netMilitaryDamage : 0,
        netFuel : 0,
        netCloak : 0,
        netShield : 0,
        netSabotage : 0,
        netStrike : 0,
        netNuke : 0
    }   
    return initializedUser
}
    

