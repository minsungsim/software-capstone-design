const binance = require('./exchange/binance.js');
const upbit = require('./exchange/upbit.js');
const bingx = require('./exchange/bingx.js');
const bithumb = require('./exchange/bithumb.js');
const bitget = require('./exchange/bitget.js');
const bybit = require('./exchange/bybit.js');
const okx = require('./exchange/okx.js');
const gateio = require('./exchange/gateio.js');


exports.getData = async (event) => {
    let queryStringParameters = event.queryStringParameters;
    let exchange = queryStringParameters['exchange'];
    let content = queryStringParameters['content'];
    delete queryStringParameters['exchange'];
    delete queryStringParameters['content'];
    let option = queryStringParameters
    let result;

    if (exchange === 'binance') {
        result = await binance.getBinanceData(content, option);
    } else if (exchange === 'upbit') {
        result = await upbit.getData(content, option);
    } else if (exchange === 'bingx') {
        result = await bingx.getData(content, option);
    } else if (exchange === 'bithumb') {
        result = await bithumb.getData(content, option);
    } else if (exchange === 'bitget') {
        result = await bitget.getData(content, option);
    } else if (exchange === 'bybit') {
        result = await bybit.getData(content, option);
    } else if (exchange === 'okx') {
        result = await okx.getData(content, option);
    } else if (exchange === 'gateio') {
        result = await gateio.getData(content, option);
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify(result),
    };
    return response;
};
