const fs = require("fs");
let vwarsCommandProcessor = require('./vwarsCommandProcessor');
let db = require('./vwarsDbService')

beforeEach(() => {
  jest.resetModules();
  process.env = {
    DB_LOCAL_HOST: 'localhost',
    DB_LOCAL_PORT: 8000
  };
  vwarsCommandProcessor = require('./vwarsCommandProcessor');
  db = require('./vwarsDbService')
});

test('mine', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_mine.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});

test('build', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_build.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});

test('train', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_train.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});

test('stats', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_stats.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});

test('leaderboard', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_leaderboard.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});

test('buy fuel', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_buy_fuel.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});
test('buy cloak', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_buy_cloak.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});
test('buy shield', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_buy_shield.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});
test('buy sabotage', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_buy_sabotage.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});
test('buy strike', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_buy_strike.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});
test('buy nuke', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_buy_nuke.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});
test('buy but cant afford', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_buy_cantAfford.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});

test('fuel', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_fuel.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});

test('cloak', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_cloak.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});

test('shield', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_shield.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});

test('strike', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_strike.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});

test('sabotage', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_sabotage.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});

test('nuke', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_nuke.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});

/*
test('stealth strike', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_stealth_strike.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});
*/

