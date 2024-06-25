const axios = require('axios');
let errorCountGetTickerList = 0;
const args = process.argv
const version = args[2]
const {logErrorToCloudWatch} = require('../logger.js')


async function getTickerList () {
    try {
        const url = "https://api.gateio.ws/api/v4/futures/usdt/contracts"
        const response = await axios.get(url);

        let tickerList = [];
        let info = {};

        for (let tickerInfo of response.data) {
            let code = tickerInfo['name'].replace("_USDT", "");
            tickerList.push(code);

            let save = {};
            save['cont_size'] = parseFloat(tickerInfo['quanto_multiplier']);
            save['min_q'] = 1
            save['tick_size'] = parseFloat(tickerInfo['order_price_round'])
            info[code] = save;
        }
        errorCountGetTickerList = 0
        return [tickerList, info];
    } catch (error) {
        errorCountGetTickerList++
        if (errorCountGetTickerList > 5) {
            logErrorToCloudWatch("getTickerList", version, "gateio")
            throw error;
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        return await getTickerList();
    }
}



module.exports.getTickerList = getTickerList;