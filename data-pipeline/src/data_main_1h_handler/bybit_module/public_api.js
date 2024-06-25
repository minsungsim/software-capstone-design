const axios = require('axios');
let errorCountGetTickerList = 0;
const args = process.argv
const version = args[2]
const {logErrorToCloudWatch} = require('../logger.js')


async function getTickerList() {
    try {
        const url = 'https://api.bybit.com/v5/market/instruments-info?category=linear'
        let res = await axios.get(url);
        let tickerList = [];
        let infoDict = {};
        const tickerInfoList = res.data.result.list;
        for (let tickerInfo of tickerInfoList) {
            if (tickerInfo['status'] !== 'Trading') {
                continue;
            }
            let ticker = tickerInfo.symbol.replace("USDT", "");
            tickerList.push(ticker);
            infoDict[ticker] = {
                "max_q": parseFloat(tickerInfo.lotSizeFilter.maxOrderQty),
                "min_q": parseFloat(tickerInfo.lotSizeFilter.minOrderQty),
                "amount_precision": String(Math.round(1 / parseFloat(tickerInfo.lotSizeFilter.qtyStep))).length - 1,
                "price_precision": parseInt(tickerInfo.priceScale),
            };
        }

        return [tickerList, infoDict];
    } catch (error) {
        errorCountGetTickerList++
        if (errorCountGetTickerList > 5) {
            logErrorToCloudWatch("getTickerList", version, "bybit")
            throw error;
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        return await getTickerList();
    }
}


module.exports.getTickerList = getTickerList;