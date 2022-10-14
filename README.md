# Vibranium Wars!

## Pre-requisites
- nvm
- npm
- node
- jest
- serverless

## Build
vwars is a node.js project, and can be built using npm

`npm install`

## Deployment
vwars can be deployed via serverless framework

`serverless deploy`

## Test
vwars can be tested locally using serverless framework
1. Install plugins and local dynamodb for integration testing
    - `serverless dynamodb install`
    - `npm install --save-dev jest`
    - `npm install --save serverless-dynamodb-local`
2. Start serverless in offline mode to run integration tests against local dynamodb
    - `serverless offline start`
3. Run unit/integration jest tests
    - `npm test`
4. Invoke individual functions locally as needed
    - `serverless invoke local --function vwars`


## User Guide
### Basic commands

- `mine [spend]`:
    - spend `[spend]` energy for `[spend]` chances at vibranium and rare equipment chests
- `build [spend]`
    - spend 1 energy to convert `[spend]` vibranium to `[spend]` city size
- `train [spend]`
    - spend 1 energy to convert `[spend]` vibranium to `[spend]` military size
- `attack [player]`
    - spend 1 energy to attack `[player]`. Gain up to 10% of their vibranium, damage up to 10% of their city, incur up to 10% casualties all based on the attacker's military size and the defender's city size
- `help`
    - display game objective and general overview of commands
- `stats [player]`
    - display stats for `[player]`. Total vibranium, city size, military size, energy, shield status, equipment inventory
- `leaderboard`
    - display list of players sorted by most vibranium acquired to least

### Premium commands, accessed via equipment chests
- `fuel`
    - speed up energy refresh rate by 30% for 12 hours
- `cloak`
    - hide stats and non-offensive moves from other players for 12 hours
- `shield`
    - reduce the effects of enemy attacks and equipment strikes for 12 hours
- `sabotage [player]`
    - reduce `[player]` city size by 25%
- `strike [player]`
    - reduce `[player]` military size by 25%
- `nuke [player]`
    - reduce `[player]` city and military size by 50%


### Administrator commands
- `war create [name]`
    - create a new war, with name of `[name]`. Wars are created in deactivated state
- `war list`
    - list wars associated with this guild
- `war delete [name]`
    - end a war `[name]`, prompt admin on whether to issue medals
        - 🥇🥈🥉 final top three
        - 🎖 most overall market control
        - 🏅 most vibranium at any point
- `war activate [name] [expiration]`
    - make war `[name]` the active war, optionally have the war auto-deactivate on `[expiration]`
- `war deactivate`
    - deactivate the active war
- `war leaderboard [name]`
    - display the leaderboard for war `[name]`
- `war cycle [name] [hours]`
    - set market cycle length to `[hours]` for war `[name]`. Default is random between 1 and 24. When a market cycle concludes, winners for that specific cycle gain an equipment chest


## Game attributes
- Energy cap - 100
- Energy gain - 1 per 10 minutes (6 per hour, 144 per day)
- Mining rates - chance of 0 - 2000 vibranium with higher amounts having lower drop rates. Rare chance of finding an equipment chest.

