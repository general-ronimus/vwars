const vwarsTaskMaster = require('./vwarsTaskMaster.js')
'use strict';

exports.handle = async (event) => {
  return processEvent(event)
};

async function processEvent(event) {
  console.log('Received task master sqs event: ' + JSON.stringify(event))
  await vwarsTaskMaster.processTask(event)
}

