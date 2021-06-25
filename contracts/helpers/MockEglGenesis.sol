pragma solidity 0.6.6;

contract MockEglGenesis {
    uint public cumulativeBalance;
    bool public canContribute;
    bool public canWithdraw;
    address public owner;
    address[] public contributorsList;    
    mapping(address => Contributor) public contributors;

    struct Contributor {
        uint amount;
        uint cumulativeBalance;
        uint idx;
        uint date;
    }

    constructor(address _owner) public {
        owner = _owner;
    }

    receive() external payable {
        cumulativeBalance = cumulativeBalance + msg.value;
        contributorsList.push(msg.sender);

        Contributor storage contributor = contributors[msg.sender];
        contributor.amount = msg.value;
        contributor.cumulativeBalance = cumulativeBalance;
        contributor.idx = contributorsList.length;
        contributor.date = now;
    }

    function setCanContribute(bool _canContribute) external {
        canContribute = _canContribute;
    }

    function setCanWithdraw(bool _canWithdraw) external {
        canWithdraw = _canWithdraw;
    }
}