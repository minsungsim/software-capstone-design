const axios = require("axios");
const moment = require("moment-timezone");
const fs = require("fs-extra");
const {uploadFileToS3} = require("./s3_upload");
const {promisify} = require("util");
const archiver = require('archiver');
const unlink = promisify(fs.unlink);
const {getBinanceData} = require("./binance_module/binance");
require('dotenv').config()

let version = process.env.DATA_VERSION
let currentPath = process.env.CURRENT_PATH
let rootPath;

if (version === "main") {
    rootPath = "ZIP"
} else {
    rootPath = "ZIP_SUB"
}


if (currentPath === undefined) {
    currentPath = __dirname
}


let requirements = {
    binance: ['allFunding', 'orderbook'],
    upbit: [],
    // bingx: ['allFunding'],
    bithumb: [],
    // bitget: ['allFunding'],
    // bybit: ['allFunding'],
    // okx: ['funding'],
    // gateio: ['allFunding']
}


async function getData(exchange, content, option) {
    let queryString = `?exchange=${exchange}&content=${content}`
    for (let key of Object.keys(option)) {
        queryString += `&${key}=${option[key]}`
    }

    let res = await axios.get(`https://bvwuxljkw2.execute-api.ap-northeast-2.amazonaws.com/Prod/get-data${queryString}`)
    return res.data;
}


