const binance = require('../exchange/binance.js');
const fs = require('fs');


async function testOrderbook () {
    let content = "orderbook";
    let option = {
        "ticker": "BTC",
        "limit": 1000
    }

    let result = await binance.getBinanceData(content, option);
}

async function testOhlcv () {
    let content = "ohlcv";
    let option = {
        "ticker": "BTC",
        "interval": "1m",
        "limit": 1
    }

    let result = await binance.getBinanceData(content, option);
}

async function testFunding() {
    let content = "funding";
    let option = {
        "ticker": "BTC",
    }
    let result = await binance.getBinanceData(content, option);
}


async function testOi() {
    let content = "oi";
    let option = {
        "ticker": "ETH",
    }

    let result = await binance.getBinanceData(content, option);
    console.log(result)
}


async function testAllFunding() {
    let content = "allFunding";

    let result = await binance.getBinanceData(content);
    console.log(result)
}

// testAllFunding()
// testOhlcv()

// test()

