const db = require('./vwarsDbService.js')
const userService = require('./userService.js')
const crypto = require('crypto');

module.exports ={
    getActiveWar, createWar, createInitialWar, createNextWar, concludeWar, migrateWar
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
    let isConcluded = false
    let iteration = 1
    let speed = 1
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
    if(requestedWar.isConcluded) {
        isConcluded = requestedWar.isConcluded
    }
    if(requestedWar.iteration) {
        iteration = requestedWar.iteration
    }
    if(requestedWar.speed) {
        speed = requestedWar.speed
    }
    
	let initializedWar = {
		guildId: requestedWar.guildId,
		warId: uuid,
		name: name,
        start: start,
		expiration: expiration,
		isActive: isActive,
        isConcluded: isConcluded,
		energyRefreshMinutes: energyRefreshMinutes,
        iteration: iteration,
        speed: speed
	};
    console.log('Creating new war: ' + JSON.stringify(initializedWar))
	await db.putWar(initializedWar)
    return initializedWar
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
        isConcluded: false,
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

async function concludeWar(warToConclude) {
    let users = await db.getUsers(warToConclude.warId)
    let firstIssued = false
    let secondIssued = false
    let thirdIssued = false
    let guildUsersUpdated = 0

    /*
    users.Items.map(function(user) {
        let assets = user.ore + user.city + user.military
        user.bar += Math.floor(assets / 10000)        
    }).sort(compare).forEach(function(user) {
        */
       
    if( users.Items.length > 0) {
        for (let user of users.Items.sort(compare)) {
            user = userService.migrateUser(user)
            let guildUserRecord = await db.getGuildUser(warToConclude.guildId, user.userId)
            let guildUser = guildUserRecord.Item
            if(!guildUser) {
                guildUser = userService.initGuildUser(warToConclude.guildId, user.userId, user.username)
            } else {
                guildUser = userService.migrateGuildUser(guildUser)
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
            guildUser.netStealth += user.netStealth
            guildUser.netJam += user.netJam
            guildUser.netShield += user.netShield
            guildUser.netSabotage += user.netSabotage
            guildUser.netStrike += user.netStrike
            guildUser.netNuke += user.netNuke
    
            if(!firstIssued) {
                /*
                let bonusBars = Math.ceil(user.bar * .30)
                guildUser.barHistoricalVibranium += bonusBars
                guildUser.barVibranium += bonusBars
                */
                guildUser.medalFirst += 1
                firstIssued = true
            } else if(!secondIssued) {
                /*
                let bonusBars = Math.ceil(user.bar * .20)
                guildUser.barHistoricalVibranium += bonusBars
                guildUser.barVibranium += bonusBars
                */
                guildUser.medalSecond += 1
                secondIssued = true
            } else if(!thirdIssued) {
                /*
                let bonusBars = Math.ceil(user.bar * .10)
                guildUser.barHistoricalVibranium += bonusBars
                guildUser.barVibranium += bonusBars
                */
                guildUser.medalThird += 1
                thirdIssued = true
            }
            let result = await db.putGuildUser(guildUser)
            if(result) {
                guildUsersUpdated += 1
            }
        }
    }   
    warToConclude.isConcluded = true
    let result = await db.putWar(warToConclude)
    if(result) {
        return guildUsersUpdated
    } else {
        return null
    }
}

function migrateWar(war) {
	if(war.name === undefined) {
		war.name = 'Unamed war'
	}
    if(war.start === undefined) {
		war.start = 0
	}
    if(war.expiration === undefined) {
		war.expiration = 0
	}
    if(war.isActive === undefined) {
		war.isActive = false
	}
    if(war.isConcluded === undefined) {
		war.isConcluded = false
	}
    if(war.energyRefreshMinutes === undefined) {
		war.energyRefreshMinutes = 5
	}
    if(war.speed === undefined) {
		war.speed = 1
	}
    return war
}

function compare( a, b ) {
    if ( a.bar < b.bar ){ 
        return 1;
    }
    if ( a.bar > b.bar ){
        return -1;
    }

    if ( a.ore < b.ore ){ 
		return 1;
	}
	if ( a.ore > b.ore ){
	  	return -1;
	}
    return 0;
}
  

    

