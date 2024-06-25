const upbit = require('../exchange/upbit.js');



async function testOhlcv () {
    let content = "ohlcv";
    let option = {
        "ticker": "BTC",
        "interval": "1m",
        "limit": 1
    }

    let result = await upbit.getUpbitData(content, option);
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

// test()

