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
    uint constant WEEKS_IN_YEAR = 52;
    uint constant SECONDS_IN_WEEK = 604800;
    uint constant SECONDS_IN_DAY = 86400;
    uint constant DAO_RECIPIENT_MAX_AMOUNT = 5000000000000000000000000;
    uint constant DAO_RECIPIENT_MIN_AMOUNT = 1000000000000000000;
    uint constant REWARD_MULTIPLIER = 544267054000000000000000;

    EglToken public token;
    uint public desiredEgl;
    uint public previousEpochEgl;
    uint public baselineEgl;
    uint public tokensInCirculation;

    uint public testVar;

    mapping(address => Voter) public voters;

    enum DesiredChange {UP,SAME,DOWN}

    uint16 private currentEpoch;
    uint private currentEpochStartDate;
    uint[520] public voterRewardSums;

    uint[8] public votesUp;
    uint[8] public votesSame;
    uint[8] public votesDown;
    uint[8] public votesTotal;

    struct Voter {
        uint voteEpoch;
        uint lockupDuration;
        uint releaseDate;
        uint tokensLocked;
        DesiredChange desiredChange;
        address daoRecipient;
        uint daoAmount;
        address upgradeAddress;
        bool active;
    }

    event Vote(address caller, DesiredChange desiredChange, uint epochVotesUp, uint epochVotesSame, uint epochVotesDown, uint epochVoterRewardSum, uint epochTotalVotes, uint date);
    event ReVote(address caller, DesiredChange desiredChange, uint date);
    event DebugWithdraw(address caller, uint epochVoterReward);
    event Withdraw(address caller, uint amountWithdrawn, DesiredChange desiredChange, uint epochVotesUp, uint epochVotesSame, uint epochVotesDown, uint epochVoterRewardSum, uint epochTotalVotes, uint date);
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

    function vote(uint _desiredChange, uint _eglAmount, uint _lockupDuration, address _daoRecipient, uint _daoAmount, address _upgradeAddress) public {
        _internalVote(_desiredChange, _eglAmount, _lockupDuration, _daoRecipient, _daoAmount, _upgradeAddress, 0);
    }

    function reVote(uint _desiredChange, uint _eglAmount, uint _lockupDuration, address _daoRecipient, uint _daoAmount, address _upgradeAddress) public {
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
        uint _desiredChange,
        uint _eglAmount,
        uint _lockupDuration,
        address _daoRecipient,
        uint _daoAmount,
        address _upgradeAddress,
        uint _releaseTime
    ) private {
        require(voters[msg.sender].active == false, "EGL: Address has already voted");
        require(
            _desiredChange == uint(DesiredChange.UP) ||
            _desiredChange == uint(DesiredChange.SAME) ||
            _desiredChange == uint(DesiredChange.DOWN),
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
        require(
            token.allowance(msg.sender, address(this)) >= _eglAmount,
            "EGL: EGL contract has insufficient allowance"
        );

        token.transferFrom(msg.sender, address(this), _eglAmount);

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

        if (DesiredChange(_desiredChange) == DesiredChange.UP)
            _countVote(votesUp, _lockupDuration, _eglAmount);
        else if (DesiredChange(_desiredChange) == DesiredChange.SAME)
            _countVote(votesSame, _lockupDuration, _eglAmount);
        else if (DesiredChange(_desiredChange) == DesiredChange.DOWN)
            _countVote(votesDown, _lockupDuration, _eglAmount);

        emit Vote(msg.sender, DesiredChange(_desiredChange), votesUp[currentEpoch], votesSame[currentEpoch], votesDown[currentEpoch], voterRewardSums[currentEpoch], votesTotal[currentEpoch], now);
    }

    function _internalWithdraw() private returns (uint) {
        Voter storage voter = voters[msg.sender];
        uint voterEpoch = voter.voteEpoch;
        uint eglAmount = voter.tokensLocked;
        uint lockupDuration = voter.lockupDuration;
        DesiredChange desiredChange = voter.desiredChange;

        delete voters[msg.sender];

        // TODO: Make sure this calculation for `affectedEpochs` is correct
        // TODO: Fix types since this will fail if currentEpoch > voterEpoch + lockupDuration (overflow)
        uint affectedEpochs = voterEpoch.add(lockupDuration).sub(currentEpoch);
        uint voteWeight = eglAmount.mul(lockupDuration);

        if (desiredChange == DesiredChange.UP)
            _removeVote(votesUp, affectedEpochs,  eglAmount, voteWeight, voterEpoch);
        else if (desiredChange == DesiredChange.SAME)
            _removeVote(votesSame, affectedEpochs, eglAmount, voteWeight, voterEpoch);
        else if (desiredChange == DesiredChange.DOWN)
            _removeVote(votesDown, affectedEpochs, eglAmount, voteWeight, voterEpoch);

        uint loopBound = voterEpoch.add(lockupDuration).min(currentEpoch).min(WEEKS_IN_YEAR);
        for (uint i = voterEpoch; i < loopBound; i++) {
            uint epochVoterReward = (voteWeight.div(voterRewardSums[i])).mul(REWARD_MULTIPLIER).mul(WEEKS_IN_YEAR.sub(i));
            emit DebugWithdraw(msg.sender, epochVoterReward);
            eglAmount += epochVoterReward;
        }
        emit Withdraw(msg.sender, eglAmount, desiredChange, votesUp[currentEpoch], votesSame[currentEpoch], votesDown[currentEpoch], voterRewardSums[currentEpoch], votesTotal[currentEpoch], now);
        return eglAmount;
    }

    function _removeVote(uint[8] storage _voteDirectionArray, uint _affectedEpochs, uint _eglAmount, uint _voteWeight, uint _voterEpoch) private {
        for (uint8 i = 0; i < _affectedEpochs; i++) {
            _voteDirectionArray[i] -= _voteWeight;
            if (_voterEpoch + i < WEEKS_IN_YEAR) {
                voterRewardSums[_voterEpoch + i] -= _voteWeight;
            }
            votesTotal[i] -= _eglAmount;
        }
    }

    function _countVote(uint[8] storage _voteDirectionArray, uint _lockupDuration, uint _eglAmount) private {
        uint voteWeight = _eglAmount.mul(_lockupDuration);
        for (uint8 i = 0; i < _lockupDuration; i++) {
            _voteDirectionArray[i] += voteWeight;
            if (currentEpoch + i <= WEEKS_IN_YEAR)
                voterRewardSums[currentEpoch + i] += voteWeight;
            votesTotal[i] += _eglAmount;
        }
    }
}
