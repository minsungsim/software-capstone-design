let { getTickerList } = require('./public_api.js')
const socketEmitter = new (require('events'))



//api, 웹소켓 등등 탑재
module.exports = class Bybit {
    exName = 'Bybit';
    //get
    getTickerList = getTickerList
}

