const vwarsCommandProcessor = require('./vwarsCommandProcessor');
const db = require('./vwarsDbService')
const fs = require("fs");

test('mine', async () => {
  let slashCommandBody = fs.readFileSync("testResources/sampleSlashCommandBody_mine.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsCommandProcessor.process(slashCommandBodyJson)
  console.log(response)
  //await db.deleteUser(510691137988722688)
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
