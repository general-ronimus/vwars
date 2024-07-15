const fs = require("fs");
let vwarsPeaceCommandProcessor = require('./vwarsPeaceCommandProcessor');
let db = require('./vwarsDbService');

beforeEach(() => {
  jest.resetModules();
  process.env = {
    DB_LOCAL_HOST: 'localhost',
    DB_LOCAL_PORT: 8000
  };
  vwarsPeaceCommandProcessor = require('./vwarsPeaceCommandProcessor');
  db = require('./vwarsDbService');
});

const testResourcePath = 'testResources/vwarsPeaceCommandProcessor.test';

test('mine', async () => {
  let slashCommandBody = fs.readFileSync(`${testResourcePath}/sampleSlashCommandBody_mine.json`);
  let slashCommandBodyJson = JSON.parse(slashCommandBody);
  let response = await vwarsPeaceCommandProcessor.processCommand(slashCommandBodyJson);
  console.log(response);
  expect(response.statusCode).toBe(200);
});

/*
test('smelt', async () => {
  let slashCommandBody = fs.readFileSync(`${testResourcePath}/sampleSlashCommandBody_smelt.json`);
  let slashCommandBodyJson = JSON.parse(slashCommandBody);
  let response = await vwarsPeaceCommandProcessor.processCommand(slashCommandBodyJson);
  console.log(response);
  expect(response.statusCode).toBe(200);
});

test('construct', async () => {
  let slashCommandBody = fs.readFileSync(`${testResourcePath}/sampleSlashCommandBody_construct.json`);
  let slashCommandBodyJson = JSON.parse(slashCommandBody);
  let response = await vwarsPeaceCommandProcessor.processCommand(slashCommandBodyJson);
  console.log(response);
  expect(response.statusCode).toBe(200);
});

test('export', async () => {
  let slashCommandBody = fs.readFileSync(`${testResourcePath}/sampleSlashCommandBody_export.json`);
  let slashCommandBodyJson = JSON.parse(slashCommandBody);
  let response = await vwarsPeaceCommandProcessor.processCommand(slashCommandBodyJson);
  console.log(response);
  expect(response.statusCode).toBe(200);
});

test('import', async () => {
  let slashCommandBody = fs.readFileSync(`${testResourcePath}/sampleSlashCommandBody_import.json`);
  let slashCommandBodyJson = JSON.parse(slashCommandBody);
  let response = await vwarsPeaceCommandProcessor.processCommand(slashCommandBodyJson);
  console.log(response);
  expect(response.statusCode).toBe(200);
});

test('profile', async () => {
  let slashCommandBody = fs.readFileSync(`${testResourcePath}/sampleSlashCommandBody_profile.json`);
  let slashCommandBodyJson = JSON.parse(slashCommandBody);
  let response = await vwarsPeaceCommandProcessor.processCommand(slashCommandBodyJson);
  console.log(response);
  expect(response.statusCode).toBe(200);
});

test('leaderboard', async () => {
  let slashCommandBody = fs.readFileSync(`${testResourcePath}/sampleSlashCommandBody_leaderboard.json`);
  let slashCommandBodyJson = JSON.parse(slashCommandBody);
  let response = await vwarsPeaceCommandProcessor.processCommand(slashCommandBodyJson);
  console.log(response);
  expect(response.statusCode).toBe(200);
});

test('help', async () => {
  let slashCommandBody = fs.readFileSync(`${testResourcePath}/sampleSlashCommandBody_help.json`);
  let slashCommandBodyJson = JSON.parse(slashCommandBody);
  let response = await vwarsPeaceCommandProcessor.processCommand(slashCommandBodyJson);
  console.log(response);
  expect(response.statusCode).toBe(200);
});
*/