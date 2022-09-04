const fs = require("fs");
const index = require('./index')
const slashCommandHandler = require('./slashCommandHandler')

main()
async function main() {
    const eventPingString = fs.readFileSync("main/sampleEventPing.json")
    const eventPingObject = JSON.parse(eventPingString)
    const eventPingResponse = await index.processEvent(eventPingObject)
    console.log(eventPingResponse)
    
    const eventSlashCommandString = fs.readFileSync("main/sampleEventSlashCommand.json")
    const eventSlashCommandObject = JSON.parse(eventSlashCommandString)
    const eventSlashCommandResponse = await index.processEvent(eventSlashCommandObject)
    console.log(eventSlashCommandResponse)
    
    const eventSlashCommandAttackString = fs.readFileSync("main/sampleEventSlashCommand_attack.json")
    const eventSlashCommandAttackObject = JSON.parse(eventSlashCommandAttackString)
    const eventSlashCommandAttackResponse = await index.processEvent(eventSlashCommandAttackObject)
    console.log(eventSlashCommandAttackResponse)
    
    const slashCommandString = fs.readFileSync("main/sampleInteraction.json")
    const slashCommandObject = JSON.parse(slashCommandString)
    const slashCommandResponse = await slashCommandHandler.handle(slashCommandObject)
    console.log(slashCommandResponse)
}