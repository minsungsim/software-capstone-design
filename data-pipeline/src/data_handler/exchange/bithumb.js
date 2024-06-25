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
        errorCnt += 1
        logErrorToCloudWatch(`getBithumbData error => ${content} ${JSON.stringify(option)} ${err}`, version, "bithumb")

        if (errorCnt > 5) {
            return undefined
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        return await getData(content, option)
    }
}


async function getOhlcv(option) {
    let result = {}
    let ticker = option['ticker'] + "_KRW"
    let interval = option['interval'] ? option['interval'] : "1m"
    let op = {"accept": "application/json"}

    let res = await axios.get(`https://api.bithumb.com/public/candlestick/${ticker}/${interval}`, op)
    let data = res.data.data;
    let row = data[data.length - 1];
    let o = parseFloat(row[1])
    let h = parseFloat(row[3])
    let l = parseFloat(row[4])
    let c = parseFloat(row[2])
    let v = parseFloat(row[5])
    let t = parseFloat(row[0])

    result['pcTime'] = new Date().getTime()
    result['serverTime'] = t
    result['data'] = {open: o, high: h, low: l, close: c, volume: v}
    result['ticker'] = option['ticker']
    return result
}



module.exports.getData = getData;