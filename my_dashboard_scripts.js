
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
	if (chainId == global.chainID) {
		
		var referralContract = await global.getContract(web3, "referralContract");
		
		console.log('connected');
		
		// Hide button, show stats
		document.getElementById("initial").style.display = "none";
		document.getElementById("stats").style.display = "block";
		
		
		// My_nfts
		var env_copy = JSON.parse(JSON.stringify(global.env));
		delete env_copy.USDC_Contract;
		delete env_copy.referralContract;
		delete env_copy.treasuryContract;
		
		var my_nfts_count = 0;
		var real_estate_nfts = 0;
		var term_deposit_nfts = 0;
		var other_nfts = 0;
		var number_of_collections = 0;
		var total_apr = 0;
		var total_price = 0;

		
		for (var key in env_copy) {

			// Get balance
			var projectContract = await global.getContract(web3, key);
			
			var contractBalance = await projectContract.methods.balanceOf(userAddress).call().then( function(result) {
				
				return result;
					
			}, function(error) {
						
				console.log(error);
				
			});
			
			my_nfts_count += parseInt(contractBalance);
			
			// Owns any NFT of this collection
			if (parseInt(contractBalance) > 0 && key != "coFounderContract") {
				
				number_of_collections++;
				
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
				
				if (key == "keyContract") {
					
					// Get infinit key children
					var keyTokenId = await projectContract.methods.tokenOfOwnerByIndex(userAddress, 0).call().then( function(result) {
						
						return result;
							
					}, function(error) {
								
						console.log(error);
						
					});
					
					// Get hash from key contract and token ID
					var hash = web3.utils.soliditySha3(global.env.keyContract, keyTokenId);
					
					var tokenStruct = await referralContract.methods.allNFTs(hash).call().then( function(result) {
						
						return result;
							
					}, function(error) {
								
						console.log(error);
						
					});
					
					console.log(tokenStruct.numberOfChildren);
					
					// Personal NFT sales
					document.getElementById("personal_nft_sales").textContent = tokenStruct.numberOfChildren;
					
					var personalPartners = 0;
					var personalClients = 0;
					
					// Iterate the children
					for (let i = 0; i < tokenStruct.numberOfChildren; i++) {
						
						var parentHash = web3.utils.soliditySha3(tokenStruct.collection, keyTokenId, i);
						
						var childHash = await referralContract.methods.child(parentHash).call().then( function(result) {
							
							return result;
								
						}, function(error) {
									
							console.log(error);
							
						});
						
						var childStruct = await referralContract.methods.allNFTs(childHash).call().then( function(result) {
						
							return result;
								
						}, function(error) {
									
							console.log(error);
							
						});
						
						if (childStruct.collection = global.env.keyContract) {
							
							// Is key contract child
							personalPartners++;
							
						}
						else {
							
							// Is any other contract
							personalClients++;
							
						}
						
					}
					
					document.getElementById("personal_partners").textContent = personalPartners;
					document.getElementById("personal_clients").textContent = personalClients;
					
					
					
					// TEAM STATS
					
					
					
					
				}
				
			}
			
			// Countup types of NFTs
			for (var num in global.config.real_estate_nfts) {
				
				if (global.config.real_estate_nfts[num].key == key) {
					real_estate_nfts += parseInt(contractBalance);
				}
				
			}
			/*
			// None for now
			
			for (var num in global.config.term_deposit_nfts) {
				
				if (global.config.real_estate_nfts[num].key == key) {
					real_estate_nfts++;
				}
				
			}
			*/
			for (var num in global.config.other_nfts) {
				
				if (global.config.other_nfts[num].key == key) {
					other_nfts += parseInt(contractBalance);
				}
				
			}
			
		}
		
		document.getElementById("my_nfts_count").textContent = my_nfts_count;
		document.getElementById("my_nfts_real_estate").textContent = real_estate_nfts;
		document.getElementById("my_nfts_term_deposit").textContent = term_deposit_nfts;
		document.getElementById("my_nfts_other_nfts").textContent = other_nfts;
		
		// console.log(global.config.levels);
		
		
		
		
		
		
		// User level
		
		var userLevel = await referralContract.methods.getUserLevel(userAddress).call().then( function(result) {
			
			return result;
				
		}, function(error) {
					
			console.log(error);
			
		});
		
		if (userLevel == 0) {
			userLevel = 1;
		}
		document.getElementById("user_level").textContent = userLevel;
		
		// User Level Name
		for (var num in global.config.levels) {
			
			if (global.config.levels[num].level == userLevel) {
				document.getElementById("user_level_name").textContent = global.config.levels[num].name;
				break;
			}
			
		}
			
		// User Total Collected Value
		var userTotalCollectedValue = await referralContract.methods.getUserTotalCollectedValue(userAddress).call().then( function(result) {
			
			return result;
			
		}, function(error) {
					
			console.log(error);
			
		});
		document.getElementById("user_total_collected_value").textContent = (userTotalCollectedValue / 10**USDC_decimals) + " $";
		
		
		// Remaining value
		for (var num in global.config.levels) {
			
			if (global.config.levels[num].level == userLevel) {
				
				document.getElementById("remaining_value").textContent = (global.config.levels[parseInt(num)+1].volume - (userTotalCollectedValue / 10**USDC_decimals)) + " $";
				break;
			}
			
		}
		
		
		// My NFT earnings
		var treasuryContract = await global.getContract(web3, "treasuryContract");
		
		var myNFTearnings = await treasuryContract.methods.claimableAmount(userAddress).call().then( function(result) {
			
			return result;
			
		}, function(error) {
					
			console.log(error);
			
		});
		document.getElementById("my_nft_earnings").textContent = (myNFTearnings / 10**USDC_decimals) + " $";
		
		// Team earnings
		var treasuryContract = await global.getContract(web3, "treasuryContract");
		
		var personalVolume = await treasuryContract.methods.personalVolume(userAddress).call().then( function(result) {
			
			return result;
			
		}, function(error) {
					
			console.log(error);
			
		});
		document.getElementById("personal_volume").textContent = (personalVolume / 10**USDC_decimals) + " $";
		document.getElementById("team_earnings").textContent = ((userTotalCollectedValue - personalVolume) / 10**USDC_decimals) + " $";
		
		// Total earnings
		document.getElementById("total_earnings").textContent = ((userTotalCollectedValue - personalVolume + myNFTearnings) / 10**USDC_decimals) + " $";
		
		// Total number of NFTs
		document.getElementById("total_number_of_nfts").textContent = my_nfts_count;
		
		// Number of collections
		document.getElementById("number_of_collections").textContent = number_of_collections;
		
		// Combined APR
		var average_apr = (number_of_collections * total_apr) / 100;
		document.getElementById("combined_apr").textContent = average_apr + "%";
		
		
		
		// Calculations
		if (my_nfts_count > 0) {
			var yearly_payouts = (my_nfts_count * total_price / number_of_collections) / 100 * (average_apr / 100);
			var monthly_payouts = yearly_payouts / 12;
		}
		else {
			var yearly_payouts = 0;
			var monthly_payouts = 0;
		}
		
		// Est. monthly earnings
		document.getElementById("est_monthly_earnings").textContent = monthly_payouts / 10**USDC_decimals;
		
		// Est. yearly earnings
		document.getElementById("est_yearly_earnings").textContent = yearly_payouts / 10**USDC_decimals;
		
		
		// Total Rewards
		var totalRewards = await treasuryContract.methods.claimableAmount(userAddress).call().then( function(result) {
			
			return result;
			
		}, function(error) {
					
			console.log(error);
			
		});
		document.getElementById("total_rewards").textContent = totalRewards / 10**USDC_decimals + " $";
		
		


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

web3Modal = global.init();


function hideStatus() {
  document.getElementById("status").style.display = "none";
}

document.getElementById('btn-connect').addEventListener('click', onConnect);
document.getElementById('close_popup').addEventListener('click', hideStatus);
