pragma solidity ^0.6.0;

import "./interfaces/EglProxy.sol";

contract EglUpgrader {
    function doUpgrade(address proxyAddress, address implAddress) public {
        EglProxy(proxyAddress).upgradeTo(implAddress);
    }
}