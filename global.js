/* MUMBAI TESTNET */
export const chainID = 137; // 5 for goerli testnet, 80001 for mumbai testnet, 137 for polygon mainnet


// Load env.json
export let env;

export async function loadEnv() {
	env = await (await fetch("./json/env.json")).json();
	console.log(env);
}
loadEnv();


// Load config file
export let config;

export async function loadConfig() {
	config = await (await fetch("./json/config.json")).json();
	console.log(config);
}
loadConfig();


// Helper function
export async function getContract(web3, name) {
	
	let CONTRACT_ABI = await (await fetch("./json/" + name + ".json")).json();
	let contract = new web3.eth.Contract(CONTRACT_ABI, env[name]);
	
	return contract;
	
}



// Web3Modal function
const INFURAID = "a1f9d20f43be46fa9a70cf8adee30ef4";
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
let web3, web3Modal;

export function init() {

	console.log("Initializing...");
	console.log("WalletConnectProvider is", WalletConnectProvider);

	// Check that the web page is run in https (MetaMask won't be available)
	if (location.protocol !== 'https:') {
		document.querySelector("#btn-connect").setAttribute("disabled", "disabled");
		alert("Not using HTTPS secured connection");
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
	
	return web3Modal;

}
