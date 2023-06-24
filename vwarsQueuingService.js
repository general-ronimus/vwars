const AWS = require("aws-sdk");

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
	let vwarsTaskQueueUrl = await sqs.getQueueUrl(queueUrlParams).promise()

	let queueMessage = {
		task: "message",
		channel: channel,
		message: message
	  };

	let sendParams = {
		MessageBody: JSON.stringify(queueMessage),
		QueueUrl: JSON.stringify(vwarsTaskQueueUrl)
	  };

	console.log('Queuing message for channel: ' + channel + ', queue: ' + vwarsTaskQueue + ', queueUrl: ' + JSON.stringify(vwarsTaskQueueUrl))

	/*
	sqs.sendMessage(sendParams, function(err, data) {
		if (err) {
		  console.log("Error", err);
		} else {
		  console.log("Success", data.MessageId);
		}
	}) 
	*/ 

	try {
        let result = await sqs.sendMessage(sendParams).promise();
        console.log(`Message sent, ID: ${result.MessageId}`);
    } catch (error) {
        console.error(`Error: ${error}`);
    }

	return
}




