const request = require('request');
const tableify = require('tableify');

const parseSnsRecord = snsRecord => ({
  MessageId: snsRecord.MessageId,
  TopicArn: snsRecord.TopicArn,
  Subject: snsRecord.Subject,
  Message: snsRecord.Message ? JSON.parse(snsRecord.Message) : null,
});

exports.handler = (event, context, callback) => {
  console.log('[INFO] Handler invoked. Event details:', event);

  // Extract event payload (records)
  const eventRecords = (event.Records ? event.Records : []);
  console.log('[INFO] Event records: ', eventRecords);

  // Format SNS records as HTML tables
  const snsRecordStrings = eventRecords
    .filter(record => record.Sns)
    .map(record => parseSnsRecord(record.Sns))
    .map(record => tableify(record));

  // Abort if we didn't receive proper SNS records
  if (snsRecordStrings.length === 0) {
    const errorMessage = 'Ignoring event because it does not contain any SNS records';
    console.log(`[ERROR] ${errorMessage}`);
    callback(errorMessage);
    return;
  }

  // Prepare HTTP request
  const httpRequest = {
    uri: process.env.TEAMS_WEB_HOOK_URL,
    method: 'POST',
    json: {
      text: snsRecordStrings.toString(),
    },
  };

  // Send HTTP request
  console.log('[INFO] Posting to Webhook...');
  request(httpRequest, (error, response) => {
    const statusCode = (response && response.statusCode) ? response.statusCode : null;
    const logLevel = (statusCode === 200) ? 'INFO' : 'ERROR';
    const logMessage = `[${logLevel}] Posting to Webhook...done. HTTP status code: [${statusCode}]`;
    console.log(logMessage, error || '');
    callback(error, 'done');
  });
};
