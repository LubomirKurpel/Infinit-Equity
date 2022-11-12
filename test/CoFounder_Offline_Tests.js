const { expect } = require("chai");
const { ethers } = require("hardhat");
const {utils, BigNumber} = require('ethers');

describe("Infinity Co-Founder Offline Tests", function () {
	
  let owner,infinityTeamPerson,whitelistPerson,randomPerson;
  let ALLOWED_ROLE;
  
  // Inifnity NFT key
  let infinityCoFounderContractFactory;
  let infinityCoFounderContract;
  
  let USDC_ContractFactory;
  let USDC_Contract;
  let USDC_Decimals = 6;
  
  beforeEach(async function () {
    
	[owner,infinityTeamPerson,whitelistPerson,randomPerson] = await hre.ethers.getSigners();
	
	// Deploy USDC
	/*
    USDC_ContractFactory = await hre.ethers.getContractFactory("USDC");
    USDC_Contract = await USDC_ContractFactory.deploy();
    await USDC_Contract.deployed();
    console.log("USDC ERC-20 contract deployed to:", USDC_Contract.address);
	*/
	
	
	/*
	USDC_ContractFactory = await hre.ethers.getContractFactory("USDC");
    USDC_Contract = await USDC_ContractFactory.attach(
	  "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" // USDC LIVE ADDRESS
	);
    // await USDC_Contract.deployed();
    console.log("USDC ERC-20 contract fetched at:", USDC_Contract.address);
	*/
	

	// Deploy Infinity Key
	/*
    infinityCoFounderContractFactory = await hre.ethers.getContractFactory("InfinityNFT_Key_Premint");
    infinityCoFounderContract = await infinityCoFounderContractFactory.deploy(USDC_Contract.address);
    await infinityCoFounderContract.deployed();
    console.log("Infinity NFT Key contract deployed to:", infinityCoFounderContract.address);
	*/
	
    infinityCoFounderContractFactory = await hre.ethers.getContractFactory("InfinitEquity_CoFounder");
    infinityCoFounderContract = await infinityCoFounderContractFactory.deploy('0x0000000000000000000000000000000000000000');
    await infinityCoFounderContract.deployed();
    console.log("Infinity Co Founder NFT Contract deployed to:", infinityCoFounderContract.address);
	
	
  });
	
	
  // Tests
  
  it("Should test adding address to Whitelist as randomPerson and fail", async function () {

	await expect(infinityCoFounderContract.connect(randomPerson).addTeamMemberAsAdmin(infinityTeamPerson.address))
          .to.be.reverted;
	
  });
  
  it("Should add infinityTeamPerson as admin and pass", async function () {

	// Contract Role set up
	ALLOWED_ROLE = hre.ethers.utils.id("ALLOWED_ROLE");
	
	// Allow Infinity Team Address to add members to whitelist
	let contractCall = await infinityCoFounderContract.connect(owner).grantRole(ALLOWED_ROLE,infinityTeamPerson.address);
	await contractCall.wait();
	
  });
  
  it("Should add infinityTeamPerson as admin and infinityTeamPerson tries to add people to WL", async function () {

	// Contract Role set up
	ALLOWED_ROLE = hre.ethers.utils.id("ALLOWED_ROLE");
	
	// Allow Infinity Team Address to add members to whitelist
	let contractCall = await infinityCoFounderContract.connect(owner).grantRole(ALLOWED_ROLE,infinityTeamPerson.address);
	await contractCall.wait();
	
	contractCall = await infinityCoFounderContract.connect(infinityTeamPerson).addWhitelistAdresses([whitelistPerson.address, randomPerson.address])
	await contractCall.wait();
	
	
  });
  
  it("Should mint 1x Key as whitelisted person for free", async function () {
	  
	// Add RandomPerson to whitelist by owner
	await infinityCoFounderContract.connect(owner).addWhitelistAdresses([randomPerson.address])
	
	// Get 25 USDC from USDC contract by randomPerson
	/*
	await USDC_Contract.connect(randomPerson).mintTokens("25");
	await USDC_Contract.connect(randomPerson).approve(infinityCoFounderContract.address, 25*10**USDC_Decimals);
	*/
	
	/*
	let balanceOf = await USDC_Contract.balanceOf(randomPerson.address);
    console.log("balance of: " + randomPerson.address + " is " + balanceOf);
	*/
	
	// Mint using the tokens
	contractCall = await infinityCoFounderContract.connect(randomPerson).mintKey("");
	await contractCall.wait();
	
	/*
	balanceOf = await USDC_Contract.balanceOf(randomPerson.address);
    console.log("balance of USDC after mint: " + randomPerson.address + " is " + balanceOf);
	*/
	
	balanceOf = await infinityCoFounderContract.balanceOf(randomPerson.address);
    console.log("balance of Co-Founder NFTs after mint: " + randomPerson.address + " is " + balanceOf);
	
  });
  
  it("Should try to tranfer locked NFT and fail", async function () {
	  
	// minted 0 in constructor
	await expect(infinityCoFounderContract.connect(owner).transferFrom(owner.address, randomPerson.address, 1))
          .to.be.revertedWith("Cannot transfer - currently locked");
	
	
  });
  it("Should unlock transfer and try to tranfer NFT and succeed", async function () {
	  
	await infinityCoFounderContract.connect(owner).lockTransfer(false); // Unlock transfers
	
	await infinityCoFounderContract.connect(owner).transferFrom(owner.address, randomPerson.address, 1); // minted 1 in constructor
	
  });
  /*
  it.only("Should mint NFT using live USDC tokens", async function () {
	  
	  // Account with 2,8 mil. USDC - 0x5B20048fe4DBc2c1A824fE16ac4f2eDB36e2460f
	  
		await hre.network.provider.request({
		  method: "hardhat_impersonateAccount",
		  params: ["0x5B20048fe4DBc2c1A824fE16ac4f2eDB36e2460f"],
		});
		
		let impersonatedAccount = await ethers.getSigner("0x5B20048fe4DBc2c1A824fE16ac4f2eDB36e2460f");
		
		// Add RandomPerson to whitelist by owner
		await infinityCoFounderContract.connect(owner).addWhitelistAdresses([impersonatedAccount.address]);
		
		// Get 25 USDC from USDC contract by randomPerson
		await USDC_Contract.connect(impersonatedAccount).approve(infinityCoFounderContract.address, 25*10**USDC_Decimals);
		
		let balanceOf = await USDC_Contract.balanceOf(impersonatedAccount.address);
		console.log("balance of: " + impersonatedAccount.address + " is " + balanceOf);
		
		// Mint using the tokens
		contractCall = await infinityCoFounderContract.connect(impersonatedAccount).mintKey();
		await contractCall.wait();
		
		balanceOf = await USDC_Contract.balanceOf(impersonatedAccount.address);
		console.log("balance of USDC after mint: " + impersonatedAccount.address + " is " + balanceOf);
		
		balanceOf = await infinityCoFounderContract.balanceOf(impersonatedAccount.address);
		console.log("balance of NFT Keys after mint: " + impersonatedAccount.address + " is " + balanceOf);
		
  });
  */
  
	
	
});
