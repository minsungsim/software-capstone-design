const axios = require('axios');
const cheerio = require("cheerio");
const moment = require("moment")
const fs = require('fs-extra');
let errorCountGetTickerList = 0;
const args = process.argv
const version = args[2]
const {logErrorToCloudWatch} = require('../logger.js')

//완료

async function getTickerList() {
    try {
        const upbitMarketEndpoint = 'https://api.upbit.com/v1/market/all';
        //옵션 추가
        const response = await axios.get(upbitMarketEndpoint);
        const markets = response.data.filter(market => market.market.includes(`KRW-`));
        errorCountGetTickerList = 0
        return markets.map(market => market.market.split('-')[1])
    } catch(err) {
        errorCountGetTickerList++
        if (errorCountGetTickerList > 5) {
            logErrorToCloudWatch("getTickerList", version, "upbit")
            throw err;
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        return await getTickerList();
    }
}

module.exports.getTickerList = getTickerList;


module.exports.getBinanceTickerList = async function () {
    try {
        const binanceFuturesEndpoint = 'https://fapi.binance.com/fapi/v1/exchangeInfo';
        const response = await axios.get(binanceFuturesEndpoint);
        const symbols = response.data.symbols;
        let tickerList = [];
        symbols.forEach(symbol => {
            if (symbol.contractType === 'PERPETUAL' && symbol.symbol.endsWith('USDT') && symbol.status === 'TRADING') {
                tickerList.push(symbol.symbol.split('USDT')[0])
            }
        });
        return tickerList;

    } catch(err) {
        // logger.error("getUpbitKrwSpotTickerList error => ${error}")
        throw new Error(err)
    }
}


module.exports.getFx = async function () {
    let investingFx = await getFxInvesting()
    let hanaFx = await getFxHana();


    if (investingFx && hanaFx) {
        const newData = {
            in:investingFx,
            ha:hanaFx,
        };
          

        let save = {}
        save["fx"]=newData
        return save;
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



//----------------------------------

module.exports.getWalletState = function(tickers, callback) {
    const options = {
        method: "GET",
        url : "https://ccx.upbit.com/api/v1/status/wallet",
        timeout: 500,
        headers: {Accept: 'application/json'},
    }
    axios(options)
    .then((res) => {
        let data = getWalletStateCal(tickers, res.data);
        callback(data)  
    })
    .catch((error) => {
        callback(undefined);
    });
}


function getWalletStateCal(tickers, body){
    try{
        let wallet_state = {}
        //console.log(111)
        let json1 = body

        //console.log(json1)
        //console.log(json1)
        for (iiii of tickers){
            //console.log(iiii)

            for (jjjj of json1){
                //console.log(jjjj)
                if (iiii==jjjj["currency"]){
                    //console.log(iiii)
                    wallet_state[iiii]={}
                    if (jjjj["wallet_state"]=="working"){
                        wallet_state[iiii]["d"]=1
                        wallet_state[iiii]["w"]=1
                    }else if (jjjj["wallet_state"]=="withdraw_only"){
                        wallet_state[iiii]["d"]=0
                        wallet_state[iiii]["w"]=1
                    }else if (jjjj["wallet_state"]=="deposit_only"){
                        wallet_state[iiii]["d"]=1
                        wallet_state[iiii]["w"]=0
                    }else if (jjjj["wallet_state"]=="paused"){
                        wallet_state[iiii]["d"]=0
                        wallet_state[iiii]["w"]=0
                    }else if (jjjj["wallet_state"]=="unsupported"){
                        wallet_state[iiii]["d"]=0
                        wallet_state[iiii]["w"]=0
                    }else{
                        wallet_state[iiii]["d"]=0
                        wallet_state[iiii]["w"]=0
                    }
                    if (jjjj["message"].includes("유의종목") || jjjj["message"].includes("유의 종목")){
                        wallet_state[iiii]["m"]=1
                    }else{
                        wallet_state[iiii]["m"]=0
                    }
                }
            }
        }
        //console.log(wallet_state)    
        return wallet_state                    
    }catch{}   
}


//----------------------------------



module.exports.getNotice = function(notice_dict,notice_state,wallet_state,tickers, num, callback) {

    const options = {
        method: "GET",
        url : "https://api-manager.upbit.com/api/v1/notices?page=" + String(num) + "&per_page=20&thread_name=general",
        timeout: 500,
        headers: {Accept: 'application/json'},
    }

    axios(options)
    .then((res) => {
        //console.log(res.data)
        callback(getNoticeCal(notice_dict,notice_state,wallet_state,tickers, num, res.data))
    })
    .catch((error) => {
        callback(undefined, undefined);
    });
}



function getNoticeCal(notice_dict,notice_state,wallet_state,tickers, num, body){
    try{
        
        let json = body
        for (ifqwef in json['data']['list']){
            //console.log(json['data']['list'][ifqwef]['title'].slice(0,4))
            if (json['data']['list'][ifqwef]['title'].slice(0,4)!="[NFT"){
                //console.log(json['data']['list'][ifqwef]['title'].slice(0,4))
                notice_dict[json['data']['list'][ifqwef]['id']]={}
                notice_dict[json['data']['list'][ifqwef]['id']]['created_at']=json['data']['list'][ifqwef]['created_at']
                notice_dict[json['data']['list'][ifqwef]['id']]['title']=json['data']['list'][ifqwef]['title']
            }
            
        }
        //console.log('--------------------------')
        
        for (fqde of tickers){
            //console.log(fqde)
            notice_state[fqde]={}
            notice_state[fqde]['deposit']=wallet_state[fqde]['deposit']
            notice_state[fqde]['message']=wallet_state[fqde]['message']
            notice_state[fqde]['state']=0
            if (wallet_state[fqde]['deposit']==0){
                notice_state[fqde]['state']=1
            }

            if (wallet_state[fqde]['message']==1){
                notice_state[fqde]['state']=3
            }
            notice_state[fqde]['re_time']=100000
        }
        //console.log(notice_state)
        for (ifqwe in notice_dict){
            let title_ = notice_dict[ifqwe]['title']
            let up_time = notice_dict[ifqwe]['created_at']
            let now_time = new Date().getTime()
            let up_time_ = now_time - new Date(up_time).getTime()
            up_time_ = up_time_/1000
            up_time_ = up_time_/86400
            //console.log(up_time_,title_)
            //new Date().getTime()
            //title_ = "[이벤트] BTC 리브랜딩"

            //전체 입출금 금지 2
            let tem_con1 = 0
            let tem_con2 = 0
            for (ifaweq in notice_state){
                tem_con1=tem_con1+1
                if (notice_state[ifaweq]['deposit']==0){
                    tem_con2=tem_con2+1
                }
            }
            if (tem_con1==tem_con2){
                for (coded of tickers){
                    notice_state[coded]['state']=2
                    notice_state[coded]['re_time']=up_time_
                }
            }

            //0:기본
            //1:입출금 중단
            //2:전체 입출금 중단
            //3:유의
            //4:거래종료
            //5:심볼 변경 리브랜딩
            
            if(title_.includes("중단 안내") || title_.includes("중단안내")){
                if(title_.includes("입출금") || title_.includes("입금")){
                    //console.log(11)
                    if (!(title_.includes("완료") || title_.includes("입금 재개") || title_.includes("입출금 재개"))){
                        for (coded of tickers){
                            if (title_.includes('('+coded+')') || title_.includes(' '+coded+' ') || title_.includes(' '+coded+',') || title_.includes(','+coded+' ')){
                                if (notice_state[coded]['message']!=1){
                                    notice_state[coded]['state']=1
                                    notice_state[coded]['re_time']=up_time_
                                }
                            }   
                        }
                    }
                }
            }
            

            if(title_.includes("유의 종목") || title_.includes("유의종목")){
                //console.log(11)
                if (!(title_.includes("지정 해제") || title_.includes("지정해제"))){
                    for (coded of tickers){
                        if (title_.includes('('+coded+')') || title_.includes(' '+coded+' ') || title_.includes(' '+coded+',') || title_.includes(','+coded+' ')){
                            if (notice_state[coded]['message']==1){
                                notice_state[coded]['state']=3
                                notice_state[coded]['re_time']=up_time_
                            }
                        }   
                    }
                }
            }

            if(title_.includes("거래지원 종료") || title_.includes("거래 지원 종료") || title_.includes("거래 지원종료") || title_.includes("거래지원종료")){
                //console.log(11)
                for (coded of tickers){
                    if (title_.includes('('+coded+')') || title_.includes(' '+coded+' ') || title_.includes(' '+coded+',') || title_.includes(','+coded+' ')){
                        notice_state[coded]['state']=4
                        notice_state[coded]['re_time']=up_time_
                    }   
                }
            }


            if(title_.includes("리브랜딩") || title_.includes("심볼변경") || title_.includes("심볼 변경")){
                //console.log(11)
                if (!(title_.includes("[이벤트]") || title_.includes("완료") || title_.includes("거래 지원 재개 안내"))){
                    for (coded of tickers){
                        if (title_.includes('('+coded+')') || title_.includes(' '+coded+' ') || title_.includes(' '+coded+',') || title_.includes(','+coded+' ')){
                            notice_state[coded]['state']=5
                            notice_state[coded]['re_time']=up_time_
                        }   
                    }
                }
            }



        }
        //console.log(Object.keys(notice_dict).length)
        return [notice_dict, notice_state]

    }catch{
        return [undefined, undefined]
    }
}

