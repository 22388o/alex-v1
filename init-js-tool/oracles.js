const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();
const {
  makeContractCall,
  callReadOnlyFunction,
  AnchorMode,
  stringAsciiCV,
  uintCV,
  broadcastTransaction,
  bufferCVFromString
} = require('@stacks/transactions');


const {
  getPK, network
} = require('./wallet');

//Use CoinGeckoClient to fetch current prices of btc & usdc
const initCoinPrice = async () => {
  console.log('Updating coin market price...');
  const btc = await CoinGeckoClient.coins.fetch('bitcoin', {
    vs_currency: 'usd',
    from: new Date(Date.now() - 60 * 1000).getTime(),
    to: Date.now(),
  });
  const usdc = await CoinGeckoClient.coins.fetch('usd-coin', {
    vs_currency: 'usd',
    from: new Date(Date.now() - 60 * 1000).getTime(),
    to: Date.now(),
  });
  const usdcPrice = usdc.data.market_data.current_price.usd * 1e8;
  const btcPrice = btc.data.market_data.current_price.usd * 1e8;
  return {
    usdc: usdcPrice,
    btc: btcPrice
  };
};
//Call open-oracle to set price
const setOpenOracle = async (symbol, src, price) => {
  console.log('Setting oracle...', symbol, src, price);
  const privateKey = await getPK();

  const txOptions = {
    contractAddress: process.env.ACCOUNT_ADDRESS,
    contractName: 'open-oracle',
    functionName: 'update-price',
    functionArgs: [
      stringAsciiCV(symbol),
      stringAsciiCV(src),
      uintCV(price),
    ],
    senderKey: privateKey,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
  };
  try {
    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);
    console.log(broadcastResponse);
  } catch (error) {
    console.log(error);
  }
};

//Call open-oracle to get price
const getOpenOracle = async (src, symbol) => {
  console.log('Getting oracle...', src, symbol);

  const options = {
    contractAddress: process.env.ACCOUNT_ADDRESS,
    contractName: 'open-oracle',
    functionName: 'get-price',
    functionArgs: [
      stringAsciiCV(src),      
      stringAsciiCV(symbol)
    ],
    network: network,
    senderAddress: process.env.ACCOUNT_ADDRESS,
  };
  try {
    const result = await callReadOnlyFunction(options);
    console.log(result);
  } catch (error) {
    console.log(error);
  }
};

exports.default = {
  initCoinPrice,
  setOpenOracle,
  getOpenOracle
}