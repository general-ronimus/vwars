const vwarsTaskMaster = require('./vwarsTaskMaster')

'use strict';

exports.handle = async (event) => {
  return processEvent(event)
};

async function processEvent(event) {
  const token = process.env.DISCORD_BOT_TOKEN
  console.log('Received task master sqs event: ' + JSON.stringify(event))
  await vwarsTaskMaster.process(event)
}

