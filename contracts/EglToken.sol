pragma solidity ^0.6.0;

import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/presets/ERC20PresetMinterPauser.sol";

contract EglToken is Initializable, ERC20PresetMinterPauserUpgradeSafe {
    function initialize(string memory name, string memory symbol, uint256 initialSupply) public {
        ERC20PresetMinterPauserUpgradeSafe.initialize(name, symbol);
        _mint(msg.sender, initialSupply);
    }
}
