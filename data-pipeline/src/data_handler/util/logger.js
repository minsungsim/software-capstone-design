const AWS = require('aws-sdk');
require('dotenv').config();
const awsAccessKey = process.env.AWS_ACCESS_KEY;
const awsSecretKey = process.env.AWS_SECRET_KEY;
const moment = require('moment-timezone');


AWS.config.update({
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretKey,
    region: 'ap-northeast-2'
});

const cloudwatchlogs = new AWS.CloudWatchLogs();
const logGroupName = 'data';  // 예: '/aws/nodejs/app'

// 에러 발생시 CloudWatch에 로그 기록 함수
const logErrorToCloudWatch = async (errorMessage, version, exchange) => {
    try {
        console.log(errorMessage, version, exchange)
        // 시퀀스 토큰 얻기
        const describeStreams = await cloudwatchlogs.describeLogStreams({
            logGroupName,
            logStreamNamePrefix: version
        }).promise();

        const sequenceToken = describeStreams.logStreams[0]?.uploadSequenceToken;
        const currentKST = moment().tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss");

        let message = `[ERROR]${currentKST}-${errorMessage}-${exchange}`;

        // 로그 이벤트 생성 및 기록
        const params = {
            logEvents: [
                {
                    message: message,
                    timestamp: Date.now()
                }
            ],
            logGroupName,
            logStreamName: version,
            sequenceToken
        };

        await cloudwatchlogs.putLogEvents(params).promise();
        console.log('Logged error to CloudWatch:', errorMessage);
    } catch (error) {
        console.error('Error logging to CloudWatch:', error);
    }
};

// 예제: 에러 발생시 로그 기록
const handleError = (error) => {
    console.error('An error occurred:', error.message);
    logErrorToCloudWatch(error.message, 'main', 'binance');
};

// 예제 에러 발생
// try {
//     throw new Error('This is a sample error');
// } catch (error) {
//     handleError(error);
// }

module.exports.logErrorToCloudWatch = logErrorToCloudWatch;