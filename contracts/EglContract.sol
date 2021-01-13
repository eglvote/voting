pragma solidity ^0.6.0;

import './EglToken.sol';

import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/Math.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract EglContract is Initializable, OwnableUpgradeSafe {
    /************** LIBRARIES **************/
    using Math for *;
    using SafeMath for *;

    /************** CONSTANTS **************/
    uint8 constant WEEKS_IN_YEAR = 52;
    uint24 constant EPOCH_LENGTH = 1 weeks;
    uint32 constant GAS_LIMIT_CHANGE = 1000000;
    uint constant DAO_RECIPIENT_MIN_AMOUNT = 1 ether;
    uint constant DAO_RECIPIENT_MAX_AMOUNT = 5000000 ether;
    uint constant VOTER_REWARD_MULTIPLIER = 544267.054 ether;

    /************** PUBLIC STATE VARIABLES **************/
    EglToken public token;

    uint16 public currentEpoch;
    uint public currentEpochStartDate;
    uint public desiredEgl;
    uint public baselineEgl;
    uint public initialEgl;
    uint public tokensInCirculation;
    uint public remainingPoolReward;

    uint[520] public voterRewardSums;
    uint[8] public votesTotal;

    enum DesiredChange {UP, SAME, DOWN}

    mapping(address => Voter) public voters;
    mapping(DesiredChange => uint[8]) public directionVoteCount;

    struct Voter {
        uint8 lockupDuration;
        uint16 voteEpoch;
        uint releaseDate;
        uint tokensLocked;
        DesiredChange desiredChange;
        address daoRecipient;
        uint daoAmount;
        address upgradeAddress;
    }

    /************** PRIVATE STATE VARIABLES **************/
    IUniswapV2Router02 private uniSwapRouter;
    address private uniSwapFactory;

    uint24 private votingPauseSeconds;
    uint private epochGasLimitSum;
    uint private epochVoteCount;
    uint private latestRewardSwept;

    /************** EVENTS **************/
    event Vote(
        address caller,
        DesiredChange desiredChange,
        uint epochVotesUp,
        uint epochVotesSame,
        uint epochVotesDown,
        uint epochVoterRewardSum,
        uint epochTotalVotes,
        address daoRecipient,
        uint daoAmount,
        address upgradeAddress,
        uint date
    );
    event ReVote(address caller, DesiredChange desiredChange, uint eglAmount, uint date);
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
    event VotesTallied(
        address caller,
        uint currentEpoch,
        uint nextEpoch,
        uint totalVotesUp,
        uint totalVotesSame,
        uint totalVotesDown,
        uint date
    );

    /************** MODIFIERS **************/
    modifier validateTokenBalances(uint _eglAmount) {
        require(
            _eglAmount > 1 ether ||
            _eglAmount <= token.balanceOf(msg.sender),
            "EGL: Address has an insufficient EGL balance"
        );
        require(
            token.allowance(msg.sender, address(this)) >= _eglAmount,
            "EGL: EGL contract has insufficient token allowance"
        );
        _;
    }

    /**
     * @dev Initialized contract variables
     * @param _token Address of the EGL token
     * @param _factory Address of the Uniswap Factory
     * @param _router Address of the Uniswap Router
     * @param _currentEpochStartDate Start date for the first epoch
     * @param _votingPauseSeconds Number of seconds to pause voting before votes are tallied
     */
    function initialize(
        EglToken _token,
        address _factory,
        IUniswapV2Router02 _router,
        uint _currentEpochStartDate,
        uint24 _votingPauseSeconds
    ) public initializer {
        require(
            address(_token) != address(0),
            "EGL: Token address cannot be 0"
        );

        token = _token;
        uniSwapFactory = _factory;
        uniSwapRouter = _router;
        currentEpochStartDate = _currentEpochStartDate;
        votingPauseSeconds = _votingPauseSeconds;

        initialEgl = 12500000;
        desiredEgl = 13000000;
        baselineEgl = 12500000;
        currentEpoch = 0;
        tokensInCirculation = 0;
        remainingPoolReward = 1500000000 ether;

        epochGasLimitSum = 0;
        epochVoteCount = 0;
        latestRewardSwept = 0;
    }

    /**
     * @dev Vote
     */
    function vote(
        uint8 _desiredChange,
        uint _eglAmount,
        uint8 _lockupDuration,
        address _daoRecipient,
        uint _daoAmount,
        address _upgradeAddress
    ) public validateTokenBalances(_eglAmount) {
        token.transferFrom(msg.sender, address(this), _eglAmount);
        _internalVote(_desiredChange, _eglAmount, _lockupDuration, _daoRecipient, _daoAmount, _upgradeAddress, 0);
    }

    /**
     * @dev Re-Vote
     */
    function reVote(
        uint8 _desiredChange,
        uint _eglAmount,
        uint8 _lockupDuration,
        address _daoRecipient,
        uint _daoAmount,
        address _upgradeAddress
    ) public validateTokenBalances(_eglAmount) {
        require(
            voters[msg.sender].tokensLocked > 0,
            "EGL: Address has not yet voted"
        );
        token.transferFrom(msg.sender, address(this), _eglAmount);
        _eglAmount += _internalWithdraw();
        _internalVote(
            _desiredChange,
            _eglAmount,
            _lockupDuration,
            _daoRecipient,
            _daoAmount,
            _upgradeAddress,
            voters[msg.sender].releaseDate
        );
        emit ReVote(msg.sender, DesiredChange(_desiredChange), _eglAmount, now);
    }

    /**
     * @dev Withdraw
     */
    function withdraw() public {
        require(
            voters[msg.sender].tokensLocked > 0,
            "EGL: Address has not voted"
        );
        require(
            block.timestamp > voters[msg.sender].releaseDate,
            "EGL: Tokens can only be withdrawn after the release date"
        );
        token.transfer(msg.sender, _internalWithdraw());
    }

    /**
     * @dev Tally Votes
     */
    function tallyVotes() public {
        require(
            block.timestamp > currentEpochStartDate.add(EPOCH_LENGTH),
            "EGL: Current voting period has not yet ended"
        );
        currentEpoch += 1;
        currentEpochStartDate += EPOCH_LENGTH;

        /***************** <WIP> ******************/
        uint votingThreshold = 0.1 ether;
	    if (currentEpoch > WEEKS_IN_YEAR)
		    votingThreshold = currentEpoch.mul(10**18).div(520).min(500000000000000000);

        uint epochTotalUp = directionVoteCount[DesiredChange.UP][0];
        uint epochTotalDown = directionVoteCount[DesiredChange.DOWN][0];
        uint epochTotalSame = directionVoteCount[DesiredChange.SAME][0];

        if ((votesTotal[0].div(tokensInCirculation)) >= votingThreshold) {
            epochGasLimitSum += block.gaslimit;
            epochVoteCount += 1;
            baselineEgl = epochGasLimitSum.div(epochVoteCount);
            if (epochTotalUp > epochTotalDown && epochTotalUp > epochTotalSame)
                desiredEgl = baselineEgl.add(GAS_LIMIT_CHANGE);
            else if (epochTotalDown > epochTotalUp && epochTotalDown > epochTotalSame)
                desiredEgl = baselineEgl.sub(GAS_LIMIT_CHANGE);
            else
                desiredEgl = baselineEgl;
        } else
            desiredEgl = baselineEgl + (initialEgl - desiredEgl) * 95 / 100;


        // move values 1 slot earlier and put a '0' at the last slot
        for (uint8 i = 0; i < 7; i++) {
            for (uint8 j = 0; j < 3; j++) {
                directionVoteCount[DesiredChange(j)][i] = directionVoteCount[DesiredChange(j)][i + 1];
            }
            votesTotal[i] = votesTotal[i + 1];
        }
        for (uint8 j = 0; j < 3; j++) {
            directionVoteCount[DesiredChange(j)][7] = 0;
        }
        /***************** </WIP> ******************/

        epochGasLimitSum = 0;
        epochVoteCount = 0;
        votesTotal[7] = 0;

        emit VotesTallied(
            msg.sender,
            currentEpoch.sub(1),
            currentEpoch,
            epochTotalUp,
            epochTotalSame,
            epochTotalDown,
            now
        );
    }

    function sweepPoolRewards() public {
        require(
            block.number > latestRewardSwept,
            "EGL: pool reward already swept"
        );
        latestRewardSwept = block.number;

        /***************** <WIP> ******************/
        uint potentialBlockReward = remainingPoolReward / (2**22);
        uint blockReward = 0;

        uint diff = block.gaslimit < desiredEgl ? desiredEgl.sub(block.gaslimit) : block.gaslimit.sub(desiredEgl);
        if (diff > 1000000) {
            blockReward = (25 + diff.div(1000000).mul(75)).div(100).mul(potentialBlockReward);
        }

        // 25% of award determined if in the right direction
        /***************** </WIP> ******************/
        remainingPoolReward -= blockReward;
        tokensInCirculation += blockReward;

        token.transfer(block.coinbase, blockReward);
    }

    /**
     * @dev Internal Vote
     */
    function _internalVote(
        uint8 _desiredChange,
        uint _eglAmount,
        uint8 _lockupDuration,
        address _daoRecipient,
        uint _daoAmount,
        address _upgradeAddress,
        uint _releaseTime
    ) private {
        require(voters[msg.sender].tokensLocked == 0, "EGL: Address has already voted");
        require(
            _desiredChange == uint8(DesiredChange.UP) ||
            _desiredChange == uint8(DesiredChange.SAME) ||
            _desiredChange == uint8(DesiredChange.DOWN),
            "EGL: Invalid vote proposal"
        );
        require(
            _lockupDuration >= 1 ||
            _lockupDuration <= 8,
            "EGL: Invalid lockup duration. Should be between 1 and 8"
        );
        require(
            block.timestamp < currentEpochStartDate.add(EPOCH_LENGTH).sub(votingPauseSeconds),
            "EGL: Votes not allowed within sp close to end of voting period"
        );

        if (block.timestamp > currentEpochStartDate.add(EPOCH_LENGTH)) {
            tallyVotes();
        }

        epochGasLimitSum += block.gaslimit;
        epochVoteCount += 1;

        uint updatedReleaseDate = block.timestamp.add(_lockupDuration.mul(EPOCH_LENGTH)).max(_releaseTime);

        Voter storage _voter = voters[msg.sender];
        _voter.voteEpoch = currentEpoch;
        _voter.lockupDuration = _lockupDuration;
        _voter.releaseDate = updatedReleaseDate;
        _voter.tokensLocked = _eglAmount;
        _voter.desiredChange = DesiredChange(_desiredChange);
        _voter.daoRecipient = _daoRecipient;
        _voter.daoAmount = _daoAmount;
        _voter.upgradeAddress = _upgradeAddress;

        _addVote(DesiredChange(_desiredChange), _lockupDuration, _eglAmount);

        emit Vote(
            msg.sender,
            DesiredChange(_desiredChange),
            directionVoteCount[DesiredChange.UP][currentEpoch],
            directionVoteCount[DesiredChange.SAME][currentEpoch],
            directionVoteCount[DesiredChange.DOWN][currentEpoch],
            voterRewardSums[currentEpoch],
            votesTotal[currentEpoch],
            _daoRecipient,
            _daoAmount,
            _upgradeAddress,
            now
        );
    }

    /**
     * @dev Internal Withdraw
     */
    function _internalWithdraw() private returns (uint) {
        Voter storage voter = voters[msg.sender];
        uint16 voterEpoch = voter.voteEpoch;
        uint originalEglAmount = voter.tokensLocked;
        uint8 lockupDuration = voter.lockupDuration;
        DesiredChange desiredChange = voter.desiredChange;
        delete voters[msg.sender];

        uint voteWeight = originalEglAmount.mul(lockupDuration);
        uint voterReward = 0;
        uint rewardEpochs = voterEpoch.add(lockupDuration).min(currentEpoch).min(WEEKS_IN_YEAR);
        for (uint16 i = voterEpoch; i < rewardEpochs; i++) {
            voterReward += (voteWeight.mul(VOTER_REWARD_MULTIPLIER).mul(WEEKS_IN_YEAR.sub(i))).div(voterRewardSums[i]);
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

    /**
     * @dev Internal remove vote
     */
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
            if (_voterEpoch.add(i) < WEEKS_IN_YEAR) {
                voterRewardSums[_voterEpoch.add(i)] -= _voteWeight;
            }
            votesTotal[i] -= _originalEglAmount;
        }
    }

    /**
     * @dev Internal add vote
     */
    function _addVote(DesiredChange _desiredChangeDirection, uint8 _lockupDuration, uint _eglAmount) private {
        uint voteWeight = _eglAmount.mul(_lockupDuration);
        // TODO: Use SafeMath instead of -= and += to avoid potential overflows
        for (uint8 i = 0; i < _lockupDuration; i++) {
            directionVoteCount[_desiredChangeDirection][i] += voteWeight;
            if (currentEpoch.add(i) < WEEKS_IN_YEAR)
                voterRewardSums[currentEpoch.add(i)] += voteWeight;
            votesTotal[i] += _eglAmount;
        }
    }
}
