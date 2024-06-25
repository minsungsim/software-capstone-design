const okx = require('../exchange/okx.js');

async function testOhlcv () {
    let content = "ohlcv";
    let option = {
        "ticker": "BTC",
        "interval": "1m",
        "limit": 1
    }

    let result = await okx.getData(content, option);
    console.log(result)
}

async function testFunding() {
    let content = "funding";
    let option = {
        "ticker": "BTC",
    }
    let result = await okx.getData(content, option);
    console.log(result)
}



testOhlcv()
// testFunding()

