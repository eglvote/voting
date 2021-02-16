pragma solidity ^0.6.0;

import "../EglContract.sol";

contract TestableEglContract is EglContract {
    event PercentageCalculated(uint percentage);

    function internalVote(
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

    function internalWithdraw(address _voter) external {
        _internalWithdraw(_voter);
    }

    function fundSeedAccounts(address[] calldata _seedAccounts) external  {
        _fundSeedAccounts(_seedAccounts);
    }

    function issueCreatorRewards() external {
        _issueCreatorRewards();
    }

    function calculateBlockReward(int _blockGasLimit) external {
        _calculateBlockReward(_blockGasLimit);
    }

    function calculatePercentageOfTokensInCirculation(uint _itemTotal, uint _tokensInCirculation) external {
        tokensInCirculation = _tokensInCirculation;
        uint percentage = _calculatePercentageOfTokensInCirculation(_itemTotal);
        emit PercentageCalculated(percentage);
    }

    function tallyDaoVotes() external {
        _tallyDaoVotes();
    }

    function tallyUpgradeVotes() external {
        _tallyUpgradeVotes();
    }

    function addUpgradeCandidateVote(
        address _candidateAddress, 
        uint _eglAmount
    ) external {
        _addCandidateVote(_candidateAddress, upgradeCandidateList, _eglAmount, 0);
    }

    function removeUpgradeCandidateVote(
        address _candidateAddress, 
        uint _eglAmount
    ) external {
        _removeCandidateVote(_candidateAddress, upgradeCandidateList, _eglAmount, 0);
    }

    function addDaoCandidateVote(
        address _candidateAddress, 
        uint _eglAmount,
        uint _amountSum
    ) external {
        _addCandidateVote(_candidateAddress, daoCandidateList, _eglAmount, _amountSum);
    }

    function removeDaoCandidateVote(
        address _candidateAddress, 
        uint _eglAmount, 
        uint _amountSum
    ) external {
        _removeCandidateVote(_candidateAddress, daoCandidateList, _eglAmount, _amountSum);
    }

    function evaluateUpgradeVote() external {
        _evaluateCandidateVote(upgradeCandidateList);
    }

    function evaluateDaoVote() external {
        _evaluateCandidateVote(daoCandidateList);
    }

    function addPairLiquidity(uint _ethAmount, uint _desiredTokenAmount) external {
        _addPairLiquidity(_ethAmount, _desiredTokenAmount);
    }
}