const axios = require('axios');
let errorCountGetTickerList = 0;
const args = process.argv
const version = args[2]
const {logErrorToCloudWatch} = require('../logger.js')


async function getTickerList() {
    try {
        const response = await axios.get('https://api.bithumb.com/public/ticker/ALL_KRW');
        const tickers = response.data.data;

        const tickerList = [];
        for (const ticker in tickers) {
            if (ticker !== 'date') {
                tickerList.push(ticker);
            }
        }
        return tickerList
    }  catch (error) {
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