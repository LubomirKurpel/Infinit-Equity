
import * as global from './global.js';

// Web3modal function
let web3, web3Modal, userAddress;
var USDC_decimals = 6;
var handler;

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
		
		// Hide button, show the rest
		document.getElementById("initial").style.display = "none";
		
		
		// Check if user has ANY nfts from this particular contract
		var keyContract = await global.getContract(web3, "keyContract");
		
		var contractBalance = await keyContract.methods.balanceOf(userAddress).call().then( function(result) {
			
			return result;
				
		}, function(error) {
					
			console.log(error);
			
		});
		
		// Has at least 1 key
		if (parseInt(contractBalance) > 0) {
			
			document.getElementById("referral_container").style.display = "block";
			
			// Check current referral
			var referralContract = await global.getContract(web3, "referralContract");
			
			var referral = await referralContract.methods.referralByAddress(userAddress).call().then( function(result) {
				
				return result;
					
			}, function(error) {
						
				console.log(error);
				
			});
			
			// Set value of input
			document.getElementById('referral').value = referral;
			
		}
		else {
			
			// error
			var status = document.getElementById("status");
			
			status.classList.remove("error");
			status.classList.remove("success");
			
			status.style.display = "block";
			status.classList.add("error");
			
			status.innerHTML = "You need to own at least 1 of our NFT to set a referral!";
			
		}
			

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


async function onSetReferral() {
	
	var status = document.getElementById("status");
	status.innerHTML = "";
	
	var newReferral = document.getElementById('referral').value;
	
	// Check if referral does not already exist
	var referralContract = await global.getContract(web3, "referralContract");
	
	var proceed = false;
	
	var referral = await referralContract.methods.getAddressByReferral(newReferral).call().then( function(result) {
				
		return result;
			
	}, function(error) {
		
		proceed = true; // we proceed only if tx fails
		
		console.log(error);
		
	});
	
	if (proceed) {
		
		var keyContract = await global.getContract(web3, "keyContract");
		
		// send
		await keyContract.methods.setReferral(newReferral).send({
			from: userAddress
		}).on('receipt', function() {
			
			// success
			document.getElementById("status").style.display = "block";
			
			status.innerHTML = "New referral successfully set";

		});
	
	}
	else {
		
		// Referral already exists
		// error
		var status = document.getElementById("status");
		
		status.classList.remove("error");
		status.classList.remove("success");
		
		status.style.display = "block";
		status.classList.add("error");
		
		status.innerHTML = "This referral already exists, please choose some other referral and try again.";
		
	}
	
}

web3Modal = global.init();


function hideStatus() {
  document.getElementById("status").style.display = "none";
}

document.getElementById('btn-connect').addEventListener('click', onConnect);
document.getElementById('referral_submit').addEventListener('click', onSetReferral);
document.getElementById('close_popup').addEventListener('click', hideStatus);
