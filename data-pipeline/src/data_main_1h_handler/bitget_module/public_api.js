const axios = require('axios');
let errorCountGetTickerList = 0;
const args = process.argv
const version = args[2]
const {logErrorToCloudWatch} = require('../logger.js')


async function getTickerList () {
    try {
        const response = await axios.get('https://api.bitget.com/api/mix/v1/market/contracts?productType=umcbl');
        let tickerList = [];
        let info = {};
        for (let tickerInfo of response.data['data']) {
            if (tickerInfo['symbolStatus'] !== 'normal') {
                continue;
            }

            let ticker = tickerInfo['symbol'].replace("USDT_UMCBL", "");
            tickerList.push(ticker);

            info[ticker] = {
                price_precision: parseInt(tickerInfo['pricePlace']),
                volume_precision: parseInt(tickerInfo['volumePlace']), // amount 소숫점 몇째자리까지 가능한지.
                end_price_num: parseInt(tickerInfo['priceEndStep']), // 가격이 어떤 숫자로 끝나야 하는지.
            }
        }

        return [tickerList, info];
    } catch(error) {
        errorCountGetTickerList++
        if (errorCountGetTickerList > 5) {
            logErrorToCloudWatch("getTickerList", version, "bitget")
            throw error;
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        return await getTickerList();
    }
}


module.exports.getTickerList = getTickerList;