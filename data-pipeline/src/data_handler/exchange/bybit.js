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
        logErrorToCloudWatch(`getBybitData error => ${content} ${JSON.stringify(option)} ${err}`, version, "bybit")

        if (errorCnt > 5) {
            return undefined
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        return await getData(content, option)
    }
}

// 모든 토큰에 대해 getAll을 할 수 있지만 통일성을 위해 개별 호출
async function getFunding(option) {
    let result = {}
    let ticker = option['ticker'] + "USDT"
    let url = `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${ticker}`
    let res = await axios.get(url)
    let serverTime = res.data.time;
    let data = res.data.result.list[0];

    result['pcTime'] = new Date().getTime()
    result['serverTime'] = serverTime
    result['data'] = {funding: parseFloat(data['fundingRate']), indexPrice: parseFloat(data['indexPrice']), markPrice: parseFloat(data['markPrice'])}
    result['ticker'] = option['ticker']
    return result
}


async function getLastFunding(option) {
    let result = {}
    let ticker = option['ticker'] + "USDT"
    let url = `https://api.bybit.com/v5/market/funding/history?category=linear&symbol=${ticker}`
    let res = await axios.get(url)
    let data = res.data.result.list;
    let row = data[0]

    result['pcTime'] = new Date().getTime()
    result['fundingTime'] = parseInt(row.fundingRateTimestamp)
    result['funding'] = parseFloat(row.fundingRate)
    result['ticker'] = option['ticker']
    return result
}


async function getAllFunding(option) {
    let result = []
    let url = `https://api.bybit.com/v5/market/tickers?category=linear`;
    let res = await axios.get(url)
    let data = res.data.result.list;

    for (let fundingInfo of data) {
        let tickerFunding = {}
        tickerFunding['ticker'] = fundingInfo['symbol'].replace("USDT", "")
        tickerFunding['indexPrice'] = parseFloat(fundingInfo['indexPrice'])
        tickerFunding['markPrice'] = parseFloat(fundingInfo['markPrice'])
        tickerFunding['funding'] = parseFloat(fundingInfo['fundingRate'])
        tickerFunding['pcTime'] = new Date().getTime()
        result.push(tickerFunding)
    }

    return result
}


async function getOhlcv(option) {
    let result = {}
    let ticker = option['ticker'] + "USDT"
    let interval = option['interval'] ? option['interval'] : "1m"
    if (interval.includes("m")) {
        interval = interval.replace("m", "")
    }

    if (interval.includes("h")) {
        interval = parseInt(interval.replace("h", ""))
        interval = interval * 60
    }

    let url = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${ticker}&interval=${interval}`
    let res = await axios.get(url)
    let serverTime = res.data.time
    let data = res.data.result
    let row = data['list'][1]
    let t = parseFloat(row[0])
    let o = parseFloat(row[1])
    let h = parseFloat(row[2])
    let l = parseFloat(row[3])
    let c = parseFloat(row[4])
    let v = parseFloat(row[5])

    result['pcTime'] = new Date().getTime()
    result['serverTime'] = serverTime
    result['data'] = {open: o, high: h, low: l, close: c, volume: v}
    result['ticker'] = option['ticker']
    return result
}


module.exports.getData = getData;