async function main() {
    while (true) {
        let sec = new Date().getSeconds()

        if (0 <= sec <= 5) {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    let timestamp = new Date().getTime();
    let toda = moment(timestamp).tz('Asia/Seoul').format('YYYY-MM-DD');
    let hour = moment(timestamp).tz('Asia/Seoul').format('HH');
    let minute = moment(timestamp).tz('Asia/Seoul').format('mm');

    for (let exchangeName of Object.keys(requirements)) {
        let exchange = new (require(`./${exchangeName}_module/exchange.js`));
        let exchangeInfo = await exchange.getTickerList();
        let tickerList;
        let info;

        if (exchangeInfo.length === 2) {
            tickerList = exchangeInfo[0]
            info = exchangeInfo[1]
        } else {
            tickerList = exchangeInfo;
        }

        let requirementList = requirements[exchangeName];
        for (let requirement of requirementList) {
            if (requirement === "allFunding") {
                let result = await getData(exchangeName, requirement, {});
                for (let fundingInfo of result) {
                    let pcTime = fundingInfo['pcTime']
                    let ticker = fundingInfo['ticker']
                    let funding = fundingInfo['funding']
                    let indexPrice = fundingInfo['indexPrice']
                    let markPrice = fundingInfo['markPrice']
                    let data = `${pcTime},${funding},${indexPrice},${markPrice}\n`
                    await writeCsv(exchangeName, ticker, 'funding_1m', data)
                }
            } else if (requirement === "orderbook") {
                const results = await Promise.all(['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'TRX', 'MATIC', 'LTC'].map(async code => {
                    let resData = await getBinanceData('orderbook', {limit: 1000, ticker: code})
                    let ticker = resData['ticker']
                    let pcTime = resData['pcTime']
                    let data = `${pcTime},${resData['data']}\n`
                    await writeCsv(exchangeName, ticker, 'DEPTH1000', data)
                }))

            } else {
                const results = await Promise.all(tickerList.map(async code => {
                    try {
                        if (code === "CON") {
                            return;
                        }

                        if (requirement === "ohlcv") {
                            let contSize = info ? info[code]['cont_size']: 1
                            let result = await getData(exchangeName, requirement, {ticker: code, contSize: contSize});
                            if (result.data === undefined) {
                                return;
                            }

                            let open = result['data']['open']
                            let high = result['data']['high']
                            let low = result['data']['low']
                            let close = result['data']['close']
                            let volume = result['data']['volume']
                            let ticker = result['ticker']
                            let serverTime = result['serverTime']
                            let pcTime = result['pcTime']
                            let data = `${serverTime},${pcTime},${open},${high},${low},${close},${volume}\n`
                            await writeCsv(exchangeName, ticker, requirement, data)
                        } else if (requirement === "funding") {
                            let result = await getData(exchangeName, requirement, {ticker: code});
                            let ticker = result['ticker']
                            let funding = result['data']['funding']
                            let indexPrice = result['data']['indexPrice']
                            let markPrice = result['data']['markPrice']
                            let pcTime = result['pcTime']
                            let data = `${pcTime},${funding},${indexPrice},${markPrice}\n`
                            await writeCsv(exchangeName, ticker, 'funding_1m', data)
                        } else if (requirement === "oi") {
                            let result = await getData(exchangeName, requirement, {ticker: code});
                            let ticker = result['ticker']
                            let serverTime = result['serverTime']
                            let pcTime = result['pcTime']
                            let oi = result['oi']
                            let data = `${serverTime},${pcTime},${oi}\n`
                            await writeCsv(exchangeName, ticker, requirement, data)
                        }
                    } catch {}
                }));
            }
        }
    }

    const sourceDirectory = currentPath + '/DATA/'; // 압축할 폴더 경로
    let outputPath = currentPath + `/${rootPath}/`; // 'output.zip'; // 출력될 ZIP 파일의 이름
    let outputFileName = `${toda}_${hour}_${minute}.zip`

    await zipDirectory(sourceDirectory, outputPath, outputFileName)
    await uploadFileToS3(outputPath + outputFileName, `${rootPath}/` + outputFileName);
    await unlink(outputPath + outputFileName)
    await fs.remove(sourceDirectory)
}


function writeCsv(exchange, ticker, content, data) {
    let timestamp = new Date().getTime();
    let toda = moment(timestamp).tz('Asia/Seoul').format('YYYY-MM-DD');
    let hour = moment(timestamp).tz('Asia/Seoul').format('HH');
    let minute = moment(timestamp).tz('Asia/Seoul').format('mm');
    let directory = currentPath + `/DATA/${exchange.toUpperCase()}/${content.toUpperCase()}/` + String(toda) + '/' + ticker.toUpperCase() + '/' + hour;

    fs.ensureDir(currentPath + `/DATA/`)
        .then(async () => {
            fs.ensureDir(currentPath + `/DATA/${exchange.toUpperCase()}/`)
                .then(async () => {
                    fs.ensureDir(currentPath + `/DATA/${exchange.toUpperCase()}/${content.toUpperCase()}/`)
                        .then(async () => {
                            fs.ensureDir(currentPath + `/DATA/${exchange.toUpperCase()}/${content.toUpperCase()}/` + String(toda))
                                .then(async () => {
                                    fs.ensureDir(currentPath + `/DATA/${exchange.toUpperCase()}/${content.toUpperCase()}/` + String(toda) + '/' + ticker.toUpperCase())
                                        .then(async () => {
                                            fs.ensureDir(directory)
                                                .then(async () => {
                                                    const fileName = directory + `/${minute}_${version}.csv`
                                                    await fs.writeFileSync(fileName, data, 'utf8');
                                                }).catch (err => {
                                                console.log(err)
                                            })
                                        }).catch (err => {
                                        console.log(err)
                                    })
                                }).catch (err => {
                                console.log(err)
                            })
                        })
                })
        })
}


async function zipDirectory(sourceDir, outputPath, outputFileName) {
    const archive = archiver('zip', { zlib: { level: 9 }});

    return new Promise(async (resolve, reject) => {
        try {
            await fs.ensureDir(outputPath);
            const fullOutputPath = `${outputPath}/${outputFileName}`;
            const stream = fs.createWriteStream(fullOutputPath);

            archive
                .directory(sourceDir, false)
                .on('error', err => {
                    console.log(err)
                    reject(err)
                })
                .pipe(stream);

            stream.on('close', () => resolve());
            archive.finalize();
        } catch (err) {
            reject(err);
        }
    });
}

exports.main = main;
