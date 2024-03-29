const nacl = require('tweetnacl')
const vwarsPeaceCommandProcessor = require('./vwarsPeaceCommandProcessor')
const vwarsWarCommandProcessor = require('./vwarsWarCommandProcessor')
const vwarsAdminCommandProcessor = require('./vwarsAdminCommandProcessor')

const publicKey = process.env.DISCORD_PUBLIC_KEY
const headerSignature = 'x-signature-ed25519'
const headerTimestamp = 'x-signature-timestamp'
'use strict';

exports.handle = async (event) => {
  return processEvent(event)
};

async function processEvent(event) {
  const body = JSON.parse(event.body)
  const signature = event.headers[headerSignature]
  const timestamp = event.headers[headerTimestamp]

  console.log('Event received: ' + JSON.stringify(event))
  console.log("body: " + JSON.stringify(body))
  console.log("signature: " + signature)
  console.log("timestamp: " + timestamp)
  console.log("publicKey: " + publicKey)

  let response = {
          statusCode: 401
      }
  if(verify(timestamp, JSON.stringify(body), signature)) {
      if(body.type == 1) {
          console.log('Processing ping')
          response = {
              statusCode: 200,
              body: JSON.stringify({type: 1})
          }
      } else if(body.type == 2) {
          let command = JSON.stringify(body.data.name).replace(/\"/g, "");
          console.log('Processing vwars slash command: ' + command)
          if("vw" === command) {
            response = await vwarsWarCommandProcessor.processCommand(body)
          } else if("vwp" === command) {
            response = await vwarsPeaceCommandProcessor.processCommand(body)
          } else if("vwa" === command) {
            response = await vwarsAdminCommandProcessor.processCommand(body)
          }
          
      }
  }
  return response;
}

function verify(timestamp, body, signature) {
  const isVerified = nacl.sign.detached.verify(
      Buffer.from(timestamp + body),
      Buffer.from(signature, 'hex'),
      Buffer.from(publicKey, 'hex')
  );
  
  if(isVerified) {
     console.log('Verification success')
  } else {
     console.log('Verification failure')
  }
  return isVerified
}