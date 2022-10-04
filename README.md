# Vibranium Wars!

## Build
Vwars is a node.js project, and can be built using npm
`npm install`

## Deployment
vwars can be deployed via serverless framework
`serverless deploy`

## Test
vwars can be tested locally using serverless framework's test option
`serverless invoke local --function vwars`

## User Guide
### Basic commands

- `mine [n]`:
    - spend `[n]` energy for `[n]` chances at vibranium and rare equipment chests
- `build [n]`
    - spend `[n]` energy to convert `[n]` vibranium to `[n]` city size
- `train [n]`
    - spend `[n]` energy to convert `[n]` vibranium to `[n]` military size
- `attack [player]`
    - spend 10 energy to attack `[player]`. Gain up to 10% of their vibranium, damage up to 10% of their city, incur up to 10% casualties all based on the attacker's military size and the defender's city size
- `help [command]`
    - describe the objective of the game and the details of each command
- `stats [player]`
    - display stats for `[player]`. Total vibranium, city size, military size, equipment inventory, current place
- `leaderboard`
    - display list of players sorted by most vibranium acquired to least

### Premium commands, accessed via equipment chests
- `fuel`
    - increase yields from mine, build and train commands by 30% for 24 hours
- `cloak`
    - hide your player statistics from both the stats and leaderboard commands
- `shield`
    - protection from attack, sabotage, strike and nuke for 24 hours
- `sabotage [player]`
    - reduce `[player]` city size by 25%
- `strike [player]`
    - reduce `[player]` military size by 25%
- `nuke [player]`
    - reduce `[player]` city and military size by 50%


### Administrator commands
- `theatre create [name]`
    - create a new theatre of war, with name of `[name]`. Theatres are created in deactivated state
- `theatre list`
    - list theatres associated with this guild, * indicates the active theatre
-theatre delete `[name]`
    - end a theatre `[name]`, prompt admin on whether to issue medals
        - 🥇🥈🥉 final top three
        - 🎖 most overall market control
        - 🏅 most vibranium at any point
- `theatre activate [name] [expiration]`
    - make theatre `[name]` the active theatre, optionally have the theatre auto-deactivate on `[expiration]`
- `theatre deactivate`
    - deactivate the active theatre
- `theatre leaderboard [name]`
    - display the leaderboard for theatre `[name]`
- `theatre cycle [name] [hours]`
    - set market cycle length to `[hours]` for theatre `[name]`. Default is random between 1 and 24. When a market cycle concludes, winners for that specific cycle gain an equipment chest


## Game attributes
- Energy cap - 100
- Energy gain - 1 per 10 minutes (6 per hour, 144 per day)
- Mining rates - chance of 0-5000 vibranium at a reverse exponential curve rate. Approximately 1% chance of finding an equipment chest.
- Chest rates - Of that 1% chance, equipment rarity from least rare to most rare: fuel, cloak/shield, sabotage/strike, nuke
