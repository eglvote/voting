pragma solidity ^0.6.0;

import "../EglContract.sol";

contract TestableEglContract is EglContract {
    event PercentageCalculated(uint percentage);
    event CurrentEglCalculated(uint currentEgl);
    event PoolTokensDueCalculated(uint poolTokensDue);
    event BonusEglsDueCalculated(uint bonusEglsDue);

    function internalVote(
        address _voter,
        uint _gasTarget,
        uint _eglAmount,
        uint8 _lockupDuration,
        uint _releaseTime
    ) external {
        _internalVote(
            _voter,
            _gasTarget,
            _eglAmount,
            _lockupDuration,
            _releaseTime
        );
    }

    function internalWithdraw(address _voter) external {
        _internalWithdraw(_voter);
    }

    function fundSeedAccounts(
        address[] calldata _seedAccounts, 
        uint[] calldata _seedAmounts
    ) external  {
        _fundSeedAccounts(_seedAccounts, _seedAmounts);
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

    function calculateCurrentEgl(uint _timePassedSinceStart) external {
        uint currentEgl = _calculateCurrentEgl(_timePassedSinceStart);
        emit CurrentEglCalculated(currentEgl);
    }
    
    function calculateCurrentPoolTokensDue(
        uint _currentEgl, 
        uint _firstEgl, 
        uint _lastEgl, 
        uint _totalPoolTokens
    ) external {
        uint poolTokensDue = _calculateCurrentPoolTokensDue(
            _currentEgl, 
            _firstEgl, 
            _lastEgl, 
            _totalPoolTokens
        );
        emit PoolTokensDueCalculated(poolTokensDue);
    }

    function calculateBonusEglsDue(uint _firstEgl, uint _lastEgl) external {
        uint bonusEglsDue = _calculateBonusEglsDue(_firstEgl, _lastEgl);
        emit BonusEglsDueCalculated(bonusEglsDue);
    }
}