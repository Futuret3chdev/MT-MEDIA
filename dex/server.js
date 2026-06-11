const express = require('express');
const axios = require('axios');
const Web3 = require('web3');
const app = express();
const port = 3000;

// API Keys and Endpoints (use your provided values)
const ALCHEMY_ETH_URL = 'https://eth-mainnet.g.alchemy.com/v2/MTgkh9qFwjLKuhoizfbR-bMKwTIk36iS';
const BSC_PUBLIC_NODE = 'https://bsc-dataseed.binance.org/';

// Initialize Web3 instances
const web3Eth = new Web3(ALCHEMY_ETH_URL);
const web3Bsc = new Web3(BSC_PUBLIC_NODE);

app.use(express.static('public'));

// Endpoint to fetch Ethereum pairs (simplified, using Uniswap V2 as an example)
app.get('/eth-pairs', async (req, res) => {
    try {
        // Example: Fetching data from Uniswap V2 via The Graph (you’d need a subgraph in a real app)
        const response = await axios.post(
            'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
            {
                query: `
                {
                    pairs(first: 5, orderBy: volumeUSD, orderDirection: desc) {
                        id
                        token0 { symbol }
                        token1 { symbol }
                        reserveUSD
                        volumeUSD
                    }
                }`
            }
        );
        const pairs = response.data.data.pairs.map(pair => ({
            pair: `${pair.token0.symbol}/${pair.token1.symbol}`,
            price: 'N/A', // Requires token price calculation
            volume: `$${parseFloat(pair.volumeUSD).toFixed(2)}`,
            liquidity: `$${parseFloat(pair.reserveUSD).toFixed(2)}`
        }));
        res.json(pairs);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching Ethereum pairs');
    }
});

// Endpoint to fetch BSC pairs (PancakeSwap example)
app.get('/bsc-pairs', async (req, res) => {
    try {
        // Mock PancakeSwap pair data (real implementation needs contract interaction)
        const mockPairs = [
            { pair: 'BNB/BUSD', price: '$600.50', volume: '$15.3M', liquidity: '$50M' },
            { pair: 'CAKE/BNB', price: '$2.10', volume: '$5.7M', liquidity: '$20M' }
        ];
        res.json(mockPairs);
        // For real data, interact with PancakeSwap contracts via web3Bsc
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching BSC pairs');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});