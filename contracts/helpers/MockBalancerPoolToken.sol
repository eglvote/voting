pragma solidity 0.6.6;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract MockBalancerPoolToken is Initializable, ERC20Upgradeable {

    function initialize(
        string memory name, 
        string memory symbol, 
        uint256 initialSupply
    ) 
        public 
        initializer
    {
        __ERC20_init(name, symbol);
        _mint(msg.sender, initialSupply);
    }
}