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
        logErrorToCloudWatch(`getGateioData error => ${content} ${JSON.stringify(option)} ${err}`, version, "gateio")

        if (errorCnt > 5) {
            return undefined
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        return await getData(content, option)
    }
}

async function getOhlcv(option) {
    let result = {}
    let ticker = option['ticker'] + "_USDT"
    let interval = option['interval'] ? option['interval'] : "1m"
    let url = `https://api.gateio.ws/api/v4/futures/usdt/candlesticks?contract=${ticker}&interval=${interval}`
    let res = await axios.get(url)

    let data = res.data[res.data.length - 2];
    let contSize = option['contSize'] ? option['contSize']: 1
    let t = parseFloat(data['t'] * 1000)
    let o = parseFloat(data['o'])
    let h = parseFloat(data['h'])
    let l = parseFloat(data['l'])
    let c = parseFloat(data['c'])
    let v = parseFloat(data['v']) * contSize

    result['pcTime'] = new Date().getTime()
    result['serverTime'] = t
    result['data'] = {open: o, high: h, low: l, close: c, volume: v}
    result['ticker'] = option['ticker']
    return result
}

async function getFunding(option) {
    let result = {}
    let ticker = option['ticker'] + "_USDT"
    let url = `https://api.gateio.ws/api/v4/futures/usdt/contracts/${ticker}`
    let res = await axios.get(url)
    let data = res.data;

    result['pcTime'] = new Date().getTime()
    result['serverTime'] = result['pcTime']
    result['data'] = {funding: parseFloat(data['funding_rate']), indexPrice: parseFloat(data['index_price']), markPrice: parseFloat(data['mark_price'])}
    return result
}

async function getLastFunding(option) {
    let result = {}
    let ticker = option['ticker'] + "_USDT"
    let url = `https://api.gateio.ws/api/v4/futures/usdt/funding_rate?contract=${ticker}`
    let res = await axios.get(url)
    let data = res.data[0];
    let fundingTime = data.t * 1000
    let funding = parseFloat(data.r)

    result['pcTime'] = new Date().getTime()
    result['fundingTime'] = fundingTime
    result['funding'] = funding
    result['ticker'] = option['ticker']

    return result
}

async function getAllFunding(option) {
    let result = []
    let url = `https://api.gateio.ws/api/v4/futures/usdt/contracts`
    let res = await axios.get(url)
    let data = res.data;

    for (let fundingInfo of data) {
        let tickerFunding = {}
        tickerFunding['ticker'] = fundingInfo['name'].replace("_USDT", "")
        tickerFunding['funding'] = parseFloat(fundingInfo['funding_rate'])
        tickerFunding['indexPrice'] = parseFloat(fundingInfo['index_price'])
        tickerFunding['markPrice'] = parseFloat(fundingInfo['mark_price'])
        tickerFunding['pcTime'] = new Date().getTime()
        result.push(tickerFunding)
    }

    return result
}


module.exports.getData = getData;