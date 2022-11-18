// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol';
import '@openzeppelin/contracts/utils/Address.sol';
import '@openzeppelin/contracts/utils/introspection/ERC165.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


// [MIT License]
// @title Base64
// @notice Provides a function for encoding some bytes in base64
// @author Brecht Devos <brecht@loopring.org>
library Base64 {
    bytes internal constant TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    /// @notice Encodes some bytes to the base64 representation
    function encode(bytes memory data) internal pure returns (string memory) {
        uint256 len = data.length;
        if (len == 0) return "";

        // multiply by 4/3 rounded up
        uint256 encodedLen = 4 * ((len + 2) / 3);

        // Add some extra buffer at the end
        bytes memory result = new bytes(encodedLen + 32);

        bytes memory table = TABLE;

        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)

            for {
                let i := 0
            } lt(i, len) {

            } {
                i := add(i, 3)
                let input := and(mload(add(data, i)), 0xffffff)

                let out := mload(add(tablePtr, and(shr(18, input), 0x3F)))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(12, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(6, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(input, 0x3F))), 0xFF))
                out := shl(224, out)

                mstore(resultPtr, out)

                resultPtr := add(resultPtr, 4)
            }

            switch mod(len, 3)
            case 1 {
                mstore(sub(resultPtr, 2), shl(240, 0x3d3d))
            }
            case 2 {
                mstore(sub(resultPtr, 1), shl(248, 0x3d))
            }

            mstore(result, encodedLen)
        }

        return string(result);
    }
}

interface IReferralContract {
   function onMint(address minter, uint mintedTokenId, string memory usedReferral, uint amount, bool externalMint) external payable;
   function setReferral(address sender, string memory referralString) external;
}

