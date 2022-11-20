
import * as global from './global.js';

// Web3modal function
let web3, web3Modal, userAddress;
var USDC_decimals = 6;
var total = 0;

async function onConnect() {

	let provider;
	console.log("Opening Web3modal", web3Modal);

	try {
		provider = await web3Modal.connect();
	} catch (e) {
		alert("Could not get a wallet connection");
		return;
	}

	web3 = new Web3(provider);
	const accounts = await web3.eth.getAccounts();

	userAddress = accounts[0];

	const chainId = await web3.eth.getChainId();

	// 137 for Polygon
	if (chainId == global.chainID) {
		
		console.log('connected');
		
		// Hide button, show stats
		document.getElementById("initial").style.display = "none";
		document.getElementById("stats").style.display = "block";
		
		// My_nfts
		var env_copy = JSON.parse(JSON.stringify(global.env));
		delete env_copy.USDC_Contract;
		delete env_copy.referralContract;
		delete env_copy.treasuryContract;
		
		for (var key in env_copy) {
			
			// Print NFT
			document.getElementById("my_collections_container").insertAdjacentHTML('beforeend', '<div id="collection_container_' + key + '"></div>');
			
			// Get balance
			var projectContract = await global.getContract(web3, key);
			
			var contractBalance = await projectContract.methods.balanceOf(userAddress).call().then( function(result) {
				
				return result;
					
			}, function(error) {
						
				console.log(error);
				
			});
			
			if (parseInt(contractBalance) > 0) {
				
				if (key == "keyContract") {
					document.getElementById("collection_container_" + key).insertAdjacentHTML('afterbegin', '<h2>Your Key NFTs</h2>');
				}
				if (key == "coFounderContract") {
					document.getElementById("collection_container_" + key).insertAdjacentHTML('afterbegin', '<h2>Your Co Founder NFTs</h2>');
				}
				if (key == "realEstatesContract") {
					document.getElementById("collection_container_" + key).insertAdjacentHTML('afterbegin', '<h2>Your Real Estate NFTs</h2>');
				}
				if (key == "termDepositContract") {
					document.getElementById("collection_container_" + key).insertAdjacentHTML('afterbegin', '<h2>Your Term Deposit NFTs</h2>');
				}
				if (key == "coFounderPlusContract") {
					document.getElementById("collection_container_" + key).insertAdjacentHTML('afterbegin', '<h2>Your Co Founder+ NFTs</h2>');
				}
				
				total += parseInt(contractBalance);
				
			}
			
			
			for (let i = 0; i < parseInt(contractBalance); i++) {
				
				// Get token IDs of user's collections
				var tokenId = await projectContract.methods.tokenOfOwnerByIndex(userAddress, i).call().then( function(result) {
					
					return result;
						
				}, function(error) {
							
					console.log(error);
					
				});
				
				document.getElementById("collection_container_" + key).insertAdjacentHTML('beforeend', '<div id="collection_' + key + '_' + tokenId + '">Token ID: ' + tokenId + '</div>');
				
			}
			
		}
		
		if (total == 0) {
			document.getElementById("my_collections_container").insertAdjacentHTML('beforeend', '<div id="empty">You have 0 NFTs!</div>');
		}

	} else {
		
		// error
		var status = document.getElementById("status");
		
		status.classList.remove("error");
		status.classList.remove("success");
		
		status.style.display = "block";
		status.classList.add("error");
		
		status.innerHTML = "Please change network to Polygon!";
		
	}


}

web3Modal = global.init();


function hideStatus() {
  document.getElementById("status").style.display = "none";
}

document.getElementById('btn-connect').addEventListener('click', onConnect);
document.getElementById('close_popup').addEventListener('click', hideStatus);
