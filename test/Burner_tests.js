const { expect } = require("chai");
const { ethers } = require("hardhat");
const {utils, BigNumber} = require('ethers');

describe("Burner Tests", function () {
	
  let owner,infinityTeamPerson,whitelistPerson,randomPerson;
  let ALLOWED_ROLE;
  let CONTRACT_ROLE;
  
  // USDC Contract
  let USDC_ContractFactory;
  let USDC_Contract;
  let USDC_Decimals = 6;
  
  // Referral Contract
  let referralContractFactory;
  let referralContract;
  
  // Co-Founder Contract
  let coFounderContractFactory;
  let coFounderContract;
  
  // Key Contract
  let keyContractFactory;
  let keyContract;
  
  // Real Estate Contract
  let realEstateContractFactory;
  let realEstateContract;
  
  // Term Deposit Contract
  let termDepositContractFactory;
  let termDepositContract;
  
  // Treasury Contract
  let treasuryContractFactory;
  let treasuryContract;
  
  // Treasury - Claimable Contract
  let treasuryClaimableContractFactory;
  let treasuryClaimableContract;
  
  // Burner Contract
  let burnerContractFactory;
  let burnerContract;
  
  var randomSigners = [];
  
  beforeEach(async function () {
    
	// [owner,infinityTeamPerson,randomPerson,randomPerson_2,randomPerson_3,randomPerson_4] = await hre.ethers.getSigners();
	[owner,infinityTeamPerson,infinityTeamPerson_2,randomPerson,randomPerson_2,randomPerson_3,randomPerson_4] = await hre.ethers.getSigners();
	
	// 1. Deploy USDC
    USDC_ContractFactory = await hre.ethers.getContractFactory("USDC");
    USDC_Contract = await USDC_ContractFactory.deploy();
    await USDC_Contract.deployed();
    console.log("USDC ERC-20 contract deployed to:", USDC_Contract.address);
	
	/*
	
	For LIVE MATIC test
	
	USDC_ContractFactory = await hre.ethers.getContractFactory("USDC");
    USDC_Contract = await USDC_ContractFactory.attach(
	  "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" // USDC LIVE ADDRESS
	);
    // await USDC_Contract.deployed();
    console.log("USDC ERC-20 contract fetched at:", USDC_Contract.address);
	*/
	
	// 2. Deploy Treasury Contract
	treasuryContractFactory = await hre.ethers.getContractFactory("InfinityNFT_Treasury");
    treasuryContract = await treasuryContractFactory.deploy(USDC_Contract.address);
    await treasuryContract.deployed();
    console.log("Treasury Contract deployed to:", treasuryContract.address);
	
	
	// 3. Deploy Referral Contract
	referralContractFactory = await hre.ethers.getContractFactory("InfinityNFT_Referrals");
    referralContract = await referralContractFactory.deploy(USDC_Contract.address, treasuryContract.address);
    await referralContract.deployed();
    console.log("Referral Contract deployed to:", referralContract.address);
	

	// 4. Deploy Infinity Key
    keyContractFactory = await hre.ethers.getContractFactory("InfinitEquity_Key");
    keyContract = await keyContractFactory.deploy(referralContract.address);
    await keyContract.deployed();
    console.log("Key contract deployed to:", keyContract.address);


	// 5. Deploy Co-Founder NFT
    coFounderContractFactory = await hre.ethers.getContractFactory("InfinitEquity_CoFounder");
    coFounderContract = await coFounderContractFactory.deploy(referralContract.address);
    await coFounderContract.deployed();
    console.log("Co-Founder Contract deployed to:", coFounderContract.address);
	

	// 5b. Deploy Real Estates NFT
    realEstateContractFactory = await hre.ethers.getContractFactory("InfinitEquity_RealEstates");
    realEstateContract = await realEstateContractFactory.deploy(referralContract.address);
    await realEstateContract.deployed();
    console.log("Real Estate Contract deployed to:", realEstateContract.address);

	// 5c. Term Deposit NFT
    termDepositContractFactory = await hre.ethers.getContractFactory("InfinitEquity_TermDeposit");
    termDepositContract = await termDepositContractFactory.deploy(referralContract.address);
    await termDepositContract.deployed();
    console.log("Term Deposit Contract deployed to:", termDepositContract.address);
	
	// NEED FOR BURNER TO WORK
	// 5d. Burner contract
    burnerContractFactory = await hre.ethers.getContractFactory("InfinityNFT_Burner");
    burnerContract = await burnerContractFactory.deploy(referralContract.address);
    await burnerContract.deployed();
    console.log("Burner Contract deployed to:", burnerContract.address);
	
	
	// 6. Add Infinity Key to Allowed Contracts on Referral Contract
	CONTRACT_ROLE = hre.ethers.utils.id("CONTRACT_ROLE");
	
	let contractCall = await referralContract.connect(owner).grantRole(CONTRACT_ROLE,keyContract.address);
	await contractCall.wait();
	
	
	// 7. Add Co-Founder Contract to Referral Contract
	contractCall = await referralContract.connect(owner).grantRole(CONTRACT_ROLE, coFounderContract.address);
	await contractCall.wait();
	
	// 7b. Add Real Estates Contract to Referral Contract
	contractCall = await referralContract.connect(owner).grantRole(CONTRACT_ROLE, realEstateContract.address);
	await contractCall.wait();
	
	// 7c. Add Term deposit Contract to Referral Contract
	contractCall = await referralContract.connect(owner).grantRole(CONTRACT_ROLE, termDepositContract.address);
	await contractCall.wait();
	
	
	// 8. Set Co-Founder Contract to level 3 boost
	contractCall = await referralContract.connect(owner).setLevelBoostContract(coFounderContract.address, 3);
	await contractCall.wait();
	
	
	// 9. Add Infinity Key Contract to Referral Contract with special function
	contractCall = await referralContract.connect(owner).setInfinityKeyAddress(keyContract.address);
	await contractCall.wait();
	
	
	// 10. Add Referral Contract to Allowed Contracts on Treasury Contract
	contractCall = await treasuryContract.connect(owner).grantRole(CONTRACT_ROLE,referralContract.address);
	await contractCall.wait();
	
	// 10a. Add Burner Contract to Allowed Contracts on Key Contract
	contractCall = await keyContract.connect(owner).grantRole(CONTRACT_ROLE,burnerContract.address);
	await contractCall.wait();
	
	
	// 11. Get USDC for people
	await USDC_Contract.connect(randomPerson).mintTokens("25000");
	var randomPerson_balanceOf = await USDC_Contract.balanceOf(randomPerson.address);
	console.log("randomPerson " + randomPerson.address  + " USDC balance: " + randomPerson_balanceOf);
	
	await USDC_Contract.connect(randomPerson_2).mintTokens("25000");
	var randomPerson_2_balanceOf = await USDC_Contract.balanceOf(randomPerson_2.address);
	console.log("randomPerson_2 " + randomPerson_2.address  + " USDC balance: " + randomPerson_2_balanceOf);
	
	await USDC_Contract.connect(randomPerson_3).mintTokens("25000");
	var randomPerson_3_balanceOf = await USDC_Contract.balanceOf(randomPerson_3.address);
	console.log("randomPerson_3 " + randomPerson_3.address  + " USDC balance: " + randomPerson_3_balanceOf);
	
	await USDC_Contract.connect(randomPerson_4).mintTokens("25000");
	var randomPerson_4_balanceOf = await USDC_Contract.balanceOf(randomPerson_4.address);
	console.log("randomPerson_4 " + randomPerson_4.address  + " USDC balance: " + randomPerson_4_balanceOf);
	console.log("----------------");
	
	
	
  });
	
	
  // Tests
  
  it("Should mint 1x Key and burn, returning funds to user", async function () {
	  
	// Approve USDC
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 25*10**USDC_Decimals);

	let contractCall = await keyContract.connect(randomPerson).mintKey("");
	await contractCall.wait();
	
	// Check Treasury balance
	var treasury_balanceOf = await USDC_Contract.balanceOf(treasuryContract.address);
	console.log("treasuryContract USDC balance: " + treasury_balanceOf);
	
	// Check User balance
	var user_balanceOf = await USDC_Contract.balanceOf(randomPerson.address);
	console.log("randomPerson USDC balance: " + user_balanceOf);
	
	// Send some USDC to Burner Contract
	await USDC_Contract.connect(randomPerson).transfer(burnerContract.address, 25*10**USDC_Decimals); // 1 is the tokenID
	
	// Check Burner Contract balance
	var burnerContract_balanceOf = await USDC_Contract.balanceOf(burnerContract.address);
	console.log("burnerContract USDC balance: " + burnerContract_balanceOf);
	
	// Burn key balance before burn
	var keyBalanceBefore = await keyContract.connect(randomPerson).balanceOf(randomPerson.address);
	console.log("randomPerson key balance: " + keyBalanceBefore);
	
	// Burn the key
	await burnerContract.connect(randomPerson).burnNFT(keyContract.address, 1); // 1 is the tokenID
	
	// Burn key balance before after
	var keyBalanceAfter = await keyContract.connect(randomPerson).balanceOf(randomPerson.address);
	console.log("randomPerson key balance after burn: " + keyBalanceAfter);
	
	// Check Burner Contract balance after burn
	var burnerContractBalanceOfAfter = await USDC_Contract.balanceOf(burnerContract.address);
	console.log("burnerContract USDC balance after burn: " + burnerContractBalanceOfAfter);
	
	// Check User balance after burn
	var userBalanceOfAfter = await USDC_Contract.balanceOf(randomPerson.address);
	console.log("randomPerson USDC balance after burn: " + userBalanceOfAfter);

  });
  
});
