const binance = require('../exchange/binance.js');

async function testOhlcv () {
    let content = "ohlcv";
    let option = {
        "ticker": "BTC",
        "interval": "1h",
        "limit": 1
    }

    let result = await binance.getBinanceData(content, option);
    console.log(result)
}

async function testFunding() {
    let content = "funding";
    let option = {
        "ticker": "BTC",
    }
    let result = await binance.getBinanceData(content, option);
}

async function testLastFunding() {
    let content = "lastFunding";
    let option = {
        "ticker": "BTC",
    }
    let result = await binance.getBinanceData(content, option);
    console.log(result)
}


async function testOi() {
    let content = "oi";
    let option = {
        "ticker": "ETH",
    }

    let result = await binance.getBinanceData(content, option);
    console.log(result)
}

async function testTopTraderLongShortAccountRatio() {
    let content = "topTraderLongShortAccountRatio";
    let option = {
        "ticker": "ETH",
    }

    let result = await binance.getBinanceData(content, option);
    console.log(result)
}

async function testTopTraderLongShortPositionRatio() {
    let content = "topTraderLongShortPositionRatio";
    let option = {
        "ticker": "ETH",
    }

    let result = await binance.getBinanceData(content, option);
    console.log(result)
}


async function testTakerVolume() {
    let content = "takerVolume";
    let option = {
        "ticker": "ETH",
    }

    let result = await binance.getBinanceData(content, option);
    console.log(result)
}



// testTakerVolume()
// testTopTraderLongShortPositionRatio()
// testLastFunding()
// test()

