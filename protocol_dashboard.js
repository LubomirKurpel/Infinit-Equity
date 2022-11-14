
import * as global from './global.js';

// Web3modal function
let web3, web3Modal;

async function onConnect() {

	var provider = new Web3.providers.HttpProvider("https://polygon-mainnet.g.alchemy.com/v2/sjdbE-BOLQbQrAGVXNVghLfXmlkbA2Lc");
	web3 = new Web3(provider);

	const chainId = await web3.eth.getChainId();

	// 5 for Goerli Testnet
	if (chainId == global.chainID) {
		
		console.log('connected');
		
		// Hide button, show stats
		document.getElementById("initial").style.display = "none";
		document.getElementById("stats").style.display = "block";
		
		
		
		// 2D - collections Count
		var env_copy = JSON.parse(JSON.stringify(global.env));
		delete env_copy.USDC_Contract;
		delete env_copy.referralContract;
		delete env_copy.treasuryContract;
		
		var collections_count = Object.keys(env_copy).length;
		
		document.getElementById("collections_count").textContent = collections_count;
		
		
		
		// 2G - Minted NFTs
		var referralContract = await global.getContract(web3, "referralContract");
		
		var totalMintedNFTs = await referralContract.methods.totalMintedNFTs().call().then( function(result) {
			
			document.getElementById("minted_nfts_count").textContent = result;
				
		}, function(error) {
					
			console.log(error);
			
		});
		
		
		// 2E - Monthly and yearly payouts
		var env_copy = JSON.parse(JSON.stringify(global.env));
		delete env_copy.USDC_Contract;
		delete env_copy.referralContract;
		delete env_copy.treasuryContract;
		delete env_copy.coFounderContract;
		
		var total_price = 0;
		var total_apr = 0;
		var total_nfts = 0;
		
		for (var key in env_copy) {

			// Get initial price
			var projectContract = await global.getContract(web3, key);
			
			var price = await projectContract.methods.price().call().then( function(result) {
				
				return result;
					
			}, function(error) {
						
				console.log(error);
				
			});
			
			total_price += parseInt(price); 
			
			// Get APR
			var APR = await projectContract.methods.APR().call().then( function(result) {
				
				return result;
					
			}, function(error) {
						
				console.log(error);
				
			});
			
			total_apr += parseInt(APR); 
			
			// Get total NFTs
			var total_nfts_count = await projectContract.methods.total().call().then( function(result) {
				
				return result;
					
			}, function(error) {
						
				console.log(error);
				
			});
			
			total_nfts += parseInt(total_nfts_count); 
			
		}
		
		// Average APR total
		var average_apr = total_apr / Object.keys(env_copy).length;
		
		// Calculations
		var yearly_payouts = (total_nfts * total_price / Object.keys(env_copy).length) / 100 * (average_apr / 100);
		var monthly_payouts = yearly_payouts / 12;
		
		var USDC_decimals = 6;
		
		document.getElementById("yearly_payouts").textContent = yearly_payouts / 10**USDC_decimals;
		document.getElementById("monthly_payouts").textContent = monthly_payouts / 10**USDC_decimals;
		


	} else {
		
		// error
		var status = document.getElementById("status");
		
		status.classList.remove("error");
		status.classList.remove("success");
		
		status.style.display = "block";
		status.classList.add("error");
		
		status.innerHTML = "Please change network to Goerli Testnet!";
		
	}


}

// web3Modal = global.init();
onConnect();

function hideStatus() {
  document.getElementById("status").style.display = "none";
}

/*
document.getElementById('btn-connect').addEventListener('click', onConnect);

document.getElementById('close_popup').addEventListener('click', hideStatus);
*/
