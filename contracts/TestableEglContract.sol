pragma solidity ^0.6.0;

import "./EglContract.sol";

contract TestableEglContract is EglContract {
    function test_internalVote(
        address _voter,
        uint _gasTarget,
        uint _eglAmount,
        uint8 _lockupDuration,
        address _daoRecipient,
        uint _daoAmount,
        address _upgradeAddress,
        uint _releaseTime
    ) external {
        _internalVote(
            _voter,
            _gasTarget,
            _eglAmount,
            _lockupDuration,
            _daoRecipient,
            _daoAmount,
            _upgradeAddress,
            _releaseTime
        );
    }

    function test_internalWithdraw() public {
        _internalWithdraw();
    }

    function test_addUpgradeCandidateVote(
        address _candidateAddress, 
        uint _eglAmount
    ) public {
        _addCandidateVote(_candidateAddress, upgradeCandidateList, _eglAmount, 0);
    }

    function test_removeUpgradeCandidateVote(
        address _candidateAddress, 
        uint _eglAmount
    ) public {
        _removeCandidateVote(_candidateAddress, upgradeCandidateList, _eglAmount, 0);
    }

    function test_addDaoCandidateVote(
        address _candidateAddress, 
        uint _eglAmount,
        uint _amountSum
    ) public {
        _addCandidateVote(_candidateAddress, daoCandidateList, _eglAmount, _amountSum);
    }

    function test_removeDaoCandidateVote(
        address _candidateAddress, 
        uint _eglAmount, 
        uint _amountSum
    ) public {
        _removeCandidateVote(_candidateAddress, daoCandidateList, _eglAmount, _amountSum);
    }

    function test_evaluateUpgradeVote() external {
        _evaluateCandidateVote(upgradeCandidateList);
    }

    function test_evaluateDaoVote() external {
        _evaluateCandidateVote(daoCandidateList);
    }

    function test_addPairLiquidity(uint _ethAmount, uint _desiredTokenAmount) external returns (uint tokensReceived) {
        tokensReceived = _addPairLiquidity(_ethAmount, _desiredTokenAmount);
    }
}