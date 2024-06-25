const fs = require('fs');
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

async function getEachFunding(option) {
    let ticker = option['ticker'] + "-USDT-SWAP"
    let url = `https://www.okx.com/api/v5/public/funding-rate?instId=${ticker}`
    let res = await axios.get(url)
    let data = res.data.data[0];
    let serverTime = new Date().getTime();

    return [serverTime, parseFloat(data['fundingRate'])]
}


async function getEachMarkPrice(option) {
    let ticker = option['ticker'] + "-USDT-SWAP"
    let url = `https://www.okx.com/api/v5/public/mark-price?instId=${ticker}`
    let res = await axios.get(url)
    // console.log(res.data.data[0])
    let data = parseFloat(res.data.data[0].markPx);
    return data;
}


async function getFunding(option) {
    let ticker = option['ticker'] + "-USDT-SWAP"
    let url = `https://www.okx.com/api/v5/public/funding-rate?instId=${ticker}`
    let res = await axios.get(url)
    let data = res.data.data[0];
    let serverTime = new Date().getTime();

    return [serverTime, parseFloat(data['fundingRate'])]
}


async function getLastFunding(option) {
    let ticker = option['ticker'] + "-USDT-SWAP"
    let url = `https://www.okx.com/api/v5/public/funding-rate-history?instId=${ticker}`
    let res = await axios.get(url)
    let data = res.data.data[0];
    let fundingTime = parseInt(data.fundingTime)
    let funding = parseFloat(data.fundingRate)
    let pcTime = new Date().getTime()
    let result = {}
    result['pcTime'] = new Date().getTime()
    result['fundingTime'] = fundingTime
    result['funding'] = funding
    result['ticker'] = option['ticker']
    return result;
}


async function getOhlcv(option) {
    let result = {}
    let limit = option['limit'] ? option['limit'] : 100
    let interval = option['interval'] ? option['interval'] : "1m"
    if (interval === "1h") {
        interval = "1H"
    }

    let ticker = option['ticker'] + "-USDT-SWAP"
    let contSize = option['contSize']

    let url = `https://www.okx.com/api/v5/market/candles?instId=${ticker}&bar=${interval}`
    let res = await axios.get(url)
    let data = res.data.data[1] // res.data.data.length - 1
    let t = parseFloat(data[0])
    let o = parseFloat(data[1])
    let h = parseFloat(data[2])
    let l = parseFloat(data[3])
    let c = parseFloat(data[4])
    let v = parseFloat(data[5]) * contSize;
    result['pcTime'] = new Date().getTime()
    result['serverTime'] = t
    result['data'] = {open: o, high: h, low: l, close: c, volume: v}
    result['ticker'] = option['ticker']
    return result
}


module.exports.getData = getData;