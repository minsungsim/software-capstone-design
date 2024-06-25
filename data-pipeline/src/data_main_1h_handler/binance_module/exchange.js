let { getTickerList,getUpbitTickerList } = require('./public_api.js')
const socketEmitter = new (require('events'))



//api, 웹소켓 등등 탑재
module.exports = class Binance {

    exName = 'Binance';
    //get
    getTickerList = getTickerList
    getUpbitTickerList = getUpbitTickerList
}


