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
let vwarsTaskQueueUrl = ''
let params = {
	QueueName: vwarsTaskQueue,
  };
  vwarsTaskQueueUrl = sqs.getQueueUrl(params, (err, data) => {
	if (err) console.log(err, err.stack);
	else console.log(data.QueueUrl);
  });
console.log('Queuing service initialized with stage: ' + stage + ', queue: ' + vwarsTaskQueue + ', queue url: ' + vwarsTaskQueueUrl)



async function queueMessageTask(channel, message) {


	let queueMessage = {
		task: "message",
		channel: channel,
		message: message
	  };

	let params = {
		MessageBody: queueMessage,
		QueueUrl: vwarsTaskQueueUrl
	  };

	sqs.sendMessage(params, function(err, data) {
		if (err) {
		  console.log("Error", err);
		} else {
		  console.log("Success", data.MessageId);
		}
	}) 

	return
}




