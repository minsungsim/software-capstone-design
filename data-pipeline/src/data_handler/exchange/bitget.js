const axios = require("axios");
let errorCnt = 0
let version = "lambda"
let {logErrorToCloudWatch} = require('../util/logger.js')


async function getData(content, option) {
    try {
        if (content === "funding") {
            return await getFunding(option)
        } else if (content === "ohlcv") {
            return await getOhlcv(option)
        } else if (content === "lastFunding") {
            return await getLastFunding(option)
        } else if (content === "allFunding") {
            return await getAllFunding(option)
        }

    } catch (err) {
        console.log(err)
        // errorCnt
        errorCnt += 1
        logErrorToCloudWatch(`getBitgetData error => ${content} ${JSON.stringify(option)} ${err}`, version, "bitget")

        if (errorCnt > 5) {
            return undefined
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        return await getData(content, option)
    }
}


async function getOhlcv(option) {
    let result = {}
    let ticker = option['ticker'] + "USDT_UMCBL"
    let interval = option['interval'] ? option['interval'] : "1m"
    if (interval === "1h") {
        interval = "1H"
    }

// https://api.bitget.com/api/mix/v1/market/history-candles?symbol=BTCUSDT_UMCBL&granularity=5m&startTime=1659406928000&endTime=1659410528000
    let endTime = new Date().getTime();
    let url = `https://api.bitget.com/api/mix/v1/market/history-candles?symbol=${ticker}&granularity=${interval}&endTime=${endTime}`
    let res = await axios.get(url)

    let data = res.data;
    let row = data[data.length - 1]
    let t = parseFloat(row[0])
    let o = parseFloat(row[1])
    let h = parseFloat(row[2])
    let l = parseFloat(row[3])
    let c = parseFloat(row[4])
    let v = parseFloat(row[5])

    result['pcTime'] = new Date().getTime()
    result['serverTime'] = t
    result['data'] = {open: o, high: h, low: l, close: c, volume: v}
    result['ticker'] = option['ticker']
    return result
}


async function getFunding(option) {
    let [[serverTime, funding], index, mark] = await Promise.all([getEachFunding(option), getEachIndexPrice(option), getEachMarkPrice(option)])
    let result = {}

    result['pcTime'] = new Date().getTime()
    result['serverTime'] = serverTime
    result['data'] = {funding: funding, indexPrice: index, markPrice: mark}
    result['ticker'] = option['ticker']
    return result
}


async function getLastFunding(option) {
    let result = {}
    let ticker = option['ticker'] + "USDT_UMCBL"
    let url = `https://api.bitget.com/api/mix/v1/market/history-fundRate?symbol=${ticker}`
    let res = await axios.get(url)
    let data = res.data.data[0];

    result['pcTime'] = new Date().getTime()
    result['fundingTime'] = parseInt(data.settleTime)
    result['funding'] = parseFloat(data.fundingRate)
    result['ticker'] = option['ticker']
    return result
}


async function getEachFunding(option) {
    let result = {}
    let ticker = option['ticker'] + "USDT_UMCBL"
    let url = `https://api.bitget.com/api/mix/v1/market/current-fundRate?symbol=${ticker}`
    let res = await axios.get(url)
    let data = res.data.data;
    let serverTime = res.data.requestTime

    return [serverTime, parseFloat(data.fundingRate)]
}


async function getEachIndexPrice(option) {
    let result = {}
    let ticker = option['ticker'] + "USDT_UMCBL"
    let url = `https://api.bitget.com/api/mix/v1/market/index?symbol=${ticker}`
    let res = await axios.get(url)
    let data = res.data.data;
    return parseFloat(data.index)
}


async function getEachMarkPrice(option) {
    let result = {}
    let ticker = option['ticker'] + "USDT_UMCBL"
    let url = `https://api.bitget.com/api/mix/v1/market/mark-price?symbol=${ticker}`
    let res = await axios.get(url)
    let data = res.data.data;
    return parseFloat(data.markPrice)
}

async function getAllFunding(option) {
    let result = []

    let url = `https://api.bitget.com/api/mix/v1/market/tickers?productType=umcbl`
    let res = await axios.get(url)
    let data = res.data.data;

    for (let fundingInfo of data) {
        let tickerFunding = {}

        tickerFunding['ticker'] = fundingInfo['symbol'].replace("USDT_UMCBL", "")
        tickerFunding['funding'] = parseFloat(fundingInfo['fundingRate'])
        tickerFunding['indexPrice'] = parseFloat(fundingInfo['indexPrice'])
        tickerFunding['markPrice'] = 0
        tickerFunding['pcTime'] = new Date().getTime()
        result.push(tickerFunding)
    }

    return result
}


module.exports.getData = getData;