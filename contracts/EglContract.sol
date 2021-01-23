pragma solidity ^0.6.0;

import './EglToken.sol';
import "./libraries/Math.sol";

import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SignedSafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract EglContract is Initializable, OwnableUpgradeSafe {
    /************** LIBRARIES **************/
    using Math for *;
    using SafeMath for uint;
    using SafeMath for uint8;
    using SafeMath for uint16;
    using SignedSafeMath for int;

    /************** CONSTANTS **************/
    int constant GAS_LIMIT_CHANGE = 1000000;
    uint8 constant WEEKS_IN_YEAR = 52;
    uint8 constant CREATOR_REWARD_FIRST_EPOCH = 9;
    uint constant GAS_TARGET_TOLERANCE = 4000000;
    uint constant SEED_LOCKUP_PERIOD = 31536000;
    uint constant DECIMAL_PRECISION = 10**18;
    uint constant DAO_RECIPIENT_MIN_AMOUNT = 1 ether;
    uint constant DAO_RECIPIENT_MAX_AMOUNT = 5000000 ether;
    uint constant VOTER_REWARD_MULTIPLIER = 544267.054 ether;
    uint constant INITIAL_SEED_AMOUNT = 25000000 ether;

    /************** PUBLIC STATE VARIABLES **************/
    EglToken public token;

    int public desiredEgl;
    int public baselineEgl;
    int public initialEgl;

    uint16 public currentEpoch;
    uint public currentEpochStartDate;
    uint public tokensInCirculation;
    uint public remainingPoolReward;
    uint public remainingCreatorReward;

    uint[52] public voterRewardSums;
    uint[8] public votesTotal;
    uint[8] public voteWeightsSum;
    uint[8] public gasTargetSum;

    mapping(address => Voter) public voters;

    struct Voter {
        uint8 lockupDuration;
        uint16 voteEpoch;
        uint releaseDate;
        uint tokensLocked;
        uint gasTarget;
        address daoRecipient;
        uint daoAmount;
        address upgradeAddress;
    }

    /************** PRIVATE STATE VARIABLES **************/
    IUniswapV2Router02 private uniSwapRouter;
    address private uniSwapFactory;
    address private creatorRewardsAddress;

    int public epochGasLimitSum;
    int public epochVoteCount;

    uint24 private votingPauseSeconds;
    uint32 private epochLength;
    uint private latestRewardSwept;
    uint private weeklyCreatorRewardAmount;

    /************** EVENTS **************/
    event Vote(
        address caller,
        uint16 currentEpoch,
        uint gasTarget,
        uint eglAmount,
        uint8 lockupDuration,
        uint releaseDate,
        address daoRecipient,
        uint daoAmount,
        address upgradeAddress,
        uint epochVoteWeightSum,
        uint epochGasTargetSum,
        uint epochVoterRewardSum,
        uint epochTotalVotes,
        uint date
    );
    event NewVoteTotals(
        address caller,
        uint date
    );
    event ReVote(address caller, uint gasTarget, uint eglAmount, uint date);
    event Withdraw(
        address caller,
        uint16 currentEpoch,
        uint tokensLocked,
        uint releaseDate,
        uint rewardTokens,
        uint gasTarget,
        uint epochVoterRewardSum,
        uint epochTotalVotes,
        uint epochVoteWeightSum,
        uint epochGasTargetSum,
        uint date
    );
    event VotesTallied(
        address caller,
        uint16 currentEpoch,
        int desiredEgl,
        int averageGasTarget,
        uint votingThreshold,
        uint actualVotePercentage,
        uint date
    );
    event CreatorRewardsClaimed(
        address caller,
        address creatorRewardAddress,
        uint amountClaimed,
        uint remainingCreatorReward,
        uint16 currentEpoch,
        uint date
    );
    event VoteThresholdMet(
        address caller,
        uint16 currentEpoch,
        int desiredEgl,
        uint voteThreshold,
        uint actualVotePercentage,
        int gasLimitSum,
        int voteCount,
        int baselineEgl,
        uint date
    );
    event VoteThresholdFailed(
        address caller,
        uint16 currentEpoch,
        int desiredEgl,
        uint voteThreshold,
        uint actualVotePercentage,
        int baselineEgl,
        int initialEgl,
        uint date
    );
    event SeedAccountsFunded(address seedAddress, uint initialSeedAmount, uint seedAmountPerAccount, uint date);
    event VoterRewardCalculated(
        address voter,
        uint16 currentEpoch,
        uint voterReward,
        uint epochVoterReward,
        uint voteWeight,
        uint rewardMultiplier,
        uint weeksDiv,
        uint epochVoterRewardSum,
        uint date
    );

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
        uint24 _votingPauseSeconds,
        uint32 _epochLength,
        address[] memory _seedAccounts,
        address _creatorRewardsAccount
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
        epochLength = _epochLength;
        creatorRewardsAddress = _creatorRewardsAccount;

        initialEgl = 12500000;
        desiredEgl = 13000000;
        baselineEgl = 12500000;
        currentEpoch = 0;

        remainingPoolReward = 1500000000 ether;
        remainingCreatorReward = 500000000 ether;

        epochGasLimitSum = 0;
        epochVoteCount = 0;
        latestRewardSwept = 0;

        _seedInitialAccounts(_seedAccounts);
        weeklyCreatorRewardAmount = remainingCreatorReward.div(WEEKS_IN_YEAR.sub(CREATOR_REWARD_FIRST_EPOCH));
    }

    /**
     * @dev Vote
     */
    function vote(
        uint _gasTarget,
        uint _eglAmount,
        uint8 _lockupDuration,
        address _daoRecipient,
        uint _daoAmount,
        address _upgradeAddress
    ) public {
        require(_eglAmount >= 1 ether, "EGL: Amount of EGL's used to vote must be more than 1");
        require(_eglAmount <= token.balanceOf(msg.sender), "EGL: Address has an insufficient EGL balance");
        require(
            token.allowance(msg.sender, address(this)) >= _eglAmount,
            "EGL: EGL contract has insufficient token allowance"
        );
        token.transferFrom(msg.sender, address(this), _eglAmount);
        _internalVote(
            msg.sender,
            _gasTarget,
            _eglAmount,
            _lockupDuration,
            _daoRecipient,
            _daoAmount,
            _upgradeAddress,
            0
        );
    }

    /**
     * @dev Re-Vote
     */
    function reVote(
        uint _gasTarget,
        uint _eglAmount,
        uint8 _lockupDuration,
        address _daoRecipient,
        uint _daoAmount,
        address _upgradeAddress
    ) public {
        require(
            voters[msg.sender].tokensLocked > 0,
            "EGL: Address has not yet voted"
        );
        if (_eglAmount > 0) {
            require(_eglAmount >= 1 ether, "EGL: Amount of EGL's used to vote must be more than 1");
            require(_eglAmount <= token.balanceOf(msg.sender), "EGL: Address has an insufficient EGL balance");
            require(
                token.allowance(msg.sender, address(this)) >= _eglAmount,
                "EGL: EGL contract has insufficient token allowance"
            );
            token.transferFrom(msg.sender, address(this), _eglAmount);
        }
        uint originalReleaseDate = voters[msg.sender].releaseDate;
        _eglAmount = _eglAmount.add(_internalWithdraw());
        _internalVote(
            msg.sender,
            _gasTarget,
            _eglAmount,
            _lockupDuration,
            _daoRecipient,
            _daoAmount,
            _upgradeAddress,
            originalReleaseDate
        );
        emit ReVote(msg.sender, _gasTarget, _eglAmount, now);
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
            block.timestamp > currentEpochStartDate.add(epochLength),
            "EGL: Current voting period has not yet ended"
        );

        uint votingThreshold = 10 * DECIMAL_PRECISION;
	    if (currentEpoch >= WEEKS_IN_YEAR) {
            uint actualThreshold = currentEpoch.mul(DECIMAL_PRECISION).mul(10).div(WEEKS_IN_YEAR);
            votingThreshold = actualThreshold.umin(50 * DECIMAL_PRECISION);
        }

        int averageGasTarget = voteWeightsSum[0] > 0
            ? int(gasTargetSum[0].div(voteWeightsSum[0]))
            : 0;
        uint votePercentage = tokensInCirculation > 0
            ? votesTotal[0].mul(DECIMAL_PRECISION).div(tokensInCirculation).mul(100)
            : 0;
        if (votePercentage >= votingThreshold) {
            epochGasLimitSum = epochGasLimitSum.add(int(block.gaslimit));
            epochVoteCount = epochVoteCount.add(1);
            baselineEgl = epochGasLimitSum.div(epochVoteCount);

            desiredEgl = baselineEgl > averageGasTarget
                ? desiredEgl.sub(baselineEgl.sub(averageGasTarget).min(GAS_LIMIT_CHANGE))
                : desiredEgl.add(averageGasTarget.sub(baselineEgl).min(GAS_LIMIT_CHANGE));

            emit VoteThresholdMet(
                msg.sender,
                currentEpoch,
                desiredEgl,
                votingThreshold,
                votePercentage,
                epochGasLimitSum,
                epochVoteCount,
                baselineEgl,
                now
            );
        } else {
            desiredEgl = ((baselineEgl.add(initialEgl.sub(baselineEgl)).mul(95)).div(100));
            emit VoteThresholdFailed(
                msg.sender,
                currentEpoch,
                desiredEgl,
                votingThreshold,
                votePercentage,
                baselineEgl,
                initialEgl,
                now
            );
        }

        // move values 1 slot earlier and put a '0' at the last slot
        for (uint8 i = 0; i < 7; i++) {
            voteWeightsSum[i] = voteWeightsSum[i + 1];
            gasTargetSum[i] = gasTargetSum[i + 1];
            votesTotal[i] = votesTotal[i + 1];
        }
        voteWeightsSum[7] = 0;
        gasTargetSum[7] = 0;
        votesTotal[7] = 0;

        epochGasLimitSum = 0;
        epochVoteCount = 0;

        _assessCreatorReward();

        currentEpoch += 1;
        currentEpochStartDate = currentEpochStartDate.add(epochLength);

        emit VotesTallied(
            msg.sender,
            currentEpoch - 1,
            desiredEgl,
            averageGasTarget,
            votingThreshold,
            votePercentage,
            now
        );
    }

    function sweepPoolRewards() public {
        // TODO: Check if uniswap deployed. Fail silently if it hasn't
        require(
            block.number > latestRewardSwept,
            "EGL: Pool reward already swept"
        );
        latestRewardSwept = block.number;

        uint potentialBlockReward = remainingPoolReward.div(4000000);
        uint blockReward = 0;
        int blockGasLimit = int(block.gaslimit);
        int diff = blockGasLimit < desiredEgl ? desiredEgl.sub(blockGasLimit) : blockGasLimit.sub(desiredEgl);
        if (diff < GAS_LIMIT_CHANGE) {
            uint proximityRewardPercent = uint(GAS_LIMIT_CHANGE.sub(diff).mul(int(DECIMAL_PRECISION)).mul(75));
            blockReward = (25 * DECIMAL_PRECISION).add(proximityRewardPercent).mul(potentialBlockReward).div(100);
        }
        remainingPoolReward = remainingPoolReward.sub(blockReward);
        tokensInCirculation = tokensInCirculation.add(blockReward);

        // TODO: Make sure there are enough tokens to transfer
        token.transfer(block.coinbase, blockReward);
    }

    /**
     *   IMPORTANT!!!!!! REMOVE THIS FUNCTION AFTER TESTING
     */
    function giveTokens(address _recipient) public {
        uint tokenAmount = 50000000 ether;
        tokensInCirculation = tokensInCirculation.add(tokenAmount);
        token.transfer(_recipient, tokenAmount);
    }

    /**
     * @dev Internal Vote
     */
    function _internalVote(
        address _voter,
        uint _gasTarget,
        uint _eglAmount,
        uint8 _lockupDuration,
        address _daoRecipient,
        uint _daoAmount,
        address _upgradeAddress,
        uint _releaseTime
    ) private {
        require(voters[_voter].tokensLocked == 0, "EGL: Address has already voted");
        require(
            _gasTarget > block.gaslimit
            ? _gasTarget.sub(block.gaslimit) < GAS_TARGET_TOLERANCE
            : block.gaslimit.sub(_gasTarget) < GAS_TARGET_TOLERANCE,
            "EGL: GasTarget must be within 4M gas of current gas limit"
        );

        require(
            _lockupDuration >= 1 &&
            _lockupDuration <= 8,
            "EGL: Invalid lockup duration. Should be between 1 and 8"
        );
        if (block.timestamp > currentEpochStartDate.add(epochLength)) {
            tallyVotes();
        }
        require(
            block.timestamp < currentEpochStartDate.add(epochLength),
            "EGL: Too far away from current period, call tally votes to catch up"
        );
        require(
            block.timestamp < currentEpochStartDate.add(epochLength).sub(votingPauseSeconds),
            "EGL: Votes not allowed so close to end of voting period"
        );

        epochGasLimitSum = epochGasLimitSum.add(int(block.gaslimit));
        epochVoteCount = epochVoteCount.add(1);

        uint updatedReleaseDate = block.timestamp.add(_lockupDuration.mul(epochLength)).umax(_releaseTime);

        Voter storage voter = voters[_voter];
        voter.voteEpoch = currentEpoch;
        voter.lockupDuration = _lockupDuration;
        voter.releaseDate = updatedReleaseDate;
        voter.tokensLocked = _eglAmount;
        voter.gasTarget = _gasTarget;
        voter.daoRecipient = _daoRecipient;
        voter.daoAmount = _daoAmount;
        voter.upgradeAddress = _upgradeAddress;

        _addVote(_gasTarget, _lockupDuration, _eglAmount);

        emit Vote(
            _voter,
            currentEpoch,
            _gasTarget,
            _eglAmount,
            _lockupDuration,
            updatedReleaseDate,
            _daoRecipient,
            _daoAmount,
            _upgradeAddress,
            voteWeightsSum[0],
            gasTargetSum[0],
            currentEpoch < WEEKS_IN_YEAR ? voterRewardSums[currentEpoch]: 0,
            votesTotal[0],
            now
        );
        emit NewVoteTotals(
            _voter,
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
        uint releaseDate = voter.releaseDate;
        uint gasTarget = voter.gasTarget;
        delete voters[msg.sender];

        uint voteWeight = originalEglAmount.mul(lockupDuration);
        uint voterReward = 0;
        uint rewardEpochs = voterEpoch.add(lockupDuration).umin(currentEpoch).umin(WEEKS_IN_YEAR);
        for (uint16 i = voterEpoch; i < rewardEpochs; i++) {
            uint epochReward = (voteWeight.mul(VOTER_REWARD_MULTIPLIER).mul(WEEKS_IN_YEAR.sub(i))).div(voterRewardSums[i]);
            voterReward = voterReward.add(epochReward);
            emit VoterRewardCalculated(
                msg.sender,
                currentEpoch,
                voterReward,
                epochReward,
                voteWeight,
                VOTER_REWARD_MULTIPLIER,
                WEEKS_IN_YEAR.sub(i),
                voterRewardSums[i],
                now
            );
        }

        _removeVote(gasTarget, lockupDuration, originalEglAmount, voteWeight, voterEpoch);
        tokensInCirculation = tokensInCirculation.add(voterReward);

        emit Withdraw(
            msg.sender,
            currentEpoch,
            originalEglAmount,
            releaseDate,
            voterReward,
            gasTarget,
            currentEpoch < WEEKS_IN_YEAR ? voterRewardSums[currentEpoch]: 0,
            votesTotal[0],
            voteWeightsSum[0],
            gasTargetSum[0],
            now
        );
        return originalEglAmount.add(voterReward);
    }

    /**
     * @dev Internal remove vote
     */
    function _removeVote(
        uint _gasTarget,
        uint8 _lockupDuration,
        uint _originalEglAmount,
        uint _voteWeight,
        uint _voterEpoch
    ) private {
        uint voterInterval = _voterEpoch.add(_lockupDuration);
        uint affectedEpochs = currentEpoch < voterInterval ? voterInterval.sub(currentEpoch) : 0;
        // TODO: Use SafeMath instead of -= and += to avoid potential overflows
        for (uint8 i = 0; i < affectedEpochs; i++) {
            voteWeightsSum[i] -= _voteWeight;
            gasTargetSum[i] -= _voteWeight.mul(_gasTarget);
            if (_voterEpoch.add(i) < WEEKS_IN_YEAR) {
                voterRewardSums[_voterEpoch.add(i)] -= _voteWeight;
            }
            votesTotal[i] -= _originalEglAmount;
        }
    }

    /**
     * @dev Internal add vote
     */
    function _addVote(uint _gasTarget, uint8 _lockupDuration, uint _eglAmount) private {
        uint voteWeight = _eglAmount.mul(_lockupDuration);
        uint weightedGasTarget = _gasTarget.mul(voteWeight);
        // TODO: Use SafeMath instead of -= and += to avoid potential overflows
        for (uint8 i = 0; i < _lockupDuration; i++) {
            voteWeightsSum[i] += voteWeight;
            gasTargetSum[i] += weightedGasTarget;
            if (currentEpoch.add(i) < WEEKS_IN_YEAR)
                voterRewardSums[currentEpoch.add(i)] += voteWeight;
            votesTotal[i] += _eglAmount;
        }
    }

    /**
     * @dev Seed initial accounts with tokens
     */
    function _seedInitialAccounts(address[] memory _seedAccounts) private {
        if (_seedAccounts.length > 0) {
            tokensInCirculation = INITIAL_SEED_AMOUNT;
            uint seedAmountPerAccount = INITIAL_SEED_AMOUNT.div(_seedAccounts.length);
            for (uint8 i = 0; i < _seedAccounts.length; i++) {
                emit SeedAccountsFunded(_seedAccounts[i], INITIAL_SEED_AMOUNT, seedAmountPerAccount, now);
                _internalVote(
                    _seedAccounts[i],
                    block.gaslimit,
                    seedAmountPerAccount,
                    8,
                    address(0), 0, address(0),
                    currentEpochStartDate.add(SEED_LOCKUP_PERIOD)
                );
            }
        }
    }

    function _assessCreatorReward() private {
        if (currentEpoch >= CREATOR_REWARD_FIRST_EPOCH && remainingCreatorReward > 0) {
            uint creatorRewardForEpoch = weeklyCreatorRewardAmount.umin(remainingCreatorReward);
            remainingCreatorReward = remainingCreatorReward.sub(creatorRewardForEpoch);
            tokensInCirculation = tokensInCirculation.add(creatorRewardForEpoch);
            token.transfer(creatorRewardsAddress, creatorRewardForEpoch);
            emit CreatorRewardsClaimed(
                msg.sender,
                creatorRewardsAddress,
                creatorRewardForEpoch,
                remainingCreatorReward,
                currentEpoch,
                now
            );
        }
    }
}
