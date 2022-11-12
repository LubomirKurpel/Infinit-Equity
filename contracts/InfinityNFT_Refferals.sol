// contracts/GameItems.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract ERC721Contract {
	function balanceOf(address owner) public view virtual returns (uint256);
	// function tokenOfOwnerByIndex(address owner) public virtual returns (uint256);
	function tokenOfOwnerByIndex(address owner, uint256 index) public view virtual returns (uint256);
	function ownerOf(uint256 tokenId) public view virtual returns (address);
}

interface ItreasuryContract {
   function addClaimableFundsToAddress(address, address, uint) external;
   function addPersonalVolumeToAddress(address, uint) external;
   function addProjectFunds(address, uint) external;
}

contract InfinityNFT_Referrals is Ownable, AccessControl {
	
	using SafeERC20 for IERC20;
	
	// Roles
    bytes32 public constant ALLOWED_ROLE = keccak256("ALLOWED_ROLE");
    bytes32 public constant CONTRACT_ROLE = keccak256("CONTRACT_ROLE");
	
	address public USDCAddress;
	address public TreasuryAddress;
	address public InfinityKeyAddress;
	
	address[] private ContractAddresses;
	
	uint public totalMintedNFTs;
	
	function grantRole(bytes32 role, address account) public override onlyRole(getRoleAdmin(role)) {
		
		if (role == CONTRACT_ROLE) {
			ContractAddresses.push(account);
		}
        _grantRole(role, account);
		
    }
	
	constructor(address _USDCAddress, address _TreasuryAddress) Ownable() {
		
		_setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
		_setupRole(ALLOWED_ROLE, _msgSender());
		
		USDCAddress = _USDCAddress;
		TreasuryAddress = _TreasuryAddress;
		
		uint _USDC_Decimals = 6;
		
		
		
		// Default levels
		// levels[1] = 0 ETHER;
		levels[2] = 30000*10**_USDC_Decimals;
		levels[3] = 90000*10**_USDC_Decimals;
		levels[4] = 270000*10**_USDC_Decimals;
		levels[5] = 1000000*10**_USDC_Decimals;
		levels[6] = 2700000*10**_USDC_Decimals;
		levels[7] = 7000000*10**_USDC_Decimals;
		levels[8] = 15000000*10**_USDC_Decimals;
		
		// Default provisions
		provisions[1] = 450;
		provisions[2] = 600;
		provisions[3] = 750;
		provisions[4] = 900;
		provisions[5] = 1050;
		provisions[6] = 1200;
		provisions[7] = 1350;
		provisions[8] = 1350;
		
		reversePaymentValue = 1*10**17; // 0.1 ETH
		
	}
	
	// Setters
	function setUSDCAddress(address _address) external onlyOwner {
        USDCAddress = _address;
    }
	
	function setTreasuryAddress(address _address) external onlyOwner {
        TreasuryAddress = _address;
    }
	
	function setInfinityKeyAddress(address _address) external onlyOwner {
        InfinityKeyAddress = _address;
    }
	
	
	// Referral Functionality
	
	// Address by referral string
	mapping(string => address) public addressByReferral;
	
	// referral string by address
	mapping(address => string) public referralByAddress;
	
	// Setters
	function setReferral(address sender, string memory referralString) external onlyRole(CONTRACT_ROLE) {
		require(addressByReferral[referralString] == address(0), "Referral already in use");
		
		// Reset old referral so someone else can use it afterwards
		string memory _currentReferral = referralByAddress[sender];
		addressByReferral[_currentReferral] = address(0);
		
		// Set the referral address
		addressByReferral[referralString] = sender;
		
		// Set the referral string
		referralByAddress[sender] = referralString;
	}
	
	// This function is for emergencies only, if we need to clear referral
	function eraseReferralAdmin(string memory referralString) external onlyRole(ALLOWED_ROLE) {
		
		// Reset old referral so someone else can use it afterwards
		addressByReferral[referralString] = address(0);
		
	}
	
	// Getters
	function getReferralByAddress(address referralAddress) public view returns (string memory) {
        require(bytes(referralByAddress[referralAddress]).length != 0, "This address has no referral");
		
        string memory _referral;
		
		_referral = referralByAddress[referralAddress];
		
        return _referral;
    }
	
	function getAddressByReferral(string memory referralString) public view returns (address) {
        require(addressByReferral[referralString] != address(0), "This referral does not exist");
		
        address _referral;
		
		_referral = addressByReferral[referralString];
		
        return _referral;
    }
	
	
	// NFT Tree functionality
	struct NFT {
		address collection;
		uint tokenId;
		address parentCollection;
		uint parentTokenId;
		uint numberOfChildren;
	}
	
	// Child hash to parent NFT object hash
	// keccak256(collection + tokenId + numberOfChildren[0]) => keccak256(collection + tokenId)...
	mapping(bytes32 => bytes32) public child; 
	
	// Mapping holding all NFTs
	// keccak256(collection + tokenId) => struct NFT
	mapping(bytes32 => NFT) public allNFTs; 
	
	// User Address => Total Collected Value in USDC
	mapping(address => uint) public totalCollectedValue;
	
	
	
	/*
	TESTS:
	
	Mintuje novy kluc
	Mintuje kluc s referralom
	Mintuje Co-founder NFT samostatne
	Mintuje Co-Founder NFT s referralom
	Mintuje Property samostatne
	Mintuje Property s referralom
	
	*/
	
	uint public reversePaymentValue;
	
	function setReversePaymentValue(uint valueInWei) external onlyRole(ALLOWED_ROLE) {
		
		reversePaymentValue = valueInWei;
		
	}
	
	// On mint HOOK
	function onMint(address minter, uint mintedTokenId, string memory usedReferral, uint amount, bool externalMint) external payable onlyRole(CONTRACT_ROLE) {
		
		// console.log("onMint() start");
		
		// Init in mapping
		NFT memory _mintedNFT;
		_mintedNFT.collection = msg.sender;
		_mintedNFT.tokenId = mintedTokenId;
		
		// Calculate the hash of newly minted for mapping
		bytes32 _mintedNFT_hash = keccak256(abi.encodePacked(_mintedNFT.collection, _mintedNFT.tokenId));
		allNFTs[_mintedNFT_hash] = _mintedNFT;
		
		// Tranfer funds to Treasury contract
		if (amount > 0 && externalMint == false) {
			IERC20(USDCAddress).safeTransferFrom(minter, TreasuryAddress, amount);
			
			ItreasuryContract TreasuryContract = ItreasuryContract(TreasuryAddress);
			
			TreasuryContract.addProjectFunds(msg.sender, amount);
			
			// Send some matic to minter
			if (address(this).balance >= reversePaymentValue) {
				
				payable(minter).transfer(reversePaymentValue);
				
			}
			
		}
		
		// If referral is used
		if (bytes(usedReferral).length > 0) {
			address _referralAddress = addressByReferral[usedReferral];
			
			require(_referralAddress != address(0), "Referral does not exist");
			
			// Get the Infinity Key of referral address
			ERC721Contract _InfinityKeyContract = ERC721Contract(InfinityKeyAddress);
			
			// If referral address has Infinity Key
			if (_InfinityKeyContract.balanceOf(_referralAddress) > 0) {
				
				uint _referraltokenId = _InfinityKeyContract.tokenOfOwnerByIndex(_referralAddress, 0);
				
				// Create new child NFT in memory
				_mintedNFT.parentCollection = InfinityKeyAddress;
				_mintedNFT.parentTokenId = _referraltokenId;
				allNFTs[_mintedNFT_hash] = _mintedNFT;
				
				// Set child of parent who referred this mint
				bytes32 _referralNft_hash = keccak256(abi.encodePacked(InfinityKeyAddress, _referraltokenId));
				NFT memory _referralNft = allNFTs[_referralNft_hash];
				
				// Calculate the hash of child for mapping, because array resizing in storage is not yet supported, quite a hack
				bytes32 _hash = keccak256(abi.encodePacked(_referralNft.collection, _referraltokenId, _referralNft.numberOfChildren));
				child[_hash] = _mintedNFT_hash;
				
				// console.logBytes32(_hash);
				
				// Increment number of children of referral NFT
				_referralNft.numberOfChildren++;
				
				// Save to storage
				allNFTs[_referralNft_hash] = _referralNft;
				
				// console.log(_referralNft.collection, _referraltokenId, _referralNft.numberOfChildren);
				// console.logBytes32(_mintedNFT_hash);
				
				if (amount > 0) {
					// Add totalCollectedValue to all the parent's addresses, this might get gas inefficient quickly but we have no other option because of other logic
					_addTotalCollectedValueRecursive(_referraltokenId, amount);
					
					// Get level of parent
					uint _referralUserLevel = getUserLevel(_referralAddress);
					
					// Get accountable provision for referral
					uint _referralProvision = provisions[_referralUserLevel];
					
					uint _amount_stack = amount; // Fix for Stack too deep error
					
					_addClaimableFundsToAddress(_msgSender(), _referralAddress, _amount_stack / (100 * 100) * _referralProvision);
					_addPersonalVolumeToAddress(_referralAddress, _amount_stack);
					
					// console.log("Added", _amount_stack / (100 * 100) * _referralProvision, "to", _referralAddress);
					
					// Referral's parent calculation
					if (_referralNft.parentTokenId > 0) {
						
						bytes32 _referralParent_hash = keccak256(abi.encodePacked(_referralNft.parentCollection, _referralNft.parentTokenId));
						NFT memory _referralParentNft = allNFTs[_referralParent_hash];
						
						ERC721Contract _ProjectContract = ERC721Contract(_referralParentNft.collection);
						
						address _referralParentAddress = _ProjectContract.ownerOf(_referralParentNft.tokenId);
						
						// Get accountable provision for referral's parent
						
						// Get level of referral's parent
						uint _referralParentUserLevel = getUserLevel(_referralParentAddress);
						
						// Get accountable provision for referral's parent
						uint _referralParentProvision = provisions[_referralParentUserLevel];
						
						// Calculate the remainder and prevent underflow in uint
						if (_referralParentProvision > _referralProvision) {
							
							uint _remainder = _referralParentProvision - _referralProvision;
							
							_addClaimableFundsToAddress(_msgSender(), _referralParentAddress, _amount_stack / (100 * 100) * _remainder);
							
							// console.log("Added", _amount_stack / (100 * 100) * _remainder, "to", _referralParentAddress);
							
						}
						
					}
					
				}
				
			}
			else {
				
				// Newly minted NFT was minted with referral from standard User
				
				// Parent gets 6% USDC and rest is accounted to parent of the parent
				_addClaimableFundsToAddress(_msgSender(), _referralAddress, amount / 100 * 6);
				
				// console.log("Added", amount / 100 * 6, "to", _referralAddress);
				
				for (uint i = 0; i < ContractAddresses.length; i++) {
					
					// Get first NFT owned by referral account
					ERC721Contract _ProjectContract = ERC721Contract(ContractAddresses[i]);
					
					if (_ProjectContract.balanceOf(_referralAddress) > 0) {
						
						uint _referraltokenId = _ProjectContract.tokenOfOwnerByIndex(_referralAddress, 0);
						
						// Add Total Collected Value recursive to all the parents
						_addTotalCollectedValueRecursive(_referraltokenId, amount);
						
						// Save this collection as Parent of new mint
						_mintedNFT.parentCollection = ContractAddresses[i];
						_mintedNFT.parentTokenId = _referraltokenId;
						allNFTs[_mintedNFT_hash] = _mintedNFT;
						
						// Get hash of referral NFT parent Level 1
						bytes32 _referralNft_hash = keccak256(abi.encodePacked(ContractAddresses[i], _referraltokenId));
						NFT memory _referralNft = allNFTs[_referralNft_hash];
									
						// Calculate the hash of child for mapping, because array resizing in storage is not yet supported, quite a hack
						bytes32 _hash = keccak256(abi.encodePacked(_referralNft.collection, _referraltokenId, _referralNft.numberOfChildren));
						child[_hash] = _mintedNFT_hash;
						
						// Increment number of children of referral NFT
						_referralNft.numberOfChildren++;
						
						// Save to storage
						allNFTs[_referralNft_hash] = _referralNft;
						
						uint _amount_stack = amount; // Fix for Stack too deep error
						
						// Get 2nd level Parent NFT
						if (_referralNft.parentTokenId > 0) {
							
							// Get parent owner
							ERC721Contract _ParentContract = ERC721Contract(_referralNft.parentCollection);
							
							address _parentOwner = _ParentContract.ownerOf(_referralNft.parentTokenId);
							
							// Parent of parent is _parentOwner
							uint _userLevel = getUserLevel(_parentOwner);
							
							// Get accountable provision
							uint _provision = provisions[_userLevel];
							
							// Account 6% already taken
							if (_provision > 600) {
								
								uint _remainder = _provision - 600;
								
								// _remainder belongs to Parent of Parent
								_addClaimableFundsToAddress(_msgSender(), _parentOwner, _amount_stack / (100 * 100) * _remainder);
								
								// console.log("Added", _amount_stack / (100 * 100) * _remainder, "to", _parentOwner);
								
							}
							
							break;
							
						}
						
					}
		
				}
				
			}
			
		}
		
		totalMintedNFTs++;
		
	}
	
	
	
	address[] public levelBoostContracts;
	
	// Contract Address => Level Boost
	mapping(address => uint) public levelBoost;
	
	// User Address => Level Boost
	mapping(address => uint) public userLevelBoost;
	
	// Setters
	
	function setLevelBoostContract(address contractAddress, uint boostByNumberOfLevels) external onlyOwner {
		levelBoostContracts.push(contractAddress);
		levelBoost[contractAddress] = boostByNumberOfLevels;
	}
	
	function setUserLevelBoost(address userAddress, uint boostByNumberOfLevels) external onlyRole(ALLOWED_ROLE) {
		userLevelBoost[userAddress] = boostByNumberOfLevels;
	}
	
	function removeLevelBoostContract(uint index) external onlyOwner {
		
		require(index < levelBoostContracts.length);
		
		address _contractAddress = levelBoostContracts[index];
		
		levelBoostContracts[index] = levelBoostContracts[levelBoostContracts.length-1];
		levelBoostContracts.pop();
		
		levelBoost[_contractAddress] = 0;
		
	}
	
	function getUserLevel(address userAddress) public view returns (uint) {
		
		// Leveling system is available only for people with Infinity Key ownership
		uint _totalCollectedValue = getUserTotalCollectedValue(userAddress);
		
		if (_totalCollectedValue > 0) {
			
			// Check which level suits in the range of levels
			uint currentUserLevel;
		
			// Check which level suits totalCollectedValue
			for (uint i = 1; i <= 8; i++) {
				
				if (_totalCollectedValue >= levels[i]) {
					currentUserLevel = i;
				}
				else {
					break;
				}
				
			}
			
			return currentUserLevel;
			
		}
		return 0;

	}
	
	
	/*
	function _HELPER_readStruct(NFT memory _struct) public view {
		*/
		// NFT Tree functionality
		/*
		struct NFT {
			address collection;
			uint tokenId;
			address parentCollection;
			uint parentTokenId;
			uint numberOfChildren;
		}
		*/
		/*
		console.log("--");
		console.log("NFT collection ", _struct.collection);
		console.log("NFT tokenId ", _struct.tokenId);
		console.log("NFT parentCollection ", _struct.parentCollection);
		console.log("NFT parentTokenId ", _struct.parentTokenId);
		console.log("NFT numberOfChildren ", _struct.numberOfChildren);
		console.log("--");
		
	}		
	*/
	
	function getUserTotalCollectedValue(address userAddress) public view returns (uint) {
		
		// Leveling system is available only for people with Infinity Key ownership
		ERC721Contract _InfinityKeyContract = ERC721Contract(InfinityKeyAddress);
	
		if (_InfinityKeyContract.balanceOf(userAddress) > 0) {
			
			uint _tokenId = _InfinityKeyContract.tokenOfOwnerByIndex(userAddress, 0);
			
			// console.log(_tokenId);
			
			// Get all children of this NFT Key
			uint _numberOfChildren = getNumberOfChildren(_tokenId);
			
			uint _biggestChild;
			uint _totalCollectedValue;
			
			// console.log(_numberOfChildren);
			
			// Iterate the children
			for (uint i = 0; i < _numberOfChildren; i++) {
				
				bytes32 _hash = keccak256(abi.encodePacked(InfinityKeyAddress, _tokenId, i));
				bytes32 _nftStorageHash = child[_hash];
				
				NFT memory _storageNFT = allNFTs[_nftStorageHash];
				
				// Get Owner of this NFT
				ERC721Contract _ProjectContract = ERC721Contract(_storageNFT.collection);
				
				// _HELPER_readStruct(_storageNFT); // CONSOLE.LOG
				
				address _owner = _ProjectContract.ownerOf(_storageNFT.tokenId);
				
				// Get total collected value of the _owner
				// _totalCollectedValue += totalCollectedValue[_owner];
				
				// console.log("_totalCollectedValue Child Owner: ", totalCollectedValue[_owner]);
				
				if (totalCollectedValue[_owner] > _biggestChild) {
					_biggestChild = totalCollectedValue[_owner];
				}
				
			}
			
			_totalCollectedValue += totalCollectedValue[userAddress];
			
			// console.log("_biggestChild: ", _biggestChild);
			
			// console.log("_totalCollectedValue before calc: ", _totalCollectedValue);
			
			// _biggestChild has to be 60% of _totalCollectedValue
			uint _60percent = _totalCollectedValue / 100 * 60;
			
			if (_biggestChild >= _60percent) {
				_totalCollectedValue -= (_biggestChild / 100 * 40); // Decrease the biggest child by 40%
			}
			
			// console.log("_totalCollectedValue after calc: ", _totalCollectedValue);
			
			
			// Iterate booster contracts
			uint topLevelBoost;
			
			for (uint i=0; i < levelBoostContracts.length; i++) {
				
				ERC721Contract _BoosterContract = ERC721Contract(levelBoostContracts[i]);
				
				if (_BoosterContract.balanceOf(userAddress) > 0) {
					
					// is owner of this booster contract, adds total collected value by level
					if (levelBoost[levelBoostContracts[i]] > topLevelBoost) {
						topLevelBoost = levelBoost[levelBoostContracts[i]];
					}
					
				}
				
			}
			
			if (userLevelBoost[userAddress] > topLevelBoost) {
				topLevelBoost = userLevelBoost[userAddress];
			}
			
			if (topLevelBoost > 0) {
				_totalCollectedValue += levels[topLevelBoost];
			}
			
			// console.log("_totalCollectedValue after boosters: ", _totalCollectedValue);
			
			return _totalCollectedValue;
			
		}
		return 0;
		
	}
	
	function getNumberOfChildren(uint tokenId) public view returns (uint) {
		
		bytes32 _hash = keccak256(abi.encodePacked(InfinityKeyAddress, tokenId));
        return allNFTs[_hash].numberOfChildren;
		
    }
	
	// function getChildOnIndex(uint collection, uint tokenId, uint index) public view returns (NFT memory) {
		
		// bytes32 _hash = keccak256(abi.encodePacked(collection, tokenId, index));
		
		// return allNFTs[child[_hash]];
		
    // }
	
	function _addTotalCollectedValueRecursive(uint tokenId, uint amount) internal {
		
		// Get the Infinity Key of referral address
		ERC721Contract InfinityKeyContract = ERC721Contract(InfinityKeyAddress);
		
		address _infinityKeyOwner = InfinityKeyContract.ownerOf(tokenId);
		
		totalCollectedValue[_infinityKeyOwner] += amount;
		
		// Check if NFT has parent
		bytes32 hash = keccak256(abi.encodePacked(InfinityKeyAddress, tokenId));
		NFT memory currentNft = allNFTs[hash];
		
		if (currentNft.parentTokenId > 0) {
			
			_addTotalCollectedValueRecursive(currentNft.parentTokenId, amount);
			
		}
		
	}
	
	// USDC handling in Treasury Contract
	function _addClaimableFundsToAddress(address projectAddress, address claimableAddress, uint amount) internal {
		
		// Get the Infinity Key of referral address
		ItreasuryContract TreasuryContract = ItreasuryContract(TreasuryAddress);
		
		TreasuryContract.addClaimableFundsToAddress(projectAddress, claimableAddress, amount);
		
	}
	
	function _addPersonalVolumeToAddress(address userAddress, uint amount) internal {
		
		ItreasuryContract TreasuryContract = ItreasuryContract(TreasuryAddress);
		
		TreasuryContract.addPersonalVolumeToAddress(userAddress, amount);
		
	}
	
	// LEVELS
	mapping(uint => uint) private levels;
	mapping(uint => uint) private provisions;
	
	function setLevelThreshold(uint level, uint value) external onlyOwner {
		levels[level] = value;
    }
	
}
