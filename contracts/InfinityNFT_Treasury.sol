// contracts/GameItems.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// abstract contract ERC721Contract {
	// function balanceOf(address owner) public view virtual returns (uint256);
	// function tokenOfOwnerByIndex(address owner) public virtual returns (uint256);
	// function tokenOfOwnerByIndex(address owner, uint256 index) public view virtual returns (uint256);
	// function ownerOf(uint256 tokenId) public view virtual returns (address);
// }

// interface ItreasuryContract {
   // function addClaimableFundsToAddress(address, uint) external;
// }

contract InfinityNFT_Treasury is ReentrancyGuard, Ownable, AccessControl {
	
	using SafeERC20 for IERC20;
	
	// Roles
    bytes32 public constant ALLOWED_ROLE = keccak256("ALLOWED_ROLE");
    bytes32 public constant CONTRACT_ROLE = keccak256("CONTRACT_ROLE");
	
	address public USDCAddress;
	
	// User Address => Claimable Amount
	mapping(address => uint) public claimableAmount;
	mapping(address => uint) public personalVolume;
	
	// Contract Address => Max claimable amount for team
	mapping(address => uint) public maxClaimableAmountForTeam;
	
	address public teamMember_1;
	address public teamMember_2;
	
	modifier noContracts {
        require(msg.sender == tx.origin, "No smart contracts!");
        _;
    }
	
	constructor(address _USDCAddress) Ownable() {
		
		_setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
		_setupRole(ALLOWED_ROLE, _msgSender());
		
		USDCAddress = _USDCAddress;
		
	}
	
	// Setters
	function setUSDCAddress(address _address) external onlyOwner {
        USDCAddress = _address;
    }
	
	function setTeamAddresses(address address_1, address address_2) external onlyOwner {
        teamMember_1 = address_1;
		teamMember_2 = address_2;
    }
	
	struct MultiSign {
		address collection;
		address receiver;
		uint withdrawalAmount;
		address signedTeamMember_1;
		address signedTeamMember_2;
		bool expired; 
	}
	
	mapping(bytes32 => MultiSign) public multiSigns; 
	
	function multiSignProposal(address collection, address receiver, uint withdrawalAmount) external {
		
		require(msg.sender == teamMember_1 || msg.sender == teamMember_2, "Not allowed!");
		
		// Init in mapping
		MultiSign memory _multiSign;
		_multiSign.collection = collection;
		_multiSign.receiver = receiver;
		_multiSign.withdrawalAmount = withdrawalAmount;
		
		if (msg.sender == teamMember_1) {
			_multiSign.signedTeamMember_1 = msg.sender;
		}
		if (msg.sender == teamMember_2) {
			_multiSign.signedTeamMember_2 = msg.sender;
		}
		
		// Calculate the hash of newly minted for mapping
		bytes32 _signHash = keccak256(abi.encodePacked(collection, receiver, withdrawalAmount));
		multiSigns[_signHash] = _multiSign;
		
    }
	function multiSignAllowance(address collection, address receiver, uint withdrawalAmount) external {
		
		require(msg.sender == teamMember_1 || msg.sender == teamMember_2, "Not allowed!");
		
		// Calculate the hash of newly minted for mapping
		bytes32 _signHash = keccak256(abi.encodePacked(collection, receiver, withdrawalAmount));
		MultiSign memory _multiSign = multiSigns[_signHash];
		
		if (msg.sender == teamMember_1) {
			_multiSign.signedTeamMember_1 = msg.sender;
		}
		if (msg.sender == teamMember_2) {
			_multiSign.signedTeamMember_2 = msg.sender;
		}
		
		/*
		console.log(_multiSign.signedTeamMember_1);
		console.log(_multiSign.signedTeamMember_2);
		*/
		
		multiSigns[_signHash] = _multiSign;
		
    }
	function multiSignTransfer(address collection, address receiver, uint withdrawalAmount) external {
		
		require(msg.sender == teamMember_1 || msg.sender == teamMember_2, "Not allowed!");
		
		// Calculate the hash of newly minted for mapping
		bytes32 _signHash = keccak256(abi.encodePacked(collection, receiver, withdrawalAmount));
		MultiSign memory _multiSign = multiSigns[_signHash];
		
		require(_multiSign.signedTeamMember_1 != address(0) && _multiSign.signedTeamMember_2 != address(0), "Tx not signed by both parties");
		require(!_multiSign.expired, "Tx was already used");
		require(withdrawalAmount >= maxClaimableAmountForTeam[collection], "Withdrawing more than allowed");
		
		_multiSign.expired = true;
		multiSigns[_signHash] = _multiSign;
		
		maxClaimableAmountForTeam[collection] -= withdrawalAmount;
		
		IERC20(USDCAddress).safeTransfer(receiver, withdrawalAmount);
		
    }
	
	
	function addPersonalVolumeToAddress(address userAddress, uint amount) external nonReentrant onlyRole(CONTRACT_ROLE) {
		
		personalVolume[userAddress] += amount; 
		
	}
	
	function addClaimableFundsToAddress(address projectAddress, address userAddress, uint amount) external nonReentrant onlyRole(CONTRACT_ROLE) {
		
		// console.log("addClaimableFundsToAddress - userAddress: ", userAddress);
		// console.log("addClaimableFundsToAddress - amount: ", amount);
		
		claimableAmount[userAddress] += amount; 
		
		// console.log("maxClaimableAmountForTeam[]: ", projectAddress);
		
		// Decrease max allowed value for team withdrawal
		if (amount <= maxClaimableAmountForTeam[projectAddress]) {
			maxClaimableAmountForTeam[projectAddress] -= amount;
			// console.log("maxClaimableAmountForTeam[]: ", maxClaimableAmountForTeam[projectAddress]);
		}
		
	}
	
	function addProjectFunds(address contractAddress, uint amount) external nonReentrant onlyRole(CONTRACT_ROLE) {
		// console.log("addProjectFunds - contractAddress: ", contractAddress);
		// console.log("addProjectFunds - amount: ", amount);
		maxClaimableAmountForTeam[contractAddress] += amount;
	}
	
	function claim() external nonReentrant noContracts {
		
		uint claimableUserAmount = claimableAmount[_msgSender()];
		
		claimableAmount[_msgSender()] = 0;
		
		IERC20(USDCAddress).safeTransfer(_msgSender(), claimableUserAmount);
		
	}
	
	// TODO: Zapisať kolekciu na usera
	
	// Safe-measure to prevent any token lockup, this will never be called unless emergency
	// Withdraw any token
    function withdrawTokens(address _token) public onlyOwner {
        uint amount = IERC20(_token).balanceOf(address(this));
        IERC20(_token).safeTransfer(msg.sender, amount);
    }

	// Withdraw Ether
    function withdrawEther() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance); 
    }
	
}