contract InfinitEquity_CoFounderPlus is ERC721, ERC721Enumerable, ReentrancyGuard, Ownable, AccessControl {
	
	// Roles
    bytes32 public constant ALLOWED_ROLE = keccak256("ALLOWED_ROLE");
    bytes32 public constant CONTRACT_ROLE = keccak256("CONTRACT_ROLE");
	
	uint public maxTokens = 25;
    uint public total = 0;
	
	// Mapping for wallet addresses that have previously minted
    mapping(address => bool) public whitelistMinters;

    mapping(address => bool) public whitelistAddresses;
	
	address public referralContractAddress;
	
	constructor(address _referralContractAddress) ERC721("Infinit Equity - Co-Founder+", "CoF+") Ownable() {
		
		_setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
		_setupRole(ALLOWED_ROLE, _msgSender());
		
		referralContractAddress = _referralContractAddress;
		
		// Test mint to admin
		total++;
		_lockedMint(msg.sender, 1);
		
	}
	
	// Setters
	
	function setMaxTokens(uint _maxTokens) external onlyRole(ALLOWED_ROLE) {
        maxTokens = _maxTokens;
    }
	
	function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721Enumerable, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
	
	function addTeamMemberAsAdmin(address _address) external onlyRole(ALLOWED_ROLE) {
		_setupRole(ALLOWED_ROLE, _address);
    }
	
	// Setters
    function addWhitelistAdresses(address[] memory _addresses) external onlyRole(ALLOWED_ROLE) {
      for (uint i=0; i < _addresses.length; i++) {
          whitelistAddresses[_addresses[i]] = true;
      }
    }
	
    function addToWhitelistSingle(address _address) external onlyRole(ALLOWED_ROLE) {
        whitelistAddresses[_address] = true;
    }
	
    function removeFromWhitelist(address _address) external onlyRole(ALLOWED_ROLE) {
		whitelistAddresses[_address] = false;
    }
	
	// Token URI functionality
	string videoTokenURI;
	string videoTokenURI_extension;
	string externalURI;
	string description;
	
	function setMetaAttributes(
		string memory _videoTokenURI,
		string memory _videoTokenURI_extension,
		string memory _externalURI,
		string memory _description
	) 
		external
		onlyRole(ALLOWED_ROLE)
	{
		videoTokenURI = _videoTokenURI;
		videoTokenURI_extension = _videoTokenURI_extension;
		externalURI = _externalURI;
		description = _description;
	}
	
	function tokenURI(uint _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "Query for non-existent token!");

        string[2] memory json;

        json[0] = string(
			abi.encodePacked('{',
                '"name": "Infinit Co-Founder+ Certificate+ #', t(_tokenId), '",',
                '"image": "', videoTokenURI, videoTokenURI_extension, '",',  
                '"external_url": "', externalURI, '",',  
                '"description": "', description, '",',
                '"attributes": ['
            )
		);

        json[1] = string(
			abi.encodePacked(
				']}'
            )
		);

        string memory result = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        json[0],
                        json[1]
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", result));
    }
	
	// Required function
	function setReferral(string memory referralString) external {
		
		require(balanceOf(_msgSender()) > 0, "Cannot set referral");
		
		IReferralContract _ReferralContract = IReferralContract(referralContractAddress);
		
		_ReferralContract.setReferral(_msgSender(), referralString);
		
	}
	
	// helper
	function t(uint _tokenId) public pure returns (string memory) {
		return Strings.toString(_tokenId);
	}
	
	function mintKey(string memory referral) public nonReentrant payable {
        require(whitelistAddresses[_msgSender()], "Not on whitelist");
        require(whitelistMinters[_msgSender()] == false, "Already minted");
		require(total <= maxTokens, "Mint over max limit");
		
		whitelistMinters[_msgSender()] = true;
		
        total++; 
		
		// Mint the token
        _lockedMint(_msgSender(), total);
		
		// Send the token to Referral Contract
		if (referralContractAddress != address(0)) {
			IReferralContract _ReferralContract = IReferralContract(referralContractAddress);
			
			_ReferralContract.onMint(_msgSender(), total, referral, 0, false);
		}
    }
	
	function mintKeyAdmin(address _targetAddress) public onlyRole(ALLOWED_ROLE) {
		
		total++;
		_lockedMint(_targetAddress, total);
		
    }
	
	
	// Burn mechanism
	function burnKey(address _tokenOwner, uint _tokenID) public nonReentrant onlyRole(CONTRACT_ROLE) {
		
		require(ownerOf(_tokenID) == _tokenOwner, "Not the owner of this token");
		
		_lockedBurn(_tokenID);
		
    }
	
	// Staking mechanism
	mapping(uint => bool) public staked;
	uint public numberOfStakedTokens;
	
	// Required function
	function stake(uint tokenId) external {
		
		require(ownerOf(tokenId) == _msgSender(), "Not the owner of this token");
		
		if (!staked[tokenId]) {
			staked[tokenId] = true;
			numberOfStakedTokens++;
		}
		
	}
	
	// Required function
	function unstake(uint tokenId) external {
		
		require(ownerOf(tokenId) == _msgSender(), "Not the owner of this token");
		
		if (staked[tokenId]) {
			staked[tokenId] = false;
			numberOfStakedTokens--;
		}
		
	}

	// Locking mechanism
	bool locked = true;

	function lockTransfer(bool _locked) public onlyRole(ALLOWED_ROLE) {
        locked = _locked;
    }
	
	function _getLocked() public view returns (bool) {
        return locked;
    }
	
	function _setLocked(bool _locked) internal {
        locked = _locked;
    }

	function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
		require(!locked, "Cannot transfer - currently locked");
		
		super._beforeTokenTransfer(from, to, tokenId);
	}
	
	// Helper functions to bypass locking mechanism
	function _lockedMint(address _targetAddress, uint _tokenID) internal {
		bool originalValue = _getLocked();
		_setLocked(false);
        _safeMint(_targetAddress, _tokenID);
		_setLocked(originalValue);
	}
	function _lockedBurn(uint _tokenID) internal {
		bool originalValue = _getLocked();
		_setLocked(false);
        _burn(_tokenID);
		_setLocked(originalValue);
	}
	
}