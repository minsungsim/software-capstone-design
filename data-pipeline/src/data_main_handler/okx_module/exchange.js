let { getTickerList } = require('./public_api.js')
const socketEmitter = new (require('events'))



module.exports = class Okx {
    exName = 'Okx';
    //get
    getTickerList = getTickerList
}


