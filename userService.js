const db = require('./vwarsDbService.js')
const crypto = require('crypto');

module.exports ={
    initUser, initGuildUser, migrateUser, migrateGuildUser, initGlobalUser, migrateGlobalUser
}

function initUser(warId, slashCommand, currentTime, initialEnergy) {
	console.log('Initializing new user for warId: ' + warId + ', userId: ' + slashCommand.userId + ", username: " + slashCommand.username)
	let initializedUser = {
		warId: warId,
		userId: slashCommand.userId,
		username: slashCommand.username,
		energy: initialEnergy,
		energyUpdatedAt: currentTime, //May be able to replace with 0
		shieldUpdatedAt: currentTime, //May be able to replace with 0
	};
	return migrateUser(initializedUser)
}


function initGuildUser(guildId, userId, username) {
    console.log('Initializing new user for guildId: ' + guildId + ', userId: ' + userId + ", username: " + username)
    let initializedGuildUser = {
        guildId: guildId,
        userId: userId,
        username: username,
        titles: [],
    }   
    return migrateGuildUser(initializedGuildUser)
}

function initGlobalUser(slashCommand, currentTime, initialEnergy) {
	console.log('Initializing new global user - userId: ' + slashCommand.userId + ", username: " + slashCommand.username)
	let initializedUser = {
		userId: slashCommand.userId,
		username: slashCommand.username,
		energy: initialEnergy,
		energyUpdatedAt: currentTime, //May be able to replace with 0
	};
	return migrateGlobalUser(initializedUser)
}

function migrateUser(user) {

	let attributes = [
		'ore', 'bar', 'city', 'military', 'energy', 'energyUpdatedAt', 'shieldUpdatedAt', 'shieldHealth',
		'lastFueled', 'lastCloaked', 'lastStealthed', 'lastJammed', 'lastShattered', 'equipmentFuel',
		'equipmentCloak', 'equipmentStealth', 'equipmentJam', 'equipmentShield', 'equipmentSabotage',
		'equipmentStrike', 'equipmentNuke','netMined', 'netStolen', 'netCityDamage', 'netMilitaryDamage', 'netMine', 'netAttack', 'netRout', 
		'netShatter', 'netEquipmentSteal', 'netFuel', 'netCloak', 'netStealth', 'netJam', 'netShield', 'netSabotage', 'netStrike', 'netNuke',
		'structFuelDepot', 'structResearchFacility', 'structReinforcedHangar', 'structCommsArray', 'structNavalBase', 
		'structMunitionsDepot', 'structSupercapacitors', 'structNuclearSilo', 'structAEWCHangar', 'structEMPTower', 
		'structArmoredVehicleDepot', 'structCommandCenter'
	];
	
	attributes.forEach(attribute => {
		if(user[attribute] === undefined) {
			user[attribute] = 0
		}
	});

	if(user.energy === undefined) {
		user.energy = maxEnergy
	}
		
	return user
}

function migrateGuildUser(user) {
	
	let attributes = [
		'barHistoricalVibranium', 'barVibranium', 'medalFirst', 'medalSecond', 'medalThird', 'medalStar', 'wars', 
		'netMined', 'netStolen', 'netCityDamage', 'netMilitaryDamage', 'netMine', 'netAttack', 'netRout', 'netShatter', 'netEquipmentSteal', 
		'netFuel', 'netCloak', 'netStealth', 'netJam', 'netShield', 'netSabotage', 'netStrike', 'netNuke', 
		'population', 'structFuelDepot', 'structResearchFacility', 'structReinforcedHangar', 'structCommsArray', 
		'structNavalBase', 'structMunitionsDepot', 'structSupercapacitors', 'structNuclearSilo', 'structAEWCHangar', 'structEMPTower', 
		'structArmoredVehicleDepot', 'structCommandCenter', 
		'oreUranium', 'barUranium', 'oreBeryllium', 'barBeryllium', 'oreGold', 'barGold', 'oreSilver', 
		'barSilver', 'oreTungsten', 'barTungsten', 'oreTitanium', 'barTitanium', 'oreCobalt', 'barCobalt', 'oreCopper', 
		'barCopper', 'oreLead', 'barLead', 'oreIron', 'barIron', 'oreAluminum', 'barAluminum'
	];
	
	attributes.forEach(attribute => {
		if(user[attribute] === undefined) {
			user[attribute] = 0
		}
	});
		
	return user
}

function migrateGlobalUser(user) {

	let attributes = [
		'energy', 
		'energyUpdatedAt',
		'lastMinedOreType',
		'medalFirst', 
		'medalSecond', 
		'medalThird',
		'titles',
		'wars',
		'netMined',
		'netStolen',
		'netCityDamage',
		'netMilitaryDamage',
		'netAttack',
		'netRout',
		'netShatter',
		'netEquipmentSteal',
		'netFuel',
		'netCloak',
		'netStealth',
		'netJam',
		'netShield',
		'netSabotage',
		'netStrike',
		'netNuke',
		'population',
		'structFuelDepot',
		'structResearchFacility',
		'structReinforcedHangar',
		'structCommsArray',
		'structNavalBase',
		'structMunitionsDepot',
		'structSupercapacitors',
		'structNuclearSilo',
		'structAEWCHangar',
		'structEMPTower',
		'structArmoredVehicleDepot',
		'structCommandCenter',
		'oreAluminum',
		'netMinedAluminum',
		'barAluminum',
		'oreLead',
		'netMinedLead',
		'barLead',
		'oreIron',
		'netMinedIron',
		'barIron',
		'oreCopper',
		'netMinedCopper',
		'barCopper',
		'oreSilver',
		'netMinedSilver',
		'barSilver',
		'oreGold',
		'netMinedGold',
		'barGold',
		'oreCobalt',
		'netMinedCobalt',
		'barCobalt',
		'oreTungsten',
		'netMinedTungsten',
		'barTungsten',
		'oreTitanium',
		'netMinedTitanium',
		'barTitanium',
		'oreBeryllium',
		'netMinedBeryllium',
		'barBeryllium',
		'barUranium',
		'netMinedUranium',
		'oreUranium',
		'oreVibranium',
		'netMinedVibranium',
		'barVibranium',
		'barHistoricalVibranium',
		'creditVibranium'
	];
	
	
	attributes.forEach(attribute => {
		if(user[attribute] === undefined) {
			user[attribute] = 0
		}
	});

	if(user.energy === undefined) {
		user.energy = maxEnergy
	}
		
	return user
}