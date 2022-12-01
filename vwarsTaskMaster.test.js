const fs = require("fs");
let vwarsTaskMaster = require('./vwarsTaskMaster');
let db = require('./vwarsDbService')

beforeEach(() => {
  jest.resetModules();
  process.env = {
    DB_LOCAL_HOST: 'localhost',
    DB_LOCAL_PORT: 8000,
    DISCORD_BOT_TOKEN: 'MTA0NjA4Nzc2NjA2MjE0OTY5Mw.GGCErS.G8e9v2BfFFGza0-rNgC3AehfGqso_KbzLhCb9k'
  };
  vwarsTaskMaster = require('./vwarsTaskMaster');
  db = require('./vwarsDbService')
});

test('message', async () => {
  let taskEvent = fs.readFileSync("testResources/sampleTaskEvent_message.json")
  let taskEventJson = JSON.parse(taskEvent)
  let response = await vwarsTaskMaster.process(taskEventJson)
  console.log(response)
  expect(response.statusCode).toBe(200);
});
