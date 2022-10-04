# Vibranium Wars!

## Build
Vwars is a node.js project, and can be built using npm
`npm install`

## Deployment
vwars is currently deployed via AWS lambda zip file upload

## Test
<<<<<<< Updated upstream
vwars can be tested locally using the test.js program
=======
vwars can be tested locally using serverless framework's test option
`serverless invoke local --function vwars`

## User Guide
Basic commands
help
stats [player]
display stats for [player] for the active theatre. Total vibranium, city size, military size, inventory, current place
leaderboard, medals won
mine [x]
spend x energy for x chances at vibranium and rare equipment chests
build [x]
spend x energy to convert x vibranium to x city size
train [x]
spend x energy to convert x vibranium to x military size
attack [player]
spend 10 energy to attack [player], gain up to 10% of their vibranium, damage up to 10% of their city, incur up to 10% casualties

Premium commands, accessed via equipment chests
-cloak
protection from attack, sabotage, strike and nuke for 12 hours
-sabotage [player]
reduce [player] city by 25%
-strike [player]
reduce [player] military by 25%
-tech [mine, build, train]
double rates for vibranium mined, city construction or military construction
-nuke [player]
reduce [player] city and military by 50%

Administrator commands
-theatre create [name]
create a new theatre of war, with name of [name]. Theatres are created in deactivated state
-theatre list
list theatres associated with this guild, * indicates the active theatre
-theatre delete [name]
end a theatre [name], prompt admin on whether to issue medals
🥇🥈🥉final top three
🎖- most overall market control
🏅- most vibranium at any point
-theatre activate [name] [expiration]
make theatre [name] the active theatre, optionally have the theatre auto-deactivate on [expiration]
-theatre deactivate
deactivate the active theatre
-theatre leaderboard [name]
display the leaderboard for theatre [name]
-theatre cycle [name] [hours]
set market cycle length to [hours] for theatre [name]. Default is random between 1 and 24. When a market cycle concludes, winners for that specific cycle gain an equipment chest

Game attributes
Energy cap - 100
Energy gain - 1 per 10 minutes (6 per hour, 144 per day)
Mining rates - chance of 0-1000 vibranium at a reverse exponential curve rate. Equipment chest would be 1001 on this curve.
Chest rates - equal chances of cloak, sabatoge, strike, or tech. 1% chance of a nuke
>>>>>>> Stashed changes
