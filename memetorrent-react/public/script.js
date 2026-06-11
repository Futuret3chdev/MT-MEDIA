document.addEventListener('DOMContentLoaded', function() {
    const apiUrlMetadata = "https://solana-gateway.moralis.io/token/mainnet/ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump/metadata";
    const apiUrlTokenPrice = "https://solana-gateway.moralis.io/token/mainnet/ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump/price";
    const apiUrlAnalytics = "https://deep-index.moralis.io/api/v2.2/tokens/ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump/analytics?chain=solana";
    const headers = {
        "Accept": "application/json",
        "X-API-Key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImFiZTU2YmY0LWQwOGItNDI5Mi04ZGFiLTg4ODdiYjI1MjgwYiIsIm9yZ0lkIjoiNDM0Mzg0IiwidXNlcklkIjoiNDQ2ODQzIiwidHlwZUlkIjoiYjBjNjlkYjUtZWM0MC00NzAzLWExMzYtNmU5N2Y2NjU2YWNiIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDA5MTg4NzUsImV4cCI6NDg5NjY3ODg3NX0._e5zANV-wJCQ5rpnYcGWRLyhBCQWG-islaTNt6FFPXQ"
    };

    // Fetch token metadata
    fetch(apiUrlMetadata, { headers: headers })
        .then(response => response.json())
        .then(metadata => {
            console.log(metadata); // Debugging line

            const name = metadata.name || "N/A";
            const symbol = metadata.symbol || "N/A";
            const totalSupply = parseFloat(metadata.totalSupplyFormatted) || 0;

            document.getElementById('token-name').textContent = name;
            document.getElementById('token-symbol').textContent = symbol;
            document.getElementById('token-supply').textContent = totalSupply.toLocaleString();

            // Fetch token price
            fetch(apiUrlTokenPrice, { headers: headers })
                .then(response => response.json())
                .then(priceData => {
                    console.log(priceData); // Debugging line
                    const price = parseFloat(priceData.usdPrice) || NaN;
                    console.log("Fetched price:", price); // Debugging line

                    document.getElementById('token-price').textContent = !isNaN(price) ? price.toFixed(10) : "N/A";

                    // Calculate market cap
                    const marketCap = !isNaN(price) ? price * totalSupply : NaN;
                    console.log("Calculated market cap:", marketCap); // Debugging line
                    document.getElementById('market-cap').textContent = !isNaN(marketCap) ? `$${marketCap.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A";
                })
                .catch(error => console.error('Error fetching token price:', error));
        })
        .catch(error => console.error('Error fetching token metadata:', error));

    // Fetch token analytics data
    fetch(apiUrlAnalytics, { headers: headers })
        .then(response => response.json())
        .then(analytics => {
            console.log(analytics); // Debugging line

            const totalBuys = analytics.totalBuys?.['24h'] || "N/A";
            const totalSells = analytics.totalSells?.['24h'] || "N/A";
            const totalBuyVolume = analytics.totalBuyVolume?.['24h'] || "N/A";
            const totalSellVolume = analytics.totalSellVolume?.['24h'] || "N/A";

            document.getElementById('total-buys').textContent = totalBuys;
            document.getElementById('total-sells').textContent = totalSells;
            document.getElementById('total-buy-volume').textContent = totalBuyVolume;
            document.getElementById('total-sell-volume').textContent = totalSellVolume;
        })
        .catch(error => console.error('Error fetching token analytics:', error));
});
