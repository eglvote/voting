pragma solidity ^0.6.0;

import './EglToken.sol';

import '@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/math/Math.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol';

contract EglContract is Initializable, OwnableUpgradeSafe {
    using Math for *;
    using SafeMath for *;

    uint constant DECIMAL_PRECISION = 10**18;
    uint8 constant WEEKS_IN_YEAR = 52;
    uint24 constant SECONDS_IN_WEEK = 604800;
    uint24 constant SECONDS_IN_DAY = 86400;
    uint constant DAO_RECIPIENT_MAX_AMOUNT = 5000000000000000000000000;
    uint constant DAO_RECIPIENT_MIN_AMOUNT = 1000000000000000000;
    uint constant REWARD_MULTIPLIER = 544267054000000000000000;

    EglToken public token;
    uint public desiredEgl;
    uint public previousEpochEgl;
    uint public baselineEgl;
    uint public tokensInCirculation;

    mapping(address => Voter) public voters;
    mapping(DesiredChange => uint[8]) public directionVoteCount;

    enum DesiredChange {UP,SAME,DOWN}

    uint16 public currentEpoch;
    uint public currentEpochStartDate;

    uint[520] public voterRewardSums;
    uint[8] public votesTotal;

    struct Voter {
        uint16 voteEpoch;
        uint8 lockupDuration;
        uint releaseDate;
        uint tokensLocked;
        DesiredChange desiredChange;
        address daoRecipient;
        uint daoAmount;
        address upgradeAddress;
        bool active;
    }

    event Vote(
        address caller,
        DesiredChange desiredChange,
        uint epochVotesUp,
        uint epochVotesSame,
        uint epochVotesDown,
        uint epochVoterRewardSum,
        uint epochTotalVotes,
        uint date
    );
    event ReVote(address caller, DesiredChange desiredChange, uint date);
    event Withdraw(
        address caller,
        uint tokensLocked,
        uint rewardTokens,
        DesiredChange desiredChange,
        uint epochVotesUp,
        uint epochVotesSame,
        uint epochVotesDown,
        uint epochVoterRewardSum,
        uint epochTotalVotes,
        uint date
    );
    event VotesTallied(address caller, uint currentEpoch, uint nextEpoch, uint date);

    function initialize(EglToken _token) public initializer {
        require(
            address(_token) != address(0),
            "EGL: Token address cannot be 0"
        );

        token = _token;
        desiredEgl = 13000000;

        baselineEgl = 12500000;
        previousEpochEgl = 12500000;
        currentEpoch = 0;
        currentEpochStartDate = block.timestamp;
        tokensInCirculation = 0;
    }

    function vote(
        uint8 _desiredChange,
        uint _eglAmount,
        uint8 _lockupDuration,
        address _daoRecipient,
        uint _daoAmount,
        address _upgradeAddress
    ) public {
        require(
            token.allowance(msg.sender, address(this)) >= _eglAmount,
            "EGL: EGL contract has insufficient token allowance"
        );
        token.transferFrom(msg.sender, address(this), _eglAmount);

        _internalVote(_desiredChange, _eglAmount, _lockupDuration, _daoRecipient, _daoAmount, _upgradeAddress, 0);
    }

    function reVote(
        uint8 _desiredChange,
        uint _eglAmount,
        uint8 _lockupDuration,
        address _daoRecipient,
        uint _daoAmount,
        address _upgradeAddress
    ) public {
        require(voters[msg.sender].active == true, "EGL: Address has not yet voted");
        _eglAmount += _internalWithdraw();
        _internalVote(_desiredChange, _eglAmount, _lockupDuration, _daoRecipient, _daoAmount, _upgradeAddress, voters[msg.sender].releaseDate);
        emit ReVote(msg.sender, DesiredChange(_desiredChange), now);
    }

    function withdraw() public {
        require(voters[msg.sender].active == true, "EGL: Address has not voted");
        require(block.timestamp > voters[msg.sender].releaseDate, "EGL: Tokens can only be withdrawn after the release date");
        token.transfer(msg.sender, _internalWithdraw());
    }

    function tallyVotes() public {
        emit VotesTallied(msg.sender, currentEpoch, currentEpoch.add(1), now);
        // TODO: Check that its been a week since last call
        currentEpoch += 1;
        currentEpochStartDate = block.timestamp;
    }

    function _internalVote(
        uint8 _desiredChange,
        uint _eglAmount,
        uint8 _lockupDuration,
        address _daoRecipient,
        uint _daoAmount,
        address _upgradeAddress,
        uint _releaseTime
    ) private {
        require(voters[msg.sender].active == false, "EGL: Address has already voted");
        require(
            _desiredChange == uint8(DesiredChange.UP) ||
            _desiredChange == uint8(DesiredChange.SAME) ||
            _desiredChange == uint8(DesiredChange.DOWN),
            "EGL: Invalid vote proposal"
        );
        require(
            _eglAmount > 1 * DECIMAL_PRECISION ||
            _eglAmount <= token.balanceOf(msg.sender),
            "EGL: Address has an insufficient EGL balance"
        );
        require(
            _lockupDuration >= 1 ||
            _lockupDuration <= 8,
            "EGL: Invalid lockup duration. Should be between 1 and 8"
        );
        require(
            block.timestamp < currentEpochStartDate.add(SECONDS_IN_WEEK).sub(SECONDS_IN_DAY),
            "EGL: Votes not allowed within 24 hours of the end of the voting period"
        );

        if (block.timestamp > currentEpochStartDate.add(SECONDS_IN_WEEK)) {
            tallyVotes();
        }

        uint updatedReleaseDate = block.timestamp.add(_lockupDuration.mul(SECONDS_IN_WEEK)).max(_releaseTime);

        Voter storage _voter = voters[msg.sender];
        _voter.voteEpoch = currentEpoch;
        _voter.lockupDuration = _lockupDuration;
        _voter.releaseDate = updatedReleaseDate;
        _voter.tokensLocked = _eglAmount;
        _voter.desiredChange = DesiredChange(_desiredChange);
        _voter.daoRecipient = _daoRecipient;
        _voter.daoAmount = _daoAmount;
        _voter.upgradeAddress = _upgradeAddress;
        _voter.active = true;

        _addVote(DesiredChange(_desiredChange), _lockupDuration, _eglAmount);

        emit Vote(
            msg.sender,
            DesiredChange(_desiredChange),
            directionVoteCount[DesiredChange.UP][currentEpoch],
            directionVoteCount[DesiredChange.SAME][currentEpoch],
            directionVoteCount[DesiredChange.DOWN][currentEpoch],
            voterRewardSums[currentEpoch],
            votesTotal[currentEpoch],
            now
        );
    }

    function _internalWithdraw() private returns (uint) {
        Voter storage voter = voters[msg.sender];
        uint16 voterEpoch = voter.voteEpoch;
        uint originalEglAmount = voter.tokensLocked;
        uint8 lockupDuration = voter.lockupDuration;
        DesiredChange desiredChange = voter.desiredChange;
        delete voters[msg.sender];

        uint voteWeight = originalEglAmount.mul(lockupDuration);
        uint voterReward = 0;
        for (uint16 i = voterEpoch; i < voterEpoch.add(lockupDuration).min(currentEpoch).min(WEEKS_IN_YEAR); i++) {
            voterReward += (voteWeight.mul(REWARD_MULTIPLIER).mul(WEEKS_IN_YEAR.sub(i))).div(voterRewardSums[i]);
        }

        _removeVote(desiredChange, lockupDuration, originalEglAmount, voteWeight, voterEpoch);

        emit Withdraw(
            msg.sender,
            originalEglAmount,
            voterReward,
            desiredChange,
            directionVoteCount[DesiredChange.UP][currentEpoch],
            directionVoteCount[DesiredChange.SAME][currentEpoch],
            directionVoteCount[DesiredChange.DOWN][currentEpoch],
            voterRewardSums[currentEpoch],
            votesTotal[currentEpoch],
            now
        );
        return originalEglAmount.add(voterReward);
    }

    function _removeVote(
        DesiredChange _desiredChange,
        uint8 _lockupDuration,
        uint _originalEglAmount,
        uint _voteWeight,
        uint _voterEpoch
    ) private {
        uint voterInterval = _voterEpoch.add(_lockupDuration);
        uint affectedEpochs = currentEpoch < voterInterval ? voterInterval.sub(currentEpoch) : 0;
        // TODO: Use SafeMath instead of -= and += to avoid potential overflows
        for (uint8 i = 0; i < affectedEpochs; i++) {
            directionVoteCount[_desiredChange][i] -= _voteWeight;
            if (_voterEpoch.add(i) <= WEEKS_IN_YEAR) {
                voterRewardSums[_voterEpoch.add(i)] -= _voteWeight;
            }
            votesTotal[i] -= _originalEglAmount;
        }
    }

    function _addVote(DesiredChange _desiredChangeDirection, uint8 _lockupDuration, uint _eglAmount) private {
        uint voteWeight = _eglAmount.mul(_lockupDuration);
        // TODO: Use SafeMath instead of -= and += to avoid potential overflows
        for (uint8 i = 0; i < _lockupDuration; i++) {
            directionVoteCount[_desiredChangeDirection][i] += voteWeight;
            if (currentEpoch.add(i) <= WEEKS_IN_YEAR)
                voterRewardSums[currentEpoch.add(i)] += voteWeight;
            votesTotal[i] += _eglAmount;
        }
    }
}
