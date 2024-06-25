const fs = require('fs');
const axios = require("axios");
let errorCnt = 0
let version = "lambda"
let {logErrorToCloudWatch} = require('../util/logger.js')


async function getData(content, option) {
    try {
        if (content === "ohlcv") {
            return await getOhlcv(option)
        }
    } catch (err) {
        console.log(err)
        // errorCnt
        errorCnt += 1
        logErrorToCloudWatch(`getUpbitData error => ${content} ${JSON.stringify(option)} ${err}`, version, "upbit")

        if (errorCnt > 5) {
            return undefined
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        return await getData(content, option)
    }
}


async function getOhlcv(option) {
    let result = {}
    let ticker = "KRW-" + option['ticker']
    let interval = option['interval'] ? option['interval'] : "1m"
    let op = {"accept": "application/json"}

    if (interval === "1m") {
        let res = await axios.get(`https://api.upbit.com/v1/candles/minutes/1?market=${ticker}&count=2`, op)
        let data = res.data[res.data.length - 1]
        let o = parseFloat(data['opening_price'])
        let h = parseFloat(data['high_price'])
        let l = parseFloat(data['low_price'])
        let c = parseFloat(data['trade_price'])
        let v = parseFloat(data['candle_acc_trade_volume'])
        let t = parseFloat(data['timestamp'])

        result['pcTime'] = new Date().getTime()
        result['serverTime'] = t
        result['data'] = {open: o, high: h, low: l, close: c, volume: v}
        result['ticker'] = option['ticker']

    } else if (interval === "1h") {
        let res = await axios.get(`https://api.upbit.com/v1/candles/minutes/60?market=${ticker}&count=2`, op)
        let data = res.data[res.data.length - 1]
        let o = parseFloat(data['opening_price'])
        let h = parseFloat(data['high_price'])
        let l = parseFloat(data['low_price'])
        let c = parseFloat(data['trade_price'])
        let v = parseFloat(data['candle_acc_trade_volume'])
        let t = parseFloat(data['timestamp'])

        result['pcTime'] = new Date().getTime()
        result['serverTime'] = t
        result['data'] = {open: o, high: h, low: l, close: c, volume: v}
        result['ticker'] = option['ticker']
    }

    return result
}


module.exports.getData = getData;