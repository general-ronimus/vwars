const nacl = require('tweetnacl')
const fs = require("fs");
const vwarsBackgroundProcessor = require('./vwarsBackgroundProcessor')

'use strict';

exports.handle = async (event) => {
  return processEvent(event)
};

async function processEvent(event) {
  const body = JSON.parse(event.body)
  vwarsBackgroundProcessor.process(body)

  /**
   * TODO: Build out postProcessor implementation
   * vwarBackgroundProcessor processes events from SQS and acts on the following tasks
   * - conclude (include warId)
   * - post interaction responses (include guild and channel for message)
   * - drone behavior
   * 
   * json object
   * {
   *  task,
   *  guild,
   *  channel
   * }
   * webhook url is stored in local memory
   * use the webook and whatever token needed to post the message back to discord
   */
  //TODO: call backgroundProcessor to process the event json
  

}



