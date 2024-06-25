const fs = require('fs');
const axios = require("axios");
let errorCnt = 0
let version = "lambda"
let {logErrorToCloudWatch} = require('../util/logger.js')


async function getBinanceData(content, option) {
    try {
        if (content === "orderbook") {
            return await getBinanceOrderbook(option)
        } else if (content === "ohlcv") {
            return await getBinanceOhlcv(option)
        } else if (content === "funding") {
            return await getBinanceFunding(option)
        } else if (content === "oi") {
            return await getOpenInterest(option)
        } else if (content === "lastFunding") {
            return await getLastFunding(option)
        } else if (content === "topTraderLongShortAccountRatio") {
            return await getTopTraderLongShortAccountRatio(option)
        } else if (content === "topTraderLongShortPositionRatio") {
            return await getTopTraderLongShortPositionRatio(option)
        } else if (content === "takerVolume") {
            return await getTakerVolume(option)
        } else if (content === "allFunding") {
            return await getAllFunding()
        }

    } catch (err) {
        console.log(err)
        // errorCnt
        errorCnt += 1
        logErrorToCloudWatch(`getBinanceData error => ${content} ${JSON.stringify(option)} ${err}`, version, "binance")

        if (errorCnt > 5) {
            return undefined
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        return await getBinanceData(content, option)
    }
}

async function getBinanceOrderbook(option) {
    let result = {}

    let limit = option['limit'] ? option['limit'] : 1000
    let ticker = option['ticker'] + "USDT"
    let res = await axios.get(`https://fapi.binance.com/fapi/v1/depth?symbol=${ticker}&limit=${limit}`)
    let data = res.data
    let ap = []
    let bp = []
    let as = []
    let bs = []

    data.asks.forEach((item) => {
        ap.push(parseFloat(item[0]));
        as.push(parseFloat(item[1]));
    });
    data.bids.forEach((item) => {
        bp.push(parseFloat(item[0]));
        bs.push(parseFloat(item[1]));
    });

    const obString = JSON.stringify([ap, bp, as, bs])
        .replace(/,/g, '?')
        .replace(/"/g, '');

    result['pcTime'] = new Date().getTime()
    result['serverTime'] = data['T']
    result['data'] = obString
    result['ticker'] = option['ticker']

    return result
}


async function getBinanceOhlcv(option) {
    let result = {}
    let ticker = option['ticker'] + "USDT"
    let limit = option['limit'] ? option['limit'] : 1;
    let interval = option['interval'] ? option['interval'] : "1m"
    let res = await axios.get(`https://fapi.binance.com/fapi/v1/klines?symbol=${ticker}&interval=${interval}`)
    let data = res.data[res.data.length - 2]
    let t = parseFloat(data[0])
    let o = parseFloat(data[1])
    let h = parseFloat(data[2])
    let l = parseFloat(data[3])
    let c = parseFloat(data[4])
    let v = parseFloat(data[5])

    result['pcTime'] = new Date().getTime()
    result['serverTime'] = t
    result['data'] = {open: o, high: h, low: l, close: c, volume: v}
    result['ticker'] = option['ticker']
    return result
}


async function getBinanceFunding(option) {
    let result = {}
    let ticker = option['ticker'] + "USDT"
    let res = await axios.get(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${ticker}`)

    let data = res.data
    let t = parseFloat(data['time'])
    let funding = parseFloat(data['lastFundingRate'])
    let indexPrice = parseFloat(data['indexPrice'])
    let markPrice = parseFloat(data['markPrice'])

    result['pcTime'] = new Date().getTime()
    result['serverTime'] = t
    result['data'] = {funding: funding, indexPrice: indexPrice, markPrice: markPrice}
    result['ticker'] = option['ticker']
    return result
}


async function getLastFunding(option) {
    let result = {}
    let ticker = option['ticker'] + "USDT"
    let res = await axios.get(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${ticker}`)

    let data = res.data
    let row = data[res.data.length - 1]
    let fundingTime = parseFloat(row['fundingTime'])
    let fundingRate = parseFloat(row['fundingRate'])

    result['pcTime'] = new Date().getTime()
    result['fundingTime'] = fundingTime
    result['data'] = {funding: fundingRate, fundingTime: fundingTime}
    result['ticker'] = option['ticker']
    return result
}


async function getOpenInterest(option) {
    let result = {}
    let ticker = option['ticker'] + "USDT"
    let res = await axios.get(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${ticker}`)
    let data = res.data
    let t = parseFloat(data['time'])

    result['pcTime'] = new Date().getTime()
    result['serverTime'] = t
    result['ticker'] = option['ticker']
    result['oi'] = parseFloat(data['openInterest'])
    return result
}


async function getTopTraderLongShortAccountRatio(option) {
    let result = {}
    let ticker = option['ticker'] + "USDT"
    let res = await axios.get(`https://fapi.binance.com/futures/data/topLongShortAccountRatio?symbol=${ticker}&period=5m`)
    let data = res.data[res.data.length - 1]
    result['pcTime'] = new Date().getTime()
    result['ticker'] = option['ticker']
    result['topTraderLongShortAccountRatio'] = parseFloat(data['longShortRatio'])
    return result
}


async function getTopTraderLongShortPositionRatio(option) {
    let result = {}
    let ticker = option['ticker'] + "USDT"
    let res = await axios.get(`https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=${ticker}&period=5m`)
    let data = res.data[res.data.length - 1]
    result['pcTime'] = new Date().getTime()
    result['ticker'] = option['ticker']
    result['topTraderLongShortPositionRatio'] = parseFloat(data['longShortRatio'])
    return result
}

async function getTakerVolume(option) {
    let result = {}
    let ticker = option['ticker'] + "USDT"
    let res = await axios.get(`https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=${ticker}&period=5m`)
    let data = res.data[res.data.length - 1]
    result['pcTime'] = new Date().getTime()
    result['ticker'] = option['ticker']
    result['buySellRatio'] = parseFloat(data['buySellRatio'])
    result['buyVol'] = parseFloat(data['buyVol'])
    result['sellVol'] = parseFloat(data['sellVol'])
    return result
}

async function getAllFunding(option) {
    let result = []
    let res = await axios.get(`https://fapi.binance.com/fapi/v1/premiumIndex`)
    let data = res.data;

    for (let fundingInfo of data) {
        if (fundingInfo['symbol'].endsWith('USDT')) {
            let tickerFunding = {}
            tickerFunding['ticker'] = fundingInfo['symbol'].replace("USDT", "");
            tickerFunding['markPrice'] = parseFloat(fundingInfo['markPrice'])
            tickerFunding['indexPrice'] = parseFloat(fundingInfo['indexPrice'])
            tickerFunding['pcTime'] = new Date().getTime()
            tickerFunding['funding'] = parseFloat(fundingInfo['lastFundingRate'])
            result.push(tickerFunding)
        }
    }
    return result
}



module.exports.getBinanceData = getBinanceData;