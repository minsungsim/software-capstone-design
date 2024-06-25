const upbit = require('../exchange/upbit.js');



async function testOhlcv () {
    let content = "ohlcv";
    let option = {
        "ticker": "BTC",
        "interval": "1m",
        "limit": 1
    }

    let result = await upbit.getData(content, option);
    console.log(result)
}

async function testOhlcv1h () {
    let content = "ohlcv";
    let option = {
        "ticker": "BTC",
        "interval": "1h",
        "limit": 1
    }

    let result = await upbit.getData(content, option);
    console.log(result)
}



// async function testFunding() {
//     let content = "ohlcv";
//     let option = {
//         "ticker": "BTC",
//         "interval": "1m",
//         "limit": 1
//     }
//
// }
//
//
// testOrderbook()
// testOhlcv1h()

