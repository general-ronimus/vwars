const nacl = require('tweetnacl')
const fs = require("fs");
//const vwarsPostProcessor = require('./vwarsPostProcessor')

//const publicKey = 'ffe639ee3dc9fdcfc6355c3f40dc99dbd56e4e1804002e04987fcc30cd6d6e8b'
const publicKey = '7b18f0ee016f56d10eb3aa43f4aef5c3b0d7a9df4941bec4930649dbb9b1a5a5'
'use strict';

exports.handle = async (event) => {
  return processEvent(event)
};

async function processEvent(event) {
  const body = JSON.parse(event.body)

  /**
   * TODO: Build out postProcessor implementation
   * postProcessorHandler processes an event from SQS
   * event contains a json object with a message to be sent back to discord
   * json object probably contains 
   * {
   *  message,
   *  guild,
   *  channel
   * }
   * webhook url is stored in local memory
   * use the webook and whatever token needed to post the message back to discord
   */
  //TODO: call backgroundProcessor to process the event json
  

}



