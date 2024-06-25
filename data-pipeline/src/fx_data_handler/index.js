const moment = require("moment-timezone");
const fs = require("fs-extra");
const {uploadFileToS3} = require("./s3_upload");
const {promisify} = require("util");
const unlink = promisify(fs.unlink);
const {getFxHana, getFxInvesting} = require("./fx");
require('dotenv').config()


let version = process.env.DATA_VERSION
let currentPath = process.env.CURRENT_PATH
if (!currentPath) {
    currentPath = __dirname
}

if (!version) {
    version = "main"
}



async function main() {
    let [hana, investing] = await Promise.all([getFxHana(), getFxInvesting()]);
    let pcTime = new Date().getTime();
    let data = `${pcTime},${hana},${investing}`
    await uploadToS3(data)
}


function uploadToS3(data) {
    let timestamp = new Date().getTime();
    let toda = moment(timestamp).tz('Asia/Seoul').format('YYYY-MM-DD');
    let hour = moment(timestamp).tz('Asia/Seoul').format('HH');
    let minute = moment(timestamp).tz('Asia/Seoul').format('mm');
    let directory = currentPath + `/DATA/` + String(toda) + '/' + hour;
    let outputPath = directory + `/${minute}_${version}.csv`
    let s3Path = directory + `/${minute}_${version}.csv`
    s3Path = 'FX/' + s3Path.split('/DATA/')[1]

    fs.ensureDir(directory)
        .then(async () => {
            const fileName = directory + `/${minute}_${version}.csv`
            await fs.writeFileSync(fileName, data, 'utf8');
            await uploadFileToS3(outputPath, s3Path);
            await unlink(outputPath);
        })
}

exports.main = main;