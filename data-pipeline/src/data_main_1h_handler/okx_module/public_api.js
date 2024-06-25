const axios = require('axios');
let errorCountGetTickerList = 0;
const args = process.argv
const version = args[2]
const {logErrorToCloudWatch} = require('../logger.js')


async function getTickerList() {
    try {
        const okxEndpoint = 'https://www.okx.com/api/v5/public/instruments?instType=SWAP';
        const response = await axios.get(okxEndpoint);
        const instruments = response.data.data;
        const tickerList = [];
        let info = {};

        instruments.forEach(instrument => {
            if (instrument.settleCcy === 'USDT') {
                let ticker = instrument.ctValCcy;
                tickerList.push(ticker);
                info[ticker] = {
                    min_q: parseFloat(instrument['minSz']),
                    max_q: parseFloat(instrument['maxLmtSz']),
                    cont_size: parseFloat(instrument['ctVal']),
                    price_precision: String(Math.round(1 / instrument['tickSz'])).length - 1
                }
            }
        });

        errorCountGetTickerList = 0
        return [tickerList, info];
    } catch (error) {
        errorCountGetTickerList++
        if (errorCountGetTickerList > 5) {
            logErrorToCloudWatch("getTickerList", version, "okx")
            throw error;
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        return await getTickerList();
    }
}


module.exports.getTickerList = getTickerList;