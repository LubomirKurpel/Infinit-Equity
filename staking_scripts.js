
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
		
		
		// Claim stats
		var treasuryContract = await global.getContract(web3, "treasuryContract");
		
		var claimableAmount = await treasuryContract.methods.claimableAmount(userAddress).call().then( function(result) {
			
			return result;
				
		}, function(error) {
					
			console.log(error);
			
		});
		
		document.getElementById("share_to_earn_rewards").innerHTML = claimableAmount;
		document.getElementById("personal_rewards").innerHTML = "0"; // Claimable treasury not deployed yet!
		
		
		
		// Iterate stakeable contracts
		for (let i = 0; i < global.config.staking_contracts.length; i++) {
			
			// Check if user has ANY nfts from this particular contract
			var projectContract = await global.getContract(web3, global.config.staking_contracts[i]);
			
			var contractBalance = await projectContract.methods.balanceOf(userAddress).call().then( function(result) {
				
				return result;
					
			}, function(error) {
						
				console.log(error);
				
			});
		
			// Iterate NFTs he owns
			for (let j = 0; j < parseInt(contractBalance); j++) {
				
				// Create new line
				document.getElementById("stakable_nfts").innerHTML += '<h2>' + global.config.staking_contracts[i]+ '</h2>';
				
				var tokenId = await projectContract.methods.tokenOfOwnerByIndex(userAddress, j).call().then( function(result) {
				
					return result;
						
				}, function(error) {
							
					console.log(error);
					
				});
				
				console.log(global.config.staking_contracts[i] + ": " + tokenId);
				console.log(projectContract);
				
				// Check if staked or not
				var symbol = await projectContract.methods.symbol().call().then( function(result) {
				
					return result;
						
				}, function(error) {
							
					console.log(error);
					
				});
				
				console.log(symbol);
				
				var staked = await projectContract.methods.staked(tokenId).call().then( function(result) {
				
					return result;
						
				}, function(error) {
							
					console.log(error);
					
				});
				
				var functionName = '';
				var buttonText = '';
				
				if (staked == false) {
					functionName = "onStake";
					buttonText = "Stake";
				}
				else {
					functionName = "onUnstake";
					buttonText = "Unstake";
				}
				
				var markup = "";
				markup += '<div id="' + global.config.staking_contracts[i] + tokenId + '">';
					markup += '<a href="#">' + buttonText + '</a>';
				markup += '</div>';
				
				// Create markup for this contract
				document.getElementById("stakable_nfts").innerHTML += '<div>Token ID: ' + tokenId + "<br/>" + markup + '</div>';
				
				if (staked == false) {
					document.getElementById(global.config.staking_contracts[i] + tokenId).firstChild.addEventListener('click', handler = function() {
						onStake(global.config.staking_contracts[i],tokenId)
					});
				}
				else {
					document.getElementById(global.config.staking_contracts[i] + tokenId).firstChild.addEventListener('click', handler = function() {
						onUnstake(global.config.staking_contracts[i],tokenId)
					});
				}
				
			}
			
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


async function onStake(contractName, tokenId) {
	
	var status = document.getElementById("status");
	status.innerHTML = "";
	
	var projectContract = await global.getContract(web3, contractName);
	
	console.log(contractName);
	
	// send
	await projectContract.methods.stake(tokenId).send({
		from: userAddress
	}).on('receipt', function() {

		document.getElementById(contractName + tokenId).firstChild.removeEventListener('click', handler);
			
		// success
		var markup = '<a href="#">Unstake</a>';
		
		document.getElementById(contractName + tokenId).innerHTML = markup;
		
		document.getElementById(contractName + tokenId).firstChild.addEventListener('click', handler = function() {
			onUnstake(contractName,tokenId)
		});
		
		document.getElementById("status").style.display = "block";
		
		status.innerHTML = "Successfully staked! Congratulations!";

	});
	
}

async function onUnstake(contractName, tokenId) {
	
	var status = document.getElementById("status");
	status.innerHTML = "";
	
	var projectContract = await global.getContract(web3, contractName);
	
	console.log(contractName);
	
	// send
	await projectContract.methods.unstake(tokenId).send({
		from: userAddress
	}).on('receipt', function() {

		document.getElementById(contractName + tokenId).firstChild.removeEventListener('click', handler);
			
		// success
		var markup = '<a href="#">Stake</a>';
		
		document.getElementById(contractName + tokenId).innerHTML = markup;
		
		document.getElementById(contractName + tokenId).firstChild.addEventListener('click', handler = function() {
			onStake(contractName,tokenId)
		});
		
		document.getElementById("status").style.display = "block";
		
		status.innerHTML = "Successfully unstaked!";

	});
	
	
}

web3Modal = global.init();


function hideStatus() {
  document.getElementById("status").style.display = "none";
}

document.getElementById('btn-connect').addEventListener('click', onConnect);
document.getElementById('close_popup').addEventListener('click', hideStatus);
