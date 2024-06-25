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
        } else if (content === "allFunding") {
            return await getAllFunding(option)
        }

    } catch (err) {
        console.log(err)
        // errorCnt
        errorCnt += 1
        logErrorToCloudWatch(`getBingxData error => ${content} ${JSON.stringify(option)} ${err}`, version, "bingx")

        if (errorCnt > 5) {
            return undefined
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        return await getData(content, option)
    }
}


async function getFunding(option) {
    let result = {}
    let ticker = option['ticker'] + "-USDT"

    let timestamp = new Date().getTime();
    let url = `https://open-api.bingx.com/openApi/swap/v2/quote/premiumIndex?timestamp=${timestamp}&symbol=${ticker}`
    let res = await axios.get(url)

    let data = res.data.data;
    result['pcTime'] = new Date().getTime()
    result['serverTime'] = data['nextFundingTime']

    result['data'] = {funding: parseFloat(data['lastFundingRate']), indexPrice: parseFloat(data['indexPrice']), markPrice: parseFloat(data['markPrice'])}
    result['ticker'] = option['ticker']
    return result
}


async function getAllFunding(option) {
    let result = []
    let timestamp = new Date().getTime();
    let url = `https://open-api.bingx.com/openApi/swap/v2/quote/premiumIndex?timestamp=${timestamp}`
    let res = await axios.get(url)
    let data = res.data.data;

    for (let fundingInfo of data) {
        let tickerFunding = {}
        tickerFunding['ticker'] = fundingInfo['symbol'].replace("-USDT", "")
        tickerFunding['markPrice'] = parseFloat(fundingInfo['markPrice'])
        tickerFunding['indexPrice'] = parseFloat(fundingInfo['indexPrice'])
        tickerFunding['funding'] = parseFloat(fundingInfo['lastFundingRate'])
        tickerFunding['pcTime'] = new Date().getTime()
        result.push(tickerFunding)
    }
    return result;
}


async function getLastFunding(option) {
    let result = {}
    let ticker = option['ticker'] + "-USDT"
    let url = `https://open-api.bingx.com/openApi/swap/v2/quote/fundingRate?symbol=${ticker}`
    let res = await axios.get(url)

    let data = res.data.data[0];
    result['pcTime'] = new Date().getTime()
    result['fundingTime'] = data.fundingTime
    result['funding'] = parseFloat(data.fundingRate)
    result['ticker'] = option['ticker']
    return result
}


async function getOhlcv(option) {
    let result = {}
    let ticker = option['ticker'] + "-USDT"
    let limit = option['limit'] ? option['limit'] : 2
    let interval = option['interval'] ? option['interval'] : "1m"
    let timestamp = new Date().getTime();

    let url = `https://open-api.bingx.com/openApi/swap/v3/quote/klines?timestamp=${timestamp}&symbol=${ticker}&interval=${interval}`
    let res = await axios.get(url)
    let data = res.data.data[1];
    let t = parseFloat(data.time)
    let o = parseFloat(data.open)
    let h = parseFloat(data.high)
    let l = parseFloat(data.low)
    let c = parseFloat(data.close)
    let v = parseFloat(data.volume)

    result['pcTime'] = new Date().getTime()
    result['serverTime'] = t
    result['data'] = {open: o, high: h, low: l, close: c, volume: v}
    result['ticker'] = option['ticker']
    return result
}


module.exports.getData = getData;