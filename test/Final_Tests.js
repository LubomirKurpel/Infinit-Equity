const { expect } = require("chai");
const { ethers } = require("hardhat");
const {utils, BigNumber} = require('ethers');

describe("Key NFT Offline Tests", function () {
	
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
  
  it("Should mint 1x Key without referral", async function () {
	  
	// Approve USDC
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 25*10**USDC_Decimals);

	let contractCall = await keyContract.connect(randomPerson).mintKey("");
	await contractCall.wait();
	
	// Check Treasury balance
	var treasury_balanceOf = await USDC_Contract.balanceOf(treasuryContract.address);
	console.log("treasuryContract USDC balance: " + treasury_balanceOf);
	
  });
  
  it("Should mint 1x Key with referral and fail because referral does not exists", async function () {
	  
	// Approve USDC
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 25*10**USDC_Decimals);

	await expect(keyContract.connect(randomPerson).mintKey("test")).to.be.reverted;
	
  });
  
  it("Should mint 1x Key WITHOUT referral and second person mint 1x key WITH newly created referral", async function () {
	  
	// Approve USDC for randomPerson
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 25*10**USDC_Decimals);

	await keyContract.connect(randomPerson).mintKey("");
	
	// Set referral
	await keyContract.connect(randomPerson).setReferral("test_Referral");
	
	// Approve USDC for randomPerson_2
	await USDC_Contract.connect(randomPerson_2).approve(referralContract.address, 25*10**USDC_Decimals);
	
	console.log("asdad");

	await keyContract.connect(randomPerson_2).mintKey("test_Referral");
	
  });
  
  it("Should mint 1x Co-Founder NFT and 1x Key WITHOUT referral and second person mint 2x key WITH newly created referral", async function () {
	  
	// Mint Co-Founder NFT
	// Add RandomPerson to whitelist by owner
	await coFounderContract.connect(owner).addWhitelistAdresses([randomPerson.address]);
	await coFounderContract.connect(randomPerson).mintKey("");
	 
	// Approve USDC for randomPerson
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 25*10**USDC_Decimals);
	await keyContract.connect(randomPerson).mintKey("");
	
	// Set referral
	await keyContract.connect(randomPerson).setReferral("test_Referral");
	
	// Approve USDC for randomPerson_2
	await USDC_Contract.connect(randomPerson_2).approve(referralContract.address, 25*10**USDC_Decimals);

	await keyContract.connect(randomPerson_2).mintKey("test_Referral");
	
	// Approve USDC for randomPerson_3
	await USDC_Contract.connect(randomPerson_3).approve(referralContract.address, 25*10**USDC_Decimals);

	await keyContract.connect(randomPerson_3).mintKey("test_Referral");
	await keyContract.connect(randomPerson_3).setReferral("test_Referral_2");
	
	// Approve USDC for randomPerson_4
	await USDC_Contract.connect(randomPerson_4).approve(referralContract.address, 25*10**USDC_Decimals);

	await keyContract.connect(randomPerson_4).mintKey("test_Referral_2");
	
	
	// Approve USDC for randomPerson_4
	await USDC_Contract.connect(randomPerson_4).approve(referralContract.address, 1000*10**USDC_Decimals);

	await realEstateContract.connect(randomPerson_4).mintKey(1, "test_Referral_2");
	
	
	// Get User Level of first minter
	console.log("LAST");
	await referralContract.connect(owner).getUserLevel(randomPerson.address);
	
	
  });
  
  it("Should test chain behaviour of minting of Keys by multiple people", async function () {
	  
	
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 25*10**USDC_Decimals); // Approve USDC for randomPerson
	await keyContract.connect(randomPerson).mintKey(""); // Mint without referral
	await keyContract.connect(randomPerson).setReferral("test_Referral"); // Set referral for randomPerson
	
	console.log("Minter start randomPerson_2");
	await USDC_Contract.connect(randomPerson_2).approve(referralContract.address, 25*10**USDC_Decimals); // Approve USDC for randomPerson_2
	await keyContract.connect(randomPerson_2).mintKey("test_Referral"); // Mint with first referral
	await keyContract.connect(randomPerson_2).setReferral("test_Referral_2"); // Set new referral
	
	console.log("Minter start randomPerson_3");
	await USDC_Contract.connect(randomPerson_3).approve(referralContract.address, 25*10**USDC_Decimals); // Approve USDC for randomPerson_3
	await keyContract.connect(randomPerson_3).mintKey("test_Referral_2"); // Mint with second referral
	await keyContract.connect(randomPerson_3).setReferral("test_Referral_3"); // Set new referral
	
	console.log("END");
	
	var maxClaimableForRandomPerson = await treasuryContract.connect(randomPerson).claimableAmount(randomPerson.address);
	console.log("maxClaimableForRandomPerson: " + maxClaimableForRandomPerson);
	
	var maxClaimableForRandomPerson = await treasuryContract.connect(randomPerson_2).claimableAmount(randomPerson_2.address);
	console.log("maxClaimableForRandomPerson_2: " + maxClaimableForRandomPerson);
	
	var maxClaimableForRandomPerson = await treasuryContract.connect(randomPerson_3).claimableAmount(randomPerson_3.address);
	console.log("maxClaimableForRandomPerson_3: " + maxClaimableForRandomPerson);
	
  });
  
  it("Should test many members in parallel", async function () {
	  
	// DISABLE
	return;
	
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 25*10**USDC_Decimals); // Approve USDC for randomPerson
	await keyContract.connect(randomPerson).mintKey(""); // Mint without referral
	await keyContract.connect(randomPerson).setReferral("test_Referral"); // Set referral for randomPerson
	
	
	// Generate a bunch of randomSigners for testing Gas related functions
	for (let i = 0; i < 50; i++) {
		
		// Get a new wallet
		var wallet = ethers.Wallet.createRandom();
		// add the provider from Hardhat
		wallet =  wallet.connect(ethers.provider);
		
		// fund the newly created wallet
		await owner.sendTransaction({to: wallet.address, value: ethers.utils.parseEther("1")});
		
		// get USDC
		await USDC_Contract.connect(wallet).mintTokens("25000");
		await USDC_Contract.connect(wallet).approve(referralContract.address, 25*10**USDC_Decimals); // Approve USDC
		var mintKeyTx = await keyContract.connect(wallet).mintKey("test_Referral"); // Mint with first referral
		// await keyContract.connect(wallet).setReferral("test_Referral_2"); // Set new referral
		
		const receipt = await mintKeyTx.wait();
		const gasUsed = BigInt(receipt.cumulativeGasUsed) * BigInt(receipt.effectiveGasPrice);
		
		console.log("gasUsed: " + gasUsed);
		
	}
	
  });
  
  it("Should test members in a long chain and calculate gas (approx)", async function () {
	  
	 // DISABLE
	  return;
	  
	
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 25*10**USDC_Decimals); // Approve USDC for randomPerson
	await keyContract.connect(randomPerson).mintKey(""); // Mint without referral
	await keyContract.connect(randomPerson).setReferral("test_Referral_0"); // Set referral for randomPerson
	
	
	// Generate a bunch of randomSigners for testing Gas related functions
	for (let i = 0; i < 50; i++) {
		
		// Get a new wallet
		var wallet = ethers.Wallet.createRandom();
		// add the provider from Hardhat
		wallet =  wallet.connect(ethers.provider);
		
		// fund the newly created wallet
		await owner.sendTransaction({to: wallet.address, value: ethers.utils.parseEther("1")});
		
		// get USDC
		await USDC_Contract.connect(wallet).mintTokens("25000");
		await USDC_Contract.connect(wallet).approve(referralContract.address, 25*10**USDC_Decimals); // Approve USDC
		var mintKeyTx = await keyContract.connect(wallet).mintKey("test_Referral_" + i); // Mint with first referral
		await keyContract.connect(wallet).setReferral("test_Referral_" + (i + 1)); // Set new referral
		
		const receipt = await mintKeyTx.wait();
		const gasUsed = BigInt(receipt.cumulativeGasUsed) * BigInt(receipt.effectiveGasPrice);
		
		console.log("gasUsed: " + gasUsed);
		
	}
	
  });
  
  
  
    
  it("Should test direct leveling system", async function () {
	  
	// Add level 5 to randomPerson
	await referralContract.connect(owner).setUserLevelBoost(randomPerson.address, 5); // Level 5 gets 10,5%
	  
	// Approve USDC for randomPerson
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 25*10**USDC_Decimals);
	await keyContract.connect(randomPerson).mintKey("");
	
	// Set referral
	await keyContract.connect(randomPerson).setReferral("test_Referral");
	
	// Approve USDC for randomPerson_2
	await USDC_Contract.connect(randomPerson_2).approve(referralContract.address, 25*10**USDC_Decimals);

	await keyContract.connect(randomPerson_2).mintKey("test_Referral");
	
	// Check claimableAmount for randomPerson
	var claimableAmount = await treasuryContract.connect(randomPerson).claimableAmount(randomPerson.address);
	console.log("claimableAmount for randomPerson is: " + claimableAmount / 1000000); // Should get 10,5% from 25 USDC, meaning 2.625 USDC
	
	
  });
  
    
  it("Should test parent leveling system Example 1", async function () {
	  
	// Add level 5 to randomPerson
	await referralContract.connect(owner).setUserLevelBoost(randomPerson.address, 3); // Level 3 gets 7,5%
	// await referralContract.connect(owner).setUserLevelBoost(randomPerson_2.address, 5); // Level 1 gets 4,5%
	// await referralContract.connect(owner).setUserLevelBoost(randomPerson_3.address, 2); // Level 2 gets .. does not matter
	  
	// Approve USDC for randomPerson
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 25*10**USDC_Decimals);
	await keyContract.connect(randomPerson).mintKey("");
	
	// Set referral
	await keyContract.connect(randomPerson).setReferral("test_Referral");
	
	// Approve USDC for randomPerson_2
	await USDC_Contract.connect(randomPerson_2).approve(referralContract.address, 1000*10**USDC_Decimals);

	await realEstateContract.connect(randomPerson_2).mintKey(1, "test_Referral"); // Should give 7.5% (1000 / 100 * 7.5) = 75 USDC to randomPerson
	await realEstateContract.connect(randomPerson_2).setReferral("test_Referral_2");
	
	
	// Approve USDC for randomPerson_3
	await USDC_Contract.connect(randomPerson_3).approve(referralContract.address, 25*10**USDC_Decimals);

	await keyContract.connect(randomPerson_3).mintKey("test_Referral_2");  // Should give 6% (25 / 100 * 6) = 1.5 USDC to randomPerson_2 AND 1.5% (25 / 100 * 1.5) = 0.375 USDC to randomPerson
	
	console.log("-------- RESULTS -----------");
	
	// Check claimableAmount for randomPerson
	var userLevel = await referralContract.connect(randomPerson).getUserLevel(randomPerson.address);
	console.log("userLevel for randomPerson is: " + userLevel);
	
	var claimableAmount = await treasuryContract.connect(randomPerson).claimableAmount(randomPerson.address);
	console.log("claimableAmount for randomPerson is: " + claimableAmount / 1000000);
	
	var userLevel_2 = await referralContract.connect(randomPerson).getUserLevel(randomPerson_2.address);
	console.log("userLevel for randomPerson_2 is: " + userLevel_2);
	
	var claimableAmount_2 = await treasuryContract.connect(randomPerson).claimableAmount(randomPerson_2.address);
	console.log("claimableAmount for randomPerson_2 is: " + claimableAmount_2 / 1000000);
	
  });
    
  it("Should test parent leveling system Example 2", async function () {
	  
	// Add level 5 to randomPerson
	await referralContract.connect(owner).setUserLevelBoost(randomPerson.address, 3); // Level 3 gets 7,5%
	// await referralContract.connect(owner).setUserLevelBoost(randomPerson_2.address, 5); // Level 1 gets 4,5%
	// await referralContract.connect(owner).setUserLevelBoost(randomPerson_3.address, 2); // Level 2 gets .. does not matter
	  
	// Approve USDC for randomPerson
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 25*10**USDC_Decimals);
	await keyContract.connect(randomPerson).mintKey("");
	
	// Set referral
	await keyContract.connect(randomPerson).setReferral("test_Referral");
	
	// Approve USDC for randomPerson_2
	await USDC_Contract.connect(randomPerson_2).approve(referralContract.address, 25*10**USDC_Decimals);

	await keyContract.connect(randomPerson_2).mintKey("test_Referral"); // Should give 1.875 USDC to randomPerson
	await keyContract.connect(randomPerson_2).setReferral("test_Referral_2");
	
	
	// Approve USDC for randomPerson_3
	await USDC_Contract.connect(randomPerson_3).approve(referralContract.address, 25*10**USDC_Decimals);

	await keyContract.connect(randomPerson_3).mintKey("test_Referral_2");  // Should give 1.125 USDC to randomPerson_2 AND 0.75 USDC to randomPerson
	
	console.log("-------- RESULTS -----------");
	
	// Check claimableAmount for randomPerson
	var userLevel = await referralContract.connect(randomPerson).getUserLevel(randomPerson.address);
	console.log("userLevel for randomPerson is: " + userLevel);
	
	var claimableAmount = await treasuryContract.connect(randomPerson).claimableAmount(randomPerson.address);
	console.log("claimableAmount for randomPerson is: " + claimableAmount / 1000000);
	
	var userLevel_2 = await referralContract.connect(randomPerson).getUserLevel(randomPerson_2.address);
	console.log("userLevel for randomPerson_2 is: " + userLevel_2);
	
	var claimableAmount_2 = await treasuryContract.connect(randomPerson).claimableAmount(randomPerson_2.address);
	console.log("claimableAmount for randomPerson_2 is: " + claimableAmount_2 / 1000000);
	
  });
  
  it("Should test parent leveling system Example 3", async function () {
	  
	// Add level 5 to randomPerson
	await referralContract.connect(owner).setUserLevelBoost(randomPerson.address, 3); // Level 3 gets 7,5%
	  
	// Approve USDC for randomPerson
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 25*10**USDC_Decimals);
	await keyContract.connect(randomPerson).mintKey("");
	
	// Set referral
	await keyContract.connect(randomPerson).setReferral("test_Referral");
	
	// Approve USDC for randomPerson_2
	await USDC_Contract.connect(randomPerson_2).approve(referralContract.address, 25*10**USDC_Decimals);

	await keyContract.connect(randomPerson_2).mintKey("test_Referral"); // Should give 0 USDC to randomPerson = same userLevel gets nothing
	await keyContract.connect(randomPerson_2).setReferral("test_Referral_2");
	
	await referralContract.connect(owner).setUserLevelBoost(randomPerson_2.address, 3); // Level 3 gets 7,5%
	
	// Approve USDC for randomPerson_3
	await USDC_Contract.connect(randomPerson_3).approve(referralContract.address, 1000*10**USDC_Decimals);

	await realEstateContract.connect(randomPerson_3).mintKey(1, "test_Referral_2");  // Should give 75 USDC to randomPerson_2 AND 0 USDC to randomPerson
	
	console.log("-------- RESULTS -----------");
	
	// Check claimableAmount for randomPerson
	var userLevel = await referralContract.connect(randomPerson).getUserLevel(randomPerson.address);
	console.log("userLevel for randomPerson is: " + userLevel);
	
	var claimableAmount = await treasuryContract.connect(randomPerson).claimableAmount(randomPerson.address);
	console.log("claimableAmount for randomPerson is: " + claimableAmount / 1000000);
	
	var userLevel_2 = await referralContract.connect(randomPerson).getUserLevel(randomPerson_2.address);
	console.log("userLevel for randomPerson_2 is: " + userLevel_2);
	
	var claimableAmount_2 = await treasuryContract.connect(randomPerson).claimableAmount(randomPerson_2.address);
	console.log("claimableAmount for randomPerson_2 is: " + claimableAmount_2 / 1000000);
	
  });
  
  it("Should test parent leveling system Example 4", async function () {
	  
	// Add level 5 to randomPerson
	await referralContract.connect(owner).setUserLevelBoost(randomPerson.address, 3); // Level 3 gets 7,5%
	  
	// Approve USDC for randomPerson
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 25*10**USDC_Decimals);
	await keyContract.connect(randomPerson).mintKey("");
	
	// Set referral
	await keyContract.connect(randomPerson).setReferral("test_Referral");
	
	// Approve USDC for randomPerson_2
	await USDC_Contract.connect(randomPerson_2).approve(referralContract.address, 25*10**USDC_Decimals);

	await keyContract.connect(randomPerson_2).mintKey("test_Referral"); // Should give 7.5% (25 / 100 * 7.5) = 1.875 USDC to randomPerson
	await keyContract.connect(randomPerson_2).setReferral("test_Referral_2");
	
	await referralContract.connect(owner).setUserLevelBoost(randomPerson_2.address, 4); // Level 4 gets 9%
	
	// Approve USDC for randomPerson_3
	await USDC_Contract.connect(randomPerson_3).approve(referralContract.address, 25*10**USDC_Decimals);

	await keyContract.connect(randomPerson_3).mintKey("test_Referral_2");  // Should give 9% (25 / 100 * 9) = 2.25 USDC to randomPerson_2 AND 0 USDC to randomPerson
	
	console.log("-------- RESULTS -----------");
	
	// Check claimableAmount for randomPerson
	var userLevel = await referralContract.connect(randomPerson).getUserLevel(randomPerson.address);
	console.log("userLevel for randomPerson is: " + userLevel);
	
	var claimableAmount = await treasuryContract.connect(randomPerson).claimableAmount(randomPerson.address);
	console.log("claimableAmount for randomPerson is: " + claimableAmount / 1000000);
	
	var userLevel_2 = await referralContract.connect(randomPerson).getUserLevel(randomPerson_2.address);
	console.log("userLevel for randomPerson_2 is: " + userLevel_2);
	
	var claimableAmount_2 = await treasuryContract.connect(randomPerson).claimableAmount(randomPerson_2.address);
	console.log("claimableAmount for randomPerson_2 is: " + claimableAmount_2 / 1000000);
	
  });
  
  it("Should test parent leveling system Example 5", async function () {
	  
	// Add level 5 to randomPerson
	await referralContract.connect(owner).setUserLevelBoost(randomPerson.address, 3); // Level 3 gets 7,5%
	  
	// Approve USDC for randomPerson
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 25*10**USDC_Decimals);
	await keyContract.connect(randomPerson).mintKey("");
	
	// Set referral
	await keyContract.connect(randomPerson).setReferral("test_Referral");
	
	// Approve USDC for randomPerson_2
	await USDC_Contract.connect(randomPerson_2).approve(referralContract.address, 25*10**USDC_Decimals);

	await keyContract.connect(randomPerson_2).mintKey("test_Referral"); // Should give 7.5% (25 / 100 * 7.5) = 1.875 USDC to randomPerson
	await keyContract.connect(randomPerson_2).setReferral("test_Referral_2");
	
	await referralContract.connect(owner).setUserLevelBoost(randomPerson_2.address, 4); // Level 4 gets 9%
	
	// Approve USDC for randomPerson_3
	await USDC_Contract.connect(randomPerson_3).approve(referralContract.address, 25*10**USDC_Decimals);

	await keyContract.connect(randomPerson_3).mintKey("test_Referral_2");  // Should give 9% (25 / 100 * 9) = 2.25 USDC to randomPerson_2 AND 0 USDC to randomPerson
	
	// Approve USDC for randomPerson_4
	await USDC_Contract.connect(randomPerson_4).approve(referralContract.address, 1000*10**USDC_Decimals);

	await realEstateContract.connect(randomPerson_4).mintKey(1, "test_Referral_2");  // Should give 9% (1000 / 100 * 9) = 90 USDC to randomPerson_2 AND 0 USDC to randomPerson
	
	console.log("-------- RESULTS -----------");
	
	// Check claimableAmount for randomPerson
	var userLevel = await referralContract.connect(randomPerson).getUserLevel(randomPerson.address);
	console.log("userLevel for randomPerson is: " + userLevel);
	
	var claimableAmount = await treasuryContract.connect(randomPerson).claimableAmount(randomPerson.address);
	console.log("claimableAmount for randomPerson is: " + claimableAmount / 1000000);
	
	var userLevel_2 = await referralContract.connect(randomPerson).getUserLevel(randomPerson_2.address);
	console.log("userLevel for randomPerson_2 is: " + userLevel_2);
	
	var claimableAmount_2 = await treasuryContract.connect(randomPerson).claimableAmount(randomPerson_2.address);
	console.log("claimableAmount for randomPerson_2 is: " + claimableAmount_2 / 1000000);
	
  });
  
  it("Should test withdrawing money for user", async function () {
	
	// Add level 5 to randomPerson
	await referralContract.connect(owner).setUserLevelBoost(randomPerson.address, 3); // Level 3 gets 7,5%
	  
	// Approve USDC for randomPerson
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 25*10**USDC_Decimals);
	await keyContract.connect(randomPerson).mintKey("");
	
	// Set referral
	await keyContract.connect(randomPerson).setReferral("test_Referral");
	
	// Approve USDC for randomPerson_2
	await USDC_Contract.connect(randomPerson_2).approve(referralContract.address, 25*10**USDC_Decimals);

	await keyContract.connect(randomPerson_2).mintKey("test_Referral"); // Should give 7.5% (25 / 100 * 7.5) = 1.875 USDC to randomPerson
	await keyContract.connect(randomPerson_2).setReferral("test_Referral_2");
	
	await referralContract.connect(owner).setUserLevelBoost(randomPerson_2.address, 4); // Level 4 gets 9%
	
	// Approve USDC for randomPerson_3
	await USDC_Contract.connect(randomPerson_3).approve(referralContract.address, 25*10**USDC_Decimals);

	await keyContract.connect(randomPerson_3).mintKey("test_Referral_2");  // Should give 9% (25 / 100 * 9) = 2.25 USDC to randomPerson_2 AND 0 USDC to randomPerson
	
	// Approve USDC for randomPerson_4
	await USDC_Contract.connect(randomPerson_4).approve(referralContract.address, 1000*10**USDC_Decimals);

	await realEstateContract.connect(randomPerson_4).mintKey(1, "test_Referral_2");  // Should give 9% (1000 / 100 * 9) = 90 USDC to randomPerson_2 AND 0 USDC to randomPerson
	
	console.log("-------- RESULTS -----------");
	
	// Check claimableAmount for randomPerson
	var userLevel = await referralContract.connect(randomPerson).getUserLevel(randomPerson.address);
	console.log("userLevel for randomPerson is: " + userLevel);
	
	var claimableAmount = await treasuryContract.connect(randomPerson).claimableAmount(randomPerson.address);
	console.log("claimableAmount for randomPerson is: " + claimableAmount / 1000000);
	
	var userLevel_2 = await referralContract.connect(randomPerson).getUserLevel(randomPerson_2.address);
	console.log("userLevel for randomPerson_2 is: " + userLevel_2);
	
	var claimableAmount_2 = await treasuryContract.connect(randomPerson).claimableAmount(randomPerson_2.address);
	console.log("claimableAmount for randomPerson_2 is: " + claimableAmount_2 / 1000000);
	
	console.log("-------- END RESULTS -----------");
	
	// Try to claim USDC as randomPerson_2
	var balanceOf = await USDC_Contract.balanceOf(randomPerson_2.address);
    console.log("balance of randomPerson_2 before claim is " + balanceOf);
	
	await treasuryContract.connect(randomPerson_2).claim();
	
	var balanceOf_2 = await USDC_Contract.balanceOf(randomPerson_2.address);
    console.log("balance of randomPerson_2 after claim is " + balanceOf_2);
	
	
  });
  
  it("Should test multisign withdrawal for team", async function () {
	
	// Add level 5 to randomPerson
	await referralContract.connect(owner).setUserLevelBoost(randomPerson.address, 3); // Level 3 gets 7,5%
	  
	// Approve USDC for randomPerson
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 25*10**USDC_Decimals);
	await keyContract.connect(randomPerson).mintKey("");
	
	// Set referral
	await keyContract.connect(randomPerson).setReferral("test_Referral");
	
	// Approve USDC for randomPerson_2
	await USDC_Contract.connect(randomPerson_2).approve(referralContract.address, 25*10**USDC_Decimals);

	await keyContract.connect(randomPerson_2).mintKey("test_Referral"); // Should give 7.5% (25 / 100 * 7.5) = 1.875 USDC to randomPerson
	await keyContract.connect(randomPerson_2).setReferral("test_Referral_2");
	
	await referralContract.connect(owner).setUserLevelBoost(randomPerson_2.address, 4); // Level 4 gets 9%
	
	// Approve USDC for randomPerson_3
	await USDC_Contract.connect(randomPerson_3).approve(referralContract.address, 25*10**USDC_Decimals);

	await keyContract.connect(randomPerson_3).mintKey("test_Referral_2");  // Should give 9% (25 / 100 * 9) = 2.25 USDC to randomPerson_2 AND 0 USDC to randomPerson
	
	// Set to 1K
	await realEstateContract.connect(owner).setPrice(1000);
	
	// Approve USDC for randomPerson_4
	await USDC_Contract.connect(randomPerson_4).approve(referralContract.address, 1000*10**USDC_Decimals);
	
	await realEstateContract.connect(randomPerson_4).mintKey(1, "test_Referral_2");  // Should give 9% (1000 / 100 * 9) = 90 USDC to randomPerson_2 AND 0 USDC to randomPerson
	
	
	// Set team members
	await treasuryContract.connect(owner).setTeamAddresses(infinityTeamPerson.address, infinityTeamPerson_2.address);
	
	// proposal for 910 USDC by infinityTeamPerson
	await treasuryContract.connect(infinityTeamPerson).multiSignProposal(realEstateContract.address, infinityTeamPerson.address, 910*10**6); 
	
	// allowance of proposal for 910 USDC by infinityTeamPerson_2
	await treasuryContract.connect(infinityTeamPerson_2).multiSignAllowance(realEstateContract.address, infinityTeamPerson.address, 910*10**6); 
	
	// Final allowed transfer
	await treasuryContract.connect(infinityTeamPerson).multiSignTransfer(realEstateContract.address, infinityTeamPerson.address, 910*10**6);
	
	// Check balance after transfer
	var balanceOf = await USDC_Contract.balanceOf(infinityTeamPerson.address);
    console.log("balance of infinityTeamPerson after claim is " + balanceOf);
	
  });
  it("Should check if treasury accepts random USDC", async function () {
	
	// Set team members
	await USDC_Contract.connect(randomPerson).transfer(treasuryContract.address, 10*10**6);
	
	// Check balance after transfer
	var balanceOf = await USDC_Contract.balanceOf(treasuryContract.address);
    console.log("balance of treasuryContract is " + balanceOf);
	
  });
  it("Should mint Real Estate", async function () {
	
	// Approve USDC for randomPerson
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 2500*10**USDC_Decimals);
	await keyContract.connect(randomPerson).mintKey("");
	
	// Set referral
	await keyContract.connect(randomPerson).setReferral("test_Referral");
	
	
	// Mint Real Estate as randomPerson_2
	await USDC_Contract.connect(randomPerson_2).approve(referralContract.address, 2500*10**USDC_Decimals);

	await realEstateContract.connect(randomPerson_2).mintKey(5, "test_Referral");
	
	// Set referral
	await realEstateContract.connect(randomPerson_2).setReferral("test_Referral_2");
	
	
	// Mint Term deposit as randomPerson_2
	// await USDC_Contract.connect(randomPerson_2).approve(referralContract.address, 2500*10**USDC_Decimals);

	await termDepositContract.connect(randomPerson_2).mintKey(5, "test_Referral");
	
	// Set referral
	// await termDepositContract.connect(randomPerson_2).setReferral("test_Referral_2");
	
  });
  
  it.only("Should check Parent -> Child hashing connection", async function () {
	  
	
	  
	// Approve USDC for randomPerson
	await USDC_Contract.connect(randomPerson).approve(referralContract.address, 2500*10**USDC_Decimals);
	await keyContract.connect(randomPerson).mintKey("");
	
	// Set referral
	await keyContract.connect(randomPerson).setReferral("test_Referral");
	
	
	// Mint Real Estate as randomPerson_2
	await USDC_Contract.connect(randomPerson_2).approve(referralContract.address, 2500*10**USDC_Decimals);

	await realEstateContract.connect(randomPerson_2).mintKey(5, "test_Referral");
	
	// Set referral
	await realEstateContract.connect(randomPerson_2).setReferral("test_Referral_2");
	
	
	// Mint Term deposit as randomPerson_2
	// await USDC_Contract.connect(randomPerson_2).approve(referralContract.address, 2500*10**USDC_Decimals);

	await termDepositContract.connect(randomPerson_2).mintKey(5, "test_Referral");
	
	
	// Get parent hash
	var hash = utils.solidityKeccak256(['address', 'uint'],[keyContract.address, 1]);
	
	console.log(hash);
	
	var parentStruct = await referralContract.allNFTs(hash);
	
	console.log(parentStruct);
	
	var childHashHelper = utils.solidityKeccak256(['address', 'uint', 'uint'],[keyContract.address, 1, 9]); // 10 children, 0 is the first
	
	console.log(childHashHelper);
	
	var childHash = await referralContract.child(childHashHelper);
	
	var child = await referralContract.allNFTs(childHash);
	
	console.log(child);
	
	// Set referral
	// await termDepositContract.connect(randomPerson_2).setReferral("test_Referral_2");
	
  });
  
  /*
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
	
	// Mint using the tokens
	contractCall = await infinityCoFounderContract.connect(randomPerson).mintKey("");
	await contractCall.wait();
	
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
  */
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
