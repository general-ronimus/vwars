const db = require('./vwarsDbService.js')
const crypto = require('crypto');

module.exports ={
    initUser, initGuildUser, migrateUser, migrateGuildUser
}

function initUser(warId, slashCommand, currentTime, initialEnergy) {
	console.log('Initializing new user for warId: ' + warId + ', userId: ' + slashCommand.userId + ", username: " + slashCommand.username)
	let initializedUser = {
		warId: warId,
		userId: slashCommand.userId,
		username: slashCommand.username,
		ore: 1,
		bar: 0,
		city: 1,
		military: 1,
		energy: initialEnergy,
		energyUpdatedAt: currentTime, //May be able to replace with 0
		shieldUpdatedAt: currentTime, //May be able to replace with 0
		shieldHealth: 0,
		lastFueled: 0,
		lastCloaked: 0,
		lastStealthed: 0,
		lastJammed: 0,
		lastShattered: 0,
		equipmentFuel: 0,
		equipmentCloak: 0,
		equipmentStealth: 0,
		equipmentJam: 0,
		equipmentShield: 0,
		equipmentSabotage: 0,
		equipmentStrike: 0,
		equipmentNuke: 0,
		netMined : 0,
		netStolen : 0,
		netCityDamage : 0,
		netMilitaryDamage : 0,
		netMine: 0,
		netAttack: 0,
		netRout: 0,
		netFuel : 0,
		netCloak : 0,
		netStealth: 0,
		netShield : 0,
		netSabotage : 0,
		netStrike : 0,
		netNuke : 0
	};

	return initializedUser
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
        netStealth : 0,
        netJam : 0,
        netShield : 0,
        netSabotage : 0,
        netStrike : 0,
        netNuke : 0
    }   
    return initializedUser
}

function migrateUser(user) {
	if(user.ore === undefined) {
		user.ore = 0
	}
	if(user.bar === undefined) {
		user.bar = 0
	}
	if(user.city === undefined) {
		user.city = 0
	}
	if(user.military === undefined) {
		user.military = 0
	}
	if(user.energy === undefined) {
		user.energy = maxEnergy
	}
	if(user.energyUpdatedAt === undefined) {
		user.energyUpdatedAt = 0
	}
	if(user.shieldUpdatedAt === undefined) {
		user.shieldUpdatedAt = 0
	}
	if(user.shieldHealth === undefined) {
		user.shieldHealth = 0
	}
	if(user.lastFueled === undefined) {
		user.lastFueled = 0
	}
	if(user.lastCloaked === undefined) {
		user.lastCloaked = 0
	}
	if(user.lastStealthed === undefined) {
		user.lastStealthed = 0
	}
	if(user.lastJammed === undefined) {
		user.lastJammed = 0
	}
	if(user.lastShattered === undefined) {
		user.lastShattered = 0
	}
	if(user.equipmentFuel === undefined) {
		user.equipmentFuel = 0
	}
	if(user.equipmentCloak === undefined) {
		user.equipmentCloak = 0
	}
	if(user.equipmentStealth === undefined) {
		user.equipmentStealth = 0
	}
	if(user.equipmentJam === undefined) {
		user.equipmentJam = 0
	}
	if(user.equipmentShield === undefined) {
		user.equipmentShield = 0
	}
	if(user.equipmentSabotage === undefined) {
		user.equipmentSabotage = 0
	}
	if(user.equipmentStrike === undefined) {
		user.equipmentStrike = 0
	}
	if(user.netMined === undefined) {
		user.netMined = 0
	}
	if(user.netStolen === undefined) {
		user.netStolen = 0
	}
	if(user.netCityDamage === undefined) {
		user.netCityDamage = 0
	}
	if(user.netMilitaryDamage === undefined) {
		user.netMilitaryDamage = 0
	}
	if(user.netMine === undefined) {
		user.netMine = 0
	}
	if(user.netAttack === undefined) {
		user.netAttack = 0
	}
	if(user.netRout === undefined) {
		user.netRout = 0
	}
	if(user.netFuel === undefined) {
		user.netFuel = 0
	}
	if(user.netCloak === undefined) {
		user.netCloak = 0
	}
	if(user.netStealth === undefined) {
		user.netStealth = 0
	}
	if(user.netJam === undefined) {
		user.netJam = 0
	}
	if(user.netShield === undefined) {
		user.netShield = 0
	}
	if(user.netSabotage === undefined) {
		user.netSabotage = 0
	}
	if(user.netStrike === undefined) {
		user.netStrike = 0
	}
	if(user.netNuke === undefined) {
		user.netNuke = 0
	}
		
	return user
}

function migrateGuildUser(user) {
	if(user.barHistoricalVibranium === undefined) {
		user.barHistoricalVibranium = 0
	}
	if(user.barVibranium === undefined) {
		user.barVibranium = 0
	}
	if(user.medalFirst === undefined) {
		user.medalFirst = 0
	}
	if(user.medalSecond === undefined) {
		user.medalSecond = 0
	}
	if(user.medalThird === undefined) {
		user.medalThird = maxEnergy
	}
	if(user.wars === undefined) {
		user.wars = 0
	}
	if(user.titles === undefined) {
		user.titles = []
	}
	if(user.netMined === undefined) {
		user.netMined = 0
	}
	if(user.netStolen === undefined) {
		user.netStolen = 0
	}
	if(user.netCityDamage === undefined) {
		user.netCityDamage = 0
	}
	if(user.netMilitaryDamage === undefined) {
		user.netMilitaryDamage = 0
	}
	if(user.netMine === undefined) {
		user.netMine = 0
	}
	if(user.netAttack === undefined) {
		user.netAttack = 0
	}
	if(user.netRout === undefined) {
		user.netRout = 0
	}
	if(user.netFuel === undefined) {
		user.netFuel = 0
	}
	if(user.netCloak === undefined) {
		user.netCloak = 0
	}
	if(user.netStealth === undefined) {
		user.netStealth = 0
	}
	if(user.netJam === undefined) {
		user.netJam = 0
	}
	if(user.netShield === undefined) {
		user.netShield = 0
	}
	if(user.netSabotage === undefined) {
		user.netSabotage = 0
	}
	if(user.netStrike === undefined) {
		user.netStrike = 0
	}
	if(user.netNuke === undefined) {
		user.netNuke = 0
	}
		
	return user
}