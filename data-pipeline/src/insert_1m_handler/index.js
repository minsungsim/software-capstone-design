const moment = require("moment-timezone");
const fs = require("fs-extra");
const path = require('path');
const unzip = require('node-unzip-2');
const Papa = require("papaparse");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { downloadFileFromS3, uploadFileToS3 } = require("./s3_upload");
require('dotenv').config();

const version = process.env.DATA_VERSION || "main";
const currentPath = process.env.CURRENT_PATH || __dirname;
const rootPath = version === "main" ? "ZIP" : "ZIP_SUB";
const DATA_PATH = path.join(currentPath, '/DATA');
const RESULT_PATH = path.join(currentPath, '/RESULT');

async function main() {
    setupDirectories();
    await downloadDataFiles();
    await extractZipFiles();
    await combineCsvFilesInDirectories();
}

function setupDirectories() {
    [DATA_PATH, RESULT_PATH].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    });
}

async function downloadDataFiles() {
            const timestamp = new Date().getTime();
            let today = moment(timestamp).tz('Asia/Seoul').format('YYYY-MM-DD');
            let oneHourBefore = moment(timestamp).tz('Asia/Seoul').subtract(1, 'hours');
            let hour = oneHourBefore.format('HH')

            const minuteList = Array.from({ length: 60 }, (_, index) => index.toString().padStart(2, '0'));

            for (const minute of minuteList) {
            try {
            const fileName = `${rootPath}/${today}_${hour}_${minute}.zip`;
            await downloadFileFromS3(fileName, path.join(DATA_PATH, `${today}_${hour}_${minute}.zip`));
        } catch (err) {
            console.log(err);
        }
    }
}

async function extractZipFiles() {
    const zipFiles = fs.readdirSync(DATA_PATH).filter(file => path.extname(file) === '.zip');
    for (const file of zipFiles) {
        await extractZipFile(file);
    }
}

async function extractZipFile(file) {
    return new Promise((resolve, reject) => {
        const zipFilePath = path.join(DATA_PATH, file);
        fs.createReadStream(zipFilePath)
            .pipe(unzip.Extract({ path: RESULT_PATH }))
            .on('close', () => {
                console.log(`${file} has been extracted to ${RESULT_PATH}`);
                fs.removeSync(zipFilePath);
                resolve();
            })
            .on('error', reject);
    });
}

async function combineCsvFilesInDirectories() {
    const directories = await getDirectories(RESULT_PATH);
    for (let directory of directories) {
        await combineCsvInDirectory(directory);
        let outputPath = directory.split(/RESULT[\\\/]/)[1] + path.sep + `${version}.csv`;
        await uploadFileToS3(path.join(directory, `${version}.csv`), outputPath);
    }
}

async function getDirectories(baseDir) {
    const contents = fs.readdirSync(baseDir, { withFileTypes: true });
    const directories = contents.filter(item => item.isDirectory()).map(dir => path.join(baseDir, dir.name));
    if (directories.length === 0) return [baseDir];  // 최하위 폴더 리턴
    let nestedDirs = [];
    for (let dir of directories) {
        nestedDirs = nestedDirs.concat(await getDirectories(dir));
    }
    return nestedDirs;
}


async function combineCsvInDirectory(directory) {
    const pathArray = directory.split(/\\|\//);
    const resultIndex = pathArray.indexOf("RESULT");
    const content = pathArray[resultIndex + 2];
    const headers = getHeaders(content);
    const csvFiles = fs.readdirSync(directory).filter(file => path.extname(file) === '.csv').sort((a, b) => parseInt(a) - parseInt(b));
    const combinedRows = [];

    for (const file of csvFiles) {
        const rows = await readCsv(path.join(directory, file));
        combinedRows.push(...rows);
    }

    const records = combinedRows.map(row => headers.reduce((obj, header, index) => ({ ...obj, [header]: row[index] }), {}));
    const csvWriter = createCsvWriter({
        path: path.join(directory, `${version}.csv`),
        header: headers.map(header => ({ id: header, title: header }))
    });

    return csvWriter.writeRecords(records);
}

function getHeaders(content) {
    const headersMap = {
        "DEPTH1000": ['pcTime', 'ob'],
        "FUNDING_1M": ['pcTime', 'funding', 'indexPrice', 'markPrice']
    };
    return headersMap[content];
}

async function readCsv(file) {
    return new Promise((resolve, reject) => {
        const fileContent = fs.readFileSync(file, 'utf8');
        Papa.parse(fileContent, {
            header: false,
            skipEmptyLines: true,
            complete: results => resolve(results.data),
            error: reject
        });
    });
}

exports.main = main;