const bingx = require('../exchange/bithumb.js');


async function testOhlcv () {
    let content = "ohlcv";
    let option = {
        "ticker": "BTC",
        "interval": "1m",
        "limit": 1
    }

    let result = await bingx.getData(content, option)
    console.log(result)
}


async function testOhlcv1h () {
    let content = "ohlcv";
    let option = {
        "ticker": "BTC",
        "interval": "1h",
        "limit": 1
    }

    let result = await bingx.getData(content, option)
    console.log(result)
}


// testOhlcv1h()
// testOhlcv()
