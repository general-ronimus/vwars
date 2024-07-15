const AWS = require("aws-sdk");
const crypto = require('crypto');

module.exports ={
	queueMessageTask
}

let stage = 'local'
if(process.env.STAGE) {
	stage = process.env.STAGE
}
if('local' === stage) {
	AWS.config.update({
		region: "local",
	});
} else {
	AWS.config.update({
		region: "us-west-2"
	});
}
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
let vwarsTaskQueue = ''
if(process.env.VWARS_TASK_QUEUE) {
	vwarsTaskQueue = process.env.VWARS_TASK_QUEUE
}
console.log('Queuing service initialized with stage: ' + stage + ', queue: ' + vwarsTaskQueue)



async function queueMessageTask(channel, message) {

	let queueUrlParams = {
		QueueName: vwarsTaskQueue,
	  };
	console.log('Queuing message for channel: ' + channel + ', queue: ' + vwarsTaskQueue)
	let retrievedQueueUrl = await sqs.getQueueUrl(queueUrlParams).promise()
	let vwarsTaskQueueUrl = JSON.stringify(retrievedQueueUrl.QueueUrl).replace(/\"/g, "")
	let uuid = crypto.randomUUID()

	let sendParams = {
		MessageBody: JSON.stringify(message),
		MessageAttributes: {
			"task": {
				DataType: "String",
				StringValue: "message"
			},
			"channel": {
			   DataType: "String",
			   StringValue: channel
			}
		 },
		QueueUrl: vwarsTaskQueueUrl,
		MessageGroupId: 'queueMessageTask',
		MessageDeduplicationId: uuid
	  };


	try {
        let result = await sqs.sendMessage(sendParams).promise();
        console.log(`Message sent, ID: ${result.MessageId}`);
    } catch (error) {
        console.error(`Error: ${error}`);
    }

	return
}




