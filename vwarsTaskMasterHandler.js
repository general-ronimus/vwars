const nacl = require('tweetnacl')
const fs = require("fs");
const vwarsPostProcessor = require('./vwarsTaskMaster')

'use strict';

exports.handle = async (event) => {
  return processEvent(event)
};

async function processEvent(event) {
  console.log('Received post processor sqs event: ' + JSON.stringify(event))
  await vwarsPostProcessor.process(event)
}

