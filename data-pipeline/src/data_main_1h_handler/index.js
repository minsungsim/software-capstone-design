const axios = require("axios");
const moment = require("moment-timezone");
const fs = require("fs-extra");
const {uploadFileToS3} = require("./s3_upload");
const {promisify} = require("util");
const archiver = require('archiver');
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
require('dotenv').config()

let version = process.env.DATA_VERSION
let currentPath = process.env.CURRENT_PATH


if (currentPath === undefined) {
    currentPath = __dirname
}

if (version === undefined) {
    version = 'main'
}


let requirements = {
    binance: ['ohlcv', 'lastFunding', 'oi', 'topTraderLongShortAccountRatio', 'topTraderLongShortPositionRatio', 'takerVolume'],
    upbit: ['ohlcv'],
    bithumb: ['ohlcv'],
    // bingx: ['ohlcv', 'lastFunding'],
    // okx: ['ohlcv', 'lastFunding'],
    // gateio: ['ohlcv', 'lastFunding'],
    // bitget: ['ohlcv', 'lastFunding'],
    // bybit: ['ohlcv', 'lastFunding']
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
            const results = await Promise.all(tickerList.map(async code => {
                try {
                    if (code === "CON") {
                        return;
                    }

                    if (requirement === "ohlcv") {
                        let contSize = info ? info[code]['cont_size']: 1
                        let result = await getData(exchangeName, requirement, {ticker: code, interval: '1h', contSize: contSize});
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
                        await uploadToS3(exchangeName, ticker, requirement, data)
                    } else if (requirement === "lastFunding") {
                        let result = await getData(exchangeName, requirement, {ticker: code});
                        let ticker = result['ticker']
                        let funding = result['data']['funding']
                        let fundingTime = result['data']['fundingTime']
                        let pcTime = result['pcTime']
                        let data = `${pcTime},${fundingTime},${funding}\n`
                        await uploadToS3(exchangeName, ticker, requirement, data)
                    } else if (requirement === "oi") {
                        let result = await getData(exchangeName, requirement, {ticker: code});
                        let ticker = result['ticker']
                        let serverTime = result['serverTime']
                        let pcTime = result['pcTime']
                        let oi = result['oi']
                        let data = `${serverTime},${pcTime},${oi}\n`
                        await uploadToS3(exchangeName, ticker, requirement, data)
                    } else if (requirement === "topTraderLongShortAccountRatio") {
                        let result = await getData(exchangeName, requirement, {ticker: code});
                        let ticker = result['ticker']
                        let pcTime = result['pcTime']
                        let topTradeLongShortAccountRatio = result['topTraderLongShortAccountRatio']
                        let data = `${pcTime},${topTradeLongShortAccountRatio}\n`
                        await uploadToS3(exchangeName, ticker, requirement, data)
                    } else if (requirement === "topTraderLongShortPositionRatio") {
                        let result = await getData(exchangeName, requirement, {ticker: code});
                        let ticker = result['ticker']
                        let pcTime = result['pcTime']
                        let topTradeLongShortPositionRatio = result['topTraderLongShortPositionRatio']
                        let data = `${pcTime},${topTradeLongShortPositionRatio}\n`
                        await uploadToS3(exchangeName, ticker, requirement, data)
                    } else if (requirement === "takerVolume") {
                        let result = await getData(exchangeName, requirement, {ticker: code});
                        let ticker = result['ticker']
                        let pcTime = result['pcTime']
                        let buySellRatio = result['buySellRatio']
                        let buyVol = result['buyVol']
                        let sellVol = result['sellVol']
                        let data = `${pcTime},${buySellRatio},${buyVol},${sellVol}\n`
                        await uploadToS3(exchangeName, ticker, requirement, data)
                    }
                } catch {}
            }));
        }
    }
}


function uploadToS3(exchange, ticker, content, data) {
    let timestamp = new Date().getTime();
    let toda = moment(timestamp).tz('Asia/Seoul').format('YYYY-MM-DD');
    let hour = moment(timestamp).tz('Asia/Seoul').format('HH');
    let directory = currentPath + `/DATA/${exchange.toUpperCase()}/${content.toUpperCase() + "_1H"}/` + String(toda) + '/' + ticker.toUpperCase() + '/' + hour;
    let outputPath = directory + `/${version}.csv`
    let s3Path = directory + `/${version}.csv`
    s3Path = s3Path.split('/DATA/')[1]

    fs.ensureDir(directory)
        .then(async () => {
            const fileName = directory + `/${version}.csv`
            await fs.writeFileSync(fileName, data, 'utf8');
            await uploadFileToS3(outputPath, s3Path);
            await unlink(outputPath);
        })
}

exports.main = main;
