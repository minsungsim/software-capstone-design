const axios = require("axios");
const cheerio = require("cheerio");


module.exports.getFxInvesting = async function getFxInvesting () {
    try {
        const html = await axios.get(`https://kr.investing.com/currencies/usd-krw`, {
            headers: { "Accept-Encoding": "gzip,deflate,compress" }
        });

        const $ = cheerio.load(html.data);
        const data = {
            mainContents: $('div.flex-1 > div.flex-wrap').text(),
        };
        return parseFloat(data['mainContents'].replace(",", ""));

    } catch(err) {
        // logger.error("getUpbitKrwSpotTickerList error => ${error}")
        return undefined
    }
}

// div.relative.flex > div.pt-5.md\:pt-10.xl\:container.xl\:mx-auto.font-sans-v2.antialiased.text-\[\#232526\].grid.grid-cols-1.md\:grid-cols-\[1fr_72px\].md2\:grid-cols-\[1fr_420px\].px-4.sm\:px-6.md\:px-7.md\:gap-6.md2\:px-8.md2\:gap-8.flex-1 > div.min-w-0 > div.flex.flex-col.gap-6.md\:gap-0 > div.flex.gap-6 > div.flex-1 > div.flex.flex-wrap.gap-x-4.gap-y-2.items-center.md\:gap-6.mb-3.md\:mb-0\.5 > div.text-5xl\/9.font-bold.md\:text-\[42px\].md\:leading-\[60px\].text-\[\#232526\]
module.exports.getFxHana = async function getFxHana() {
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