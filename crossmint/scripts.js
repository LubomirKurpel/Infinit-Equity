
/* TESTNET */
const contract_address = "0x3D6C83aFc3ca4D9dcbC9e67F314235a0b8Df0058";

const INFURAID = "b58f33c84bf047ec85e3e8e2f77af3a9";

const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
let web3, web3Modal, userAddress;
let CONTRACT_ABI;

function init() {

	console.log("Initializing...");
	console.log("WalletConnectProvider is", WalletConnectProvider);

	// Check that the web page is run in https (MetaMask won't be available)
	if (location.protocol !== 'https:') {
		document.querySelector("#btn-connect").setAttribute("disabled", "disabled")
		return;
	}

	const providerOptions = {
		walletconnect: {
			package: WalletConnectProvider,
			options: {
				infuraId: INFURAID,
			}
		},
	};

	web3Modal = new Web3Modal({
		cacheProvider: false,
		providerOptions,
		disableInjectedProvider: false,
	});

}


async function onConnect() {
	
	CONTRACT_ABI = await (await fetch("./json/coFounderKeyABI.json")).json();

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

	// 80001 for Polygon Mumbai
	if (chainId == "80001") {
		
		console.log('connected');
		
		document.getElementById("initial").style.display = "none";
		document.getElementById("mint").style.display = "block";
		
		// Get web3 provider
		var web3 = new Web3(window.ethereum);
	
		const contract = new web3.eth.Contract(CONTRACT_ABI, contract_address);
		
		var checkUserStatus = await contract.methods.checkUserStatus(userAddress).call().then( function(result) {
			
			return result;
				
		}, function(error) {
					
			console.log(error);
			
		});
		
		
		
		if (checkUserStatus == 1) {
			
			// error
			var mint_status = document.getElementById("mint_status");
			
			mint_status.classList.remove("error");
			mint_status.classList.remove("success");
			
			mint_status.style.display = "block";
			
			mint_status.classList.add("error");
			mint_status.innerHTML = "You have already minted!";
			document.getElementById("btn-mint").classList.add("btn-disabled");
			
		}
		
		var checkUserWhitelistStatus = await contract.methods.checkUserWhitelistStatus(userAddress).call().then( function(result) {
			
			return result;
				
		}, function(error) {
					
			console.log(error);
			
		});
		
		console.log(checkUserWhitelistStatus);
		
		if (checkUserWhitelistStatus == 0) {
			
			// error
			var mint_status = document.getElementById("mint_status");
			
			mint_status.classList.remove("error");
			mint_status.classList.remove("success");
			
			mint_status.style.display = "block";
			
			mint_status.classList.add("error");
			mint_status.innerHTML = "You are not on whitelist!";
			document.getElementById("btn-mint").classList.add("btn-disabled");
			
		}


	} else {
		
		// error
		var mint_status = document.getElementById("mint_status");
		
		mint_status.classList.remove("error");
		mint_status.classList.remove("success");
		
		mint_status.style.display = "block";
		mint_status.classList.add("error");
		
		mint_status.innerHTML = "Please change network to Polygon Mumbai Testnet!";
		
	}


}

async function onMint() {
	
	var web3 = new Web3(window.ethereum);
		
	const contract = new web3.eth.Contract(CONTRACT_ABI, contract_address);

	const accounts = await web3.eth.getAccounts();

	userAddress = accounts[0];
		
	// send
	await contract.methods.mintKey().send({
		from: userAddress
	}).on('receipt', function() {
		
		// success
		var mint_status = document.getElementById("mint_status");
		
		mint_status.classList.remove("error");
		mint_status.classList.remove("success");
		
		mint_status.style.display = "block";
		
		mint_status.classList.add("success");
		mint_status.innerHTML = "Transaction sent! Congratulations";
		document.getElementById("btn-mint").classList.add("btn-disabled");

	});
	
}

init();

function hideStatus() {
  document.getElementById("mint_status").style.display = "none";
}

document.getElementById('btn-connect').addEventListener('click', onConnect);
document.getElementById('btn-mint').addEventListener('click', onMint);
document.getElementById('close_popup').addEventListener('click', hideStatus);
