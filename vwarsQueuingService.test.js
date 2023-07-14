const fs = require("fs");
let vwarsQueuingService = require('./vwarsQueuingService');

beforeEach(() => {
  jest.resetModules();
  process.env = {
    VWARS_TASK_QUEUE_URL: 'http://localhost:4576/queue/vwars-task-queue-local.fifo'
  };
});

test('queueMessageTask', async () => {
  let response = await vwarsQueuingService.queueMessageTask(123, "test")
});


