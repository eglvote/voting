pragma solidity 0.6.6;

import "../EglContractV2.sol";

contract TestableEglContractV2 is EglContractV2 {
    event PercentageCalculated(uint percentage);
    event SerializedEglCalculated(uint serializedEgl);
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

    function issueCreatorRewards(uint _timePassedSinceOrigin) external {
        _issueCreatorRewards(_timePassedSinceOrigin);
    }

    function calculateSerializedEgl(uint _timePassedSinceOrigin, uint _maxSupply, uint _timeLocked) external {
        uint releasedEgl = _calculateSerializedEgl(_timePassedSinceOrigin, _maxSupply, _timeLocked);
        emit SerializedEglCalculated(releasedEgl);
    }
    
    function calculateCurrentPoolTokensDue(
        uint _currentEgl, 
        uint _firstEgl, 
        uint _lastEgl, 
        uint _totalPoolTokens
    ) external {
        uint poolTokensDue = _calculateCurrentPoolTokensDue(_currentEgl, _firstEgl, _lastEgl, _totalPoolTokens);
        emit PoolTokensDueCalculated(poolTokensDue);
    }

    function calculateBonusEglsDue(uint _firstEgl, uint _lastEgl) external {
        uint bonusEglsDue = _calculateBonusEglsDue(_firstEgl, _lastEgl);
        emit BonusEglsDueCalculated(bonusEglsDue);
    }

    function calculateVoterReward(
        address _voter,
        uint16 _currentEpoch,
        uint16 _voterEpoch,
        uint8 _lockupDuration,
        uint _voteWeight
    ) external {
        _calculateVoterReward(_voter, _currentEpoch, _voterEpoch, _lockupDuration, _voteWeight);
    }

    function calculatePercentageOfTokensInCirculation(uint _itemTotal, uint _tokensInCirculation) external {
        tokensInCirculation = _tokensInCirculation;
        uint percentage = _calculatePercentageOfTokensInCirculation(_itemTotal);
        emit PercentageCalculated(percentage);
    }

    function distributePoolRewards(uint256 _blockNumber) external {
        _distributePoolRewards(_blockNumber);
    }

    function mockMinerData(
        address[] calldata _minerAddresses, 
        uint256[] calldata _totalDeltas, 
        uint256[] calldata _sampleCounts
    ) 
        external 
    {
        for (uint16 i = 0; i < _minerAddresses.length; i++) {
            minerAddressList.push(_minerAddresses[i]);

            MinerSample storage _miner = minerSamples[_minerAddresses[i]];
            _miner.sampleCount = _sampleCounts[i];
            _miner.totalDelta = _totalDeltas[i];
        }
    }
}