pragma solidity 0.6.6;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20CappedUpgradeable.sol";

contract EglToken is Initializable, ContextUpgradeable, ERC20CappedUpgradeable {
    function initialize(string memory name, string memory symbol, uint256 initialSupply) public initializer {
        __ERC20_init(name, symbol);
        __ERC20Capped_init_unchained(initialSupply);

        _mint(msg.sender, initialSupply);
    }
}
