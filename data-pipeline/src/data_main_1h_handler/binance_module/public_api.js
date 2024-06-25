const axios = require('axios');
const cheerio = require("cheerio");
let errorCountGetTickerList = 0;
const args = process.argv
const version = args[2]
const {logErrorToCloudWatch} = require('../logger.js')


async function getTickerList () {
    try {
        const binanceFuturesEndpoint = 'https://fapi.binance.com/fapi/v1/exchangeInfo';
        const response = await axios.get(binanceFuturesEndpoint);
        const symbols = response.data.symbols;
        let tickerList = [];
        let info = {}

        symbols.forEach(symbol => {
            if (symbol.contractType === 'PERPETUAL' && symbol.symbol.endsWith('USDT') && symbol.status === 'TRADING') {
                tickerList.push(symbol.symbol.split('USDT')[0])
                let save = {}
                save['min_q'] = symbol['filters'][2]['minQty']
                save['max_q'] = symbol['filters'][2]['maxQty']
                info[symbol.symbol.split('USDT')[0]]=save
            }
        });
        return [tickerList,info];

    } catch(error) {
        errorCountGetTickerList++
        if (errorCountGetTickerList > 5) {
            logErrorToCloudWatch("getTickerList", version, "upbit")
            throw error;
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        return await getTickerList();
    }
}

module.exports.getTickerList = getTickerList;


module.exports.getUpbitTickerList = async function () {
    try {
        const upbitMarketEndpoint = 'https://api.upbit.com/v1/market/all';
        //옵션 추가
        const response = await axios.get(upbitMarketEndpoint);
        const markets = response.data.filter(market => market.market.includes(`KRW-`));
        return markets.map(market => market.market.split('-')[1])
    } catch(err) {
        // logger.error("getUpbitKrwSpotTickerList error => ${error}")
        throw new Error(err);
    }
}






module.exports.getFx = async function (ratio) {
    let investingFx = await getFxInvesting()
    let hanaFx = await getFxHana();

    if (investingFx && hanaFx) {
        return (investingFx * ratio + hanaFx * (1 - ratio)).toFixed(2)
    }else{
        return undefined
    }

}

async function getFxInvesting () {
    try {
        const html = await axios.get(`https://kr.investing.com/currencies/usd-krw`, {
            headers: { "Accept-Encoding": "gzip,deflate,compress" }
        });

        const $ = cheerio.load(html.data);
        const data = {
            mainContents: $('div.instrument-price_instrument-price__xfgbB.flex.items-end.flex-wrap.font-bold > span').text(),
        };

        return parseFloat(data['mainContents'].replace(",", ""));

    } catch(err) {
        // logger.error("getUpbitKrwSpotTickerList error => ${error}")
        return undefined
    }
}


async function getFxHana() {
    try {
        const path = "https://quotation-api-cdn.dunamu.com/v1/forex/recent?codes=FRX.KRWUSD"
        //옵션 추가
        const response = await axios.get(path)
        return response.data[0]['basePrice']

    } catch(err) {
        // logger.error("getUpbitKrwSpotTickerList error => ${error}")
        return undefined
    }
}




