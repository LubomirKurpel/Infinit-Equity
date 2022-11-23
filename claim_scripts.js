
import * as global from './global.js';

// Web3modal function
let web3, web3Modal, userAddress;
var USDC_decimals = 6;

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

	// 5 for Goerli Testnet
	console.log(chainId);
	
	if (chainId == global.chainID) {
		
		console.log('connected');
		
		document.getElementById("claim").style.display = "block";
				
		// Hide button, show stats
		document.getElementById("initial").style.display = "none";
		
		// Check Claimable USDC in Treasury
		var treasuryContract = await global.getContract(web3, "treasuryContract");
		
		var claimableBalance = await treasuryContract.methods.claimableAmount(userAddress).call().then( function(result) {
			
			return result;
				
		}, function(error) {
					
			console.log(error);
			
		});
		
		console.log("Claimable Balance: " + claimableBalance);
		
		document.getElementById("claimableFunds").innerText = claimableBalance;
		
		
		
	} else {
		
		// error
		var status = document.getElementById("status");
		
		status.classList.remove("error");
		status.classList.remove("success");
		
		status.style.display = "block";
		status.classList.add("error");
		
		status.innerHTML = "Please change network to Polygon Mumbai Testnet!";
		
	}


}

async function onClaim() {
	
	var gasPrice = await web3.eth.getGasPrice(function(e, r) { console.log(r); return r; });
	
	var treasuryContract = await global.getContract(web3, "treasuryContract");
	
	// send
	await treasuryContract.methods.claim().send({
		from: userAddress,
		gasPrice: gasPrice
	}).on('confirmation', function() {

		// success
		document.getElementById("status").style.display = "block";
		var status = document.getElementById("status");
		
		status.innerHTML = "Successfully claimed!";
		
		document.getElementById("claimableFunds").innerText = "0";

	});
	
}

web3Modal = global.init();


function hideStatus() {
  document.getElementById("status").style.display = "none";
}

document.getElementById('btn-connect').addEventListener('click', onConnect);
document.getElementById('btn-claim').addEventListener('click', onClaim);
document.getElementById('close_popup').addEventListener('click', hideStatus);
