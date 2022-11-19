
async function onAddPolygon() {
	
	// 0x89 is hex of "137"
	
	if (window.ethereum.chainId == "0x89") {
		
		alert("Polygon Network has already been added to Metamask.");
		
	}
	else {
		window.ethereum.request({
		method: "wallet_addEthereumChain",
			params: [{
				chainId: '0x89',
				chainName: 'Polygon Mainnet',
				nativeCurrency: {
					name: 'MATIC',
					symbol: 'MATIC',
					decimals: 18
				},
				rpcUrls: ['https://polygon-rpc.com/'],
				blockExplorerUrls: ['https://polygonscan.com/']
			}]
		});
	}

}

async function onAddUSDC() {
	
	var tokenAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
    var tokenSymbol = 'USDC';
    var tokenDecimals = 6;
	var tokenImage = document.getElementById('USD_logo').src;
	
	window.ethereum.request({
		method: "wallet_watchAsset",
		params: {
			type: 'ERC20',
			options: {
				address: tokenAddress,
				symbol: tokenSymbol,
				decimals: tokenDecimals,
				image: tokenImage,
			}
		}
	});

}

document.getElementById('add-polygon').addEventListener('click', onAddPolygon);
document.getElementById('add-usdc').addEventListener('click', onAddUSDC);