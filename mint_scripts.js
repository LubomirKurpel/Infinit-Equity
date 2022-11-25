
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
		
		// Hide button, show stats
		document.getElementById("initial").style.display = "none";
		
		
		// Check if user has enough USDC in their wallet
		// var USDC_address = global.env.USDC_Contract;
		
		// Get USDC balance
		var USDC_Contract = await global.getContract(web3, "USDC_Contract");
		
		var contractBalance = await USDC_Contract.methods.balanceOf(userAddress).call().then( function(result) {
			
			return result;
				
		}, function(error) {
					
			console.log(error);
			
		});
		
		console.log("User Balance: " + contractBalance);
		
		// Get price of minted NFT
		
		var keyContract = await global.getContract(web3, "keyContract");
		
		var keyPrice = await keyContract.methods.price().call().then( function(result) {
			
			return result;
				
		}, function(error) {
					
			console.log(error);
			
		});
		
		console.log("keyPrice: " + keyPrice);
		
		
		if (parseInt(contractBalance) >= parseInt(keyPrice)) { // Ak ma na penazenke viac ako je cena NFT, dovolime mint
		
			// Checkneme, ci ma dostatocny allowance aby sme mu mohli vziat USDC z penazenky
			var USDC_Allowance = await USDC_Contract.methods.allowance(userAddress, global.env.referralContract).call().then( function(result) {
				
				return result;
					
			}, function(error) {
						
				console.log(error);
				
			});
			
			if (USDC_Allowance >= keyPrice) { // Ak je allowance vacsi ako cena NFT, povolime mint
				
				document.getElementById("mint").style.display = "block";
				
			}
			else { // Nie je vacsi allowance, zobrazime Approve button
				
				document.getElementById("approve").style.display = "block";
			
			}
			
		}
		else { // Nema dost USDC v penazenke, zobrazime error
			
			// Zobrazime chybu
			var status = document.getElementById("status");
			
			status.classList.remove("error");
			status.classList.remove("success");
			
			status.style.display = "block";
			status.classList.add("error");
			
			status.innerHTML = "You do not have enough funds in your wallet!<br><br>";
			
			status.innerHTML += "Mint free USDC at https://mumbai.polygonscan.com/address/" + global.env.USDC_Contract + " , use function mintTokens() at Write tab"; // Toto v produkcii samozrejme nebude
			
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

async function onApprove() {
	
	var gasPrice = await web3.eth.getGasPrice(function(e, r) { console.log(r); return r; });

	// Approve ide na Referral kontrakt vzdy!
	var USDC_Contract = await global.getContract(web3, "USDC_Contract");
		
	// Approve
	await USDC_Contract.methods.approve(global.env.referralContract, 100*1000*1000*10**USDC_decimals).send({ // 100 mil. bude dostatok navzdy
		from: userAddress,
		gasPrice: gasPrice
	}).on('confirmation', function() {
		
		// Po approve zobrazime mint button
		document.getElementById("approve").style.display = "none";
		document.getElementById("mint").style.display = "block";

	});
	
}

async function onMint() {
	
	var gasPrice = await web3.eth.getGasPrice(function(e, r) { console.log(r); return r; });
	
	gasPrice = web3.utils.toBN(gasPrice).mul(web3.utils.toBN(2)).toString();
	
	var keyContract = await global.getContract(web3, "keyContract");
	
	// send
	
	// Do funkcie "mintKey" ide referral!! Prázdny string prejde tiež, referral prejde len ak existuje!
	await keyContract.methods.mintKey("").send({
		from: userAddress,
		gasPrice: gasPrice
	}).on('confirmation', function() {

		// success
		document.getElementById("status").style.display = "block";
		var status = document.getElementById("status");
		
		status.innerHTML = "Successfully minted! Congratulations!";

	});
	
}

web3Modal = global.init();


function hideStatus() {
  document.getElementById("status").style.display = "none";
}

document.getElementById('btn-connect').addEventListener('click', onConnect);
document.getElementById('btn-approve').addEventListener('click', onApprove);
document.getElementById('btn-mint').addEventListener('click', onMint);
document.getElementById('close_popup').addEventListener('click', hideStatus);
