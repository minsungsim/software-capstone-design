require('dotenv').config()
const AWS = require("aws-sdk");
const fs = require("fs-extra");
let bucketName = "arbitrage456-data"

require('dotenv').config();
const awsAccessKey = process.env.AWS_ACCESS_KEY;
const awsSecretKey = process.env.AWS_SECRET_KEY;

AWS.config.update({
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretKey,
    region: 'ap-northeast-2'
});

const s3 = new AWS.S3()

async function uploadFileToS3(filePath, s3Path) {
    // let keyy = path.join(s3Path , path.basename(filePath))
    s3Path = s3Path.replace(/\\/g, '/')
    const fileStream = fs.createReadStream(filePath);
    const params = {
        Bucket: bucketName,
        Key: s3Path,
        Body: fileStream,
    };
    try {
        const data = await s3.upload(params).promise();
        // console.log(`upload success (${s3Path}).`);
    } catch (error) {
        // console.log(`upload fail (${s3Path}):`, error);
        await new Promise((resolve) => setTimeout(resolve, 3000));

        try {
            await s3.upload(params).promise();
        } catch {
            console.error(`upload fail (${s3Path}):`, error);
        }
    }
}

const downloadFileFromS3 = async (key, destFilePath) => {
    const params = {
        Bucket: bucketName,
        Key: key
    };

    const data = await s3.getObject(params).promise();
    fs.writeFileSync(destFilePath, data.Body);
};


module.exports.downloadFileFromS3 = downloadFileFromS3
module.exports.uploadFileToS3 = uploadFileToS3