const axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const MAX_COUNT = 200;

async function fetchUpbitData(market, to, count) {
    const endpoint = 'https://api.upbit.com/v1/candles/minutes/1';
    const response = await axios.get(endpoint, {
        params: {
            market,
            to,
            count
        }
    });
    return response.data;
}


async function main() {
    const market = 'KRW-BTC';
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-03');
    const oneDay = 24 * 60 * 60 * 1000;
    let currentDay = startDate;
    let allData = [];

    while (currentDay <= endDate) {
        console.log(`Fetching data for ${currentDay.toISOString().split('T')[0]}`);



        let fetchedCount = 0;
        while (fetchedCount < 24 * 60) {
            const data = await fetchUpbitData(market, currentDay.toISOString(), Math.min(MAX_COUNT, 24*60 - fetchedCount));
            allData = [...allData, ...data.reverse()];
            fetchedCount += data.length;
            await new Promise(resolve => setTimeout(resolve, 500)); // API 제한을 피하기 위해 잠시 대기
        }

        currentDay = new Date(currentDay.getTime() + oneDay);
    }

    const csvWriter = createCsvWriter({
        path: 'BTC_KRW_2023_01.csv',
        header: [
            { id: 'timestamp', title: 'TIMESTAMP' },
            { id: 'opening_price', title: 'OPEN' },
            { id: 'high_price', title: 'HIGH' },
            { id: 'low_price', title: 'LOW' },
            { id: 'trade_price', title: 'CLOSE' },
            { id: 'candle_acc_trade_volume', title: 'VOLUME' }
        ]
    });

    const records = allData.map(data => ({
        timestamp: data.timestamp,
        opening_price: data.opening_price,
        high_price: data.high_price,
        low_price: data.low_price,
        trade_price: data.trade_price,
        candle_acc_trade_volume: data.candle_acc_trade_volume
    }));

    csvWriter.writeRecords(records).then(() => {
        console.log('CSV file written successfully');
    });
}

main();