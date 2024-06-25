const bitget = require('../exchange/bitget.js');


async function testOhlcv () {
    let content = "ohlcv";
    let option = {
        "ticker": "BTC",
        "interval": "1m",
        "limit": 1
    }

    let result = await bitget.getData(content, option)
    console.log(result)
}

async function testFunding() {
    let content = "funding";
    let option = {
        "ticker": "BTC",
    }
    let result = await bitget.getData(content, option)
    console.log(result)
}

async function testAllFunding() {
    let content = "allFunding";
    let option = {
        "ticker": "BTC",
    }
    let result = await bitget.getData(content, option)
    console.log(result)
}

testAllFunding()

// testOhlcv()
// testFunding()

