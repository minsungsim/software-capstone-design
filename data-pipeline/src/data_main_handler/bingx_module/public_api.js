const axios = require('axios');
let errorCountGetTickerList = 0;
const args = process.argv
const version = args[2]
const {logErrorToCloudWatch} = require('../logger.js')


async function getTickerList() {
    try {
        const response = await axios.get('https://open-api.bingx.com/openApi/swap/v2/quote/contracts');
        const data = response.data;
        let contracts = data['data'];
        let tickerList = [];
        let info = {}
        //console.log(contracts)
        contracts.forEach(contract => {
            tickerList.push(contract['asset']);
            let save = {};
            save['min_q'] = parseInt(contract['tradeMinLimit']);
            save['tick_size'] = (10 ** (-parseInt(contract['pricePrecision']))).toFixed(parseInt(contract['pricePrecision']))
            save['amount_precision'] = parseInt(contract['quantityPrecision']);
            info[contract['asset']] = save;
        });

        return [tickerList, info];
    } catch(error) {
        errorCountGetTickerList++
        if (errorCountGetTickerList > 5) {
            logErrorToCloudWatch("getTickerList", version, "bingx")
            throw error;
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        return await getTickerList();
    }
}


module.exports.getTickerList = getTickerList;