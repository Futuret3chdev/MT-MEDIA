document.getElementById('tokenForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const tokenSymbol = document.getElementById('tokenSymbol').value;

    try {
        const response = await fetch(`https://api.solanatracker.io/v1/token/${tokenSymbol}`);
        const data = await response.json();
        const tokenInfo = `
            <p>Symbol: ${data.symbol}</p>
            <p>Name: ${data.name}</p>
            <p>Price: ${data.price}</p>
            <p>Market Cap: ${data.market_cap}</p>
            <p>Total Supply: ${data.total_supply}</p>
        `;
        document.getElementById('tokenInfoDisplay').innerHTML = tokenInfo;
    } catch (error) {
        console.error('Error fetching token info:', error);
        document.getElementById('tokenInfoDisplay').innerText = 'Error fetching token info';
    }
});