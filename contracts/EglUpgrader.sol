pragma solidity ^0.6.0;

import "./interfaces/EglProxy.sol";

contract EglUpgrader {
    address owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "UPGRADER: NOT_OWNER");
        _;
    }

    constructor() public {
        owner = msg.sender;
    }

    function upgradeImplementation(address _proxyAddress, address _implAddress) external onlyOwner {        
        EglProxy(_proxyAddress).upgradeTo(_implAddress);
    }

    function setOwner(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }

    function getProxyImplementation(address _proxyAddress) public view returns (address) {
        // We need to manually run the static call since the getter cannot be flagged as view
        // bytes4(keccak256("implementation()")) == 0x5c60da1b
        (bool success, bytes memory returndata) = _proxyAddress.staticcall(hex"5c60da1b");
        require(success);
        return abi.decode(returndata, (address));
    }
}