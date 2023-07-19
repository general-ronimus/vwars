const fs = require("fs");
let vwarsAdminCommandProcessor = require('./vwarsAdminCommandProcessor');
let db = require('./vwarsDbService')

beforeEach(() => {
  jest.resetModules();
  process.env = {
    DB_LOCAL_HOST: 'localhost',
    DB_LOCAL_PORT: 8000
  };
  vwarsAdminCommandProcessor = require('./vwarsAdminCommandProcessor');
  db = require('./vwarsDbService')
});

test('create', async () => {
  let slashCommandBody = fs.readFileSync("testResources/vwarsAdminCommandProcessor.test/sampleSlashCommandBody_create.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsAdminCommandProcessor.processCommand(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});

test('list', async () => {
  let slashCommandBody = fs.readFileSync("testResources/vwarsAdminCommandProcessor.test/sampleSlashCommandBody_list.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsAdminCommandProcessor.processCommand(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});

test('delete', async () => {
  let slashCommandBody = fs.readFileSync("testResources/vwarsAdminCommandProcessor.test/sampleSlashCommandBody_delete.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsAdminCommandProcessor.processCommand(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});
//testResources/vwarsAdminCommandProcessor.test
test('activate', async () => {
  let slashCommandBody = fs.readFileSync("testResources/vwarsAdminCommandProcessor.test/sampleSlashCommandBody_activate.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsAdminCommandProcessor.processCommand(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});

test('deactivate', async () => {
  let slashCommandBody = fs.readFileSync("testResources/vwarsAdminCommandProcessor.test/sampleSlashCommandBody_deactivate.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsAdminCommandProcessor.processCommand(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});

test('conclude', async () => {
  let slashCommandBody = fs.readFileSync("testResources/vwarsAdminCommandProcessor.test/sampleSlashCommandBody_conclude.json")
  let slashCommandBodyJson = JSON.parse(slashCommandBody)
  let response = await vwarsAdminCommandProcessor.processCommand(slashCommandBodyJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});


