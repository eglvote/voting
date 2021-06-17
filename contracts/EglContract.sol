pragma solidity 0.6.6;

import "./EglToken.sol";
import "./interfaces/IEglGenesis.sol";
import "./libraries/Math.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SignedSafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract EglContract is Initializable, OwnableUpgradeable, PausableUpgradeable {
    /********************************** LIBRARIES ***********************************/
    using Math for *;
    using SafeMathUpgradeable for *;
    using SignedSafeMathUpgradeable for int;

    /********************************** CONSTANTS ***********************************/
    int constant GAS_LIMIT_CHANGE = 1000000;
    uint8 constant WEEKS_IN_YEAR = 52;
    uint8 constant CREATOR_REWARD_FIRST_EPOCH = 10;
    uint constant GAS_TARGET_TOLERANCE = 4000000;
    uint constant DECIMAL_PRECISION = 10**18;
    uint constant VOTER_REWARD_MULTIPLIER = 362844.70 ether;    
    uint constant LAUNCH_EGLS = 750000000 ether;
    uint constant TOTAL_CREATOR_EGLS = 750000000 ether;

    /**************************** PUBLIC STATE VARIABLES ****************************/
    int public desiredEgl;
    int public baselineEgl;
    int public initialEgl;
    int public tallyVotesGasLimit;

    uint16 public currentEpoch;
    uint public currentEpochStartDate;
    uint public tokensInCirculation;

    uint[52] public voterRewardSums;
    uint[8] public votesTotal;
    uint[8] public voteWeightsSum;
    uint[8] public gasTargetSum;

    mapping(address => Voter) public voters;
    mapping(address => Supporter) public supporters;
    mapping(address => uint) public seeders;

    struct Voter {
        uint8 lockupDuration;
        uint16 voteEpoch;
        uint releaseDate;
        uint tokensLocked;
        uint gasTarget;
    }

    struct Supporter {
        uint32 matches;
        uint poolTokens;
        uint firstEgl;
        uint lastEgl;
    }

    /**************************** PRIVATE STATE VARIABLES ****************************/
    EglToken private eglToken;
    IERC20Upgradeable private balancerPoolToken;
    IEglGenesis private eglGenesis;

    address private creatorRewardsAddress;

    int private epochGasLimitSum;
    int private epochVoteCount;

    uint24 private votingPauseSeconds;
    uint32 private epochLength;
    uint private firstEpochStartDate;
    uint private latestRewardSwept;
    uint private minLiquidityTokensLockup;
    uint private remainingPoolReward;
    uint private remainingCreatorReward;
    uint private lastCreatorRewardAmount;
    uint private supporterEglsTotal;
    uint private poolTokensHeld;  
    uint private ethEglRatio;
    uint private ethBptRatio;

    /************************************ EVENTS ************************************/
    event Initialized(
        address deployer,
        address eglContract,
        address eglToken,
        address genesisContract,
        uint totalGenesisEth,
        uint ethEglRatio,
        uint ethBptRatio,
        uint minLiquidityTokensLockup,
        uint firstEpochStartDate,
        uint votingPauseSeconds,
        uint epochLength,
        uint date
    );
    event Vote(
        address caller,
        uint16 currentEpoch,
        uint gasTarget,
        uint eglAmount,
        uint8 lockupDuration,
        uint releaseDate,
        uint epochVoteWeightSum,
        uint epochGasTargetSum,
        uint epochVoterRewardSum,
        uint epochTotalVotes,
        uint date
    );
    event ReVote(
        address caller, 
        uint gasTarget, 
        uint eglAmount, 
        uint date
    );
    event Withdraw(
        address caller,
        uint16 currentEpoch,
        uint tokensLocked,
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
        uint tokensInCirculation,
        uint date
    );
    event CreatorRewardsClaimed(
        address caller,
        address creatorRewardAddress,
        uint amountClaimed,
        uint lastEpochReward,
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
        uint timeSinceFirstEpoch,
        uint gracePeriodSeconds,
        uint date
    );
    event PoolRewardsSwept(
        address caller, 
        address coinbaseAddress,
        uint blockNumber, 
        int blockGasLimit, 
        uint blockReward, 
        uint date
    );
    event BlockRewardCalculated(
        uint blockNumber, 
        uint16 currentEpoch,
        uint remainingPoolReward,
        int blockGasLimit, 
        int desiredEgl,
        int tallyVotesGasLimit,
        uint proximityRewardPercent,
        uint totalRewardPercent,
        uint blockReward
    );
    event SeedAccountClaimed(
        address seedAddress, 
        uint individualSeedAmount, 
        uint releaseDate,
        uint date
    );
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
    event EthReceived(
        address sender, 
        uint amount
    );
    event SupporterTokensClaimed(
        address caller,
        uint amountContributed,
        uint gasTarget,
        uint lockDuration,
        uint ethEglRatio,
        uint ethBptRatio,
        uint bonusEglsReceived,
        uint poolTokensReceived,
        uint date
    );
    event PoolTokensWithdrawn(
        address caller, 
        uint currentEglReleased, 
        uint poolTokensDue, 
        uint poolTokens, 
        uint firstEgl, 
        uint lastEgl, 
        uint date
    );  

    event ReleasedEglCalculated(
        uint currentEpoch, 
        uint timePassedPercentage, 
        uint currentEgl,
        uint maxSupply
    );

    /***************************** RECEIVE FUNCTION *****************************/
    /**
     * @dev Revert any transactions that attempt to send ETH to the contract directly
     */
    receive() external payable {
        emit EthReceived(msg.sender, msg.value);
        revert("EGL:NO_PAYMENTS");
    }

    /**************************** EXTERNAL FUNCTIONS ****************************/
    /**
     * @dev Initialized contract variables
     *
     * @param _token Address of the EGL token     
     * @param _poolToken Address of the Balance Pool Token (BPT)
     * @param _genesis Address of the EGL Genesis contract
     * @param _currentEpochStartDate Start date for the first epoch
     * @param _votingPauseSeconds Number of seconds to pause voting before votes are tallied
     * @param _epochLength The length of each epoch in seconds
     * @param _seedAccounts List of accounts to seed with EGL's
     * @param _seedAmounts Amount of EGLS's to seeds accounts with
     * @param _creatorRewardsAccount Address that creator rewards get sent to
     */
    function initialize(
        address _token,
        address _poolToken,
        address _genesis,
        uint _currentEpochStartDate,
        uint24 _votingPauseSeconds,
        uint32 _epochLength,
        address[] memory _seedAccounts,
        uint[] memory _seedAmounts,
        address _creatorRewardsAccount
    ) 
        public 
        initializer 
    {
        require(_token != address(0), "EGL:INVALID_EGL_TOKEN_ADDR");
        require(_poolToken != address(0), "EGL:INVALID_BP_TOKEN_ADDR");
        require(_genesis != address(0), "EGL:INVALID_GENESIS_ADDR");

        __Context_init_unchained();
        __Ownable_init_unchained();
        __Pausable_init_unchained();

        eglToken = EglToken(_token);
        balancerPoolToken = IERC20Upgradeable(_poolToken);
        eglGenesis = IEglGenesis(_genesis);        

        uint totalGenesisEth = eglGenesis.cumulativeBalance();
        require(totalGenesisEth > 0, "EGL:NO_GENESIS_BALANCE");

        uint totalBpts = balancerPoolToken.balanceOf(eglGenesis.owner());
        ethEglRatio = LAUNCH_EGLS.mul(DECIMAL_PRECISION).div(totalGenesisEth);
        ethBptRatio = totalBpts.mul(DECIMAL_PRECISION).div(totalGenesisEth);

        minLiquidityTokensLockup = _epochLength.mul(10);

        firstEpochStartDate = _currentEpochStartDate;
        currentEpochStartDate = _currentEpochStartDate;
        votingPauseSeconds = _votingPauseSeconds;
        epochLength = _epochLength;
        creatorRewardsAddress = _creatorRewardsAccount;
        tokensInCirculation = LAUNCH_EGLS;
        tallyVotesGasLimit = int(block.gaslimit);
        
        baselineEgl = int(block.gaslimit);
        initialEgl = baselineEgl;
        desiredEgl = baselineEgl;

        remainingPoolReward = 1250000000 ether;
        remainingCreatorReward = TOTAL_CREATOR_EGLS;

        if (_seedAccounts.length > 0)
            for (uint8 i = 0; i < _seedAccounts.length; i++) {
                addSeedAccount(_seedAccounts[i], _seedAmounts[i]);
            }
        
        emit Initialized(
            msg.sender,
            address(this),
            address(eglToken),
            address(eglGenesis), 
            totalGenesisEth,
            ethEglRatio,
            ethBptRatio,
            minLiquidityTokensLockup,
            firstEpochStartDate,
            votingPauseSeconds,
            epochLength,
            now
        );
    }

    /**
    * @dev Allows EGL Genesis contributors to claim their "bonus" EGL's that get entered into initial vote
    *
    * @param _gasTarget desired gas target for initial vote when claiming tokens
    * @param _lockupDuration duration to lock tokens for initial vote
    */
    function claimSupporterEgls(uint _gasTarget, uint8 _lockupDuration) external whenNotPaused {
        require(
            eglGenesis.canContribute() == false && eglGenesis.canWithdraw() == false, 
            "EGL:GENESIS_LOCKED"
        );
        require(supporters[msg.sender].matches == 0, "EGL:ALREADY_CLAIMED");

        (uint amount, uint cumulativeBalance, ,) = eglGenesis.contributors(msg.sender);
        require(amount > 0, "EGL:NOT_CONTRIBUTED");

        uint contributorSerializedEgls = amount.mul(ethEglRatio).div(DECIMAL_PRECISION);
        uint poolTokensDue = amount.mul(ethBptRatio).div(DECIMAL_PRECISION);

        uint supporterFirstEgl = cumulativeBalance.sub(amount)
            .mul(ethEglRatio)
            .div(DECIMAL_PRECISION);
        uint supporterLastEgl = supporterFirstEgl.add(contributorSerializedEgls);
        uint bonusEglsDue = _calculateBonusEglsDue(supporterFirstEgl, supporterLastEgl);
        // TODO: Check that we don't go over the total bonus EGL's amount

        Supporter storage _supporter = supporters[msg.sender];        
        _supporter.matches = 1;
        _supporter.poolTokens = poolTokensDue;
        _supporter.firstEgl = supporterFirstEgl;
        _supporter.lastEgl = supporterLastEgl;        
        
        supporterEglsTotal = supporterEglsTotal.add(bonusEglsDue);
        tokensInCirculation = tokensInCirculation.add(bonusEglsDue);

        emit SupporterTokensClaimed(
            msg.sender,
            amount,
            _gasTarget,
            _lockupDuration,
            ethEglRatio,
            ethBptRatio,
            bonusEglsDue,
            poolTokensDue,
            now
        );

        _internalVote(
            msg.sender,
            _gasTarget,
            bonusEglsDue,
            _lockupDuration,
            currentEpochStartDate.add(epochLength.mul(52))
        );
    }

    /**
     * @dev Function for seed accounts to claim their EGL's and enter initial vote with locked tokens
     *
     * @param _gasTarget desired gas target for initial vote when claiming tokens
     * @param _lockupDuration duration to lock tokens for initial vote
     */
    function claimSeederEgls(uint _gasTarget, uint8 _lockupDuration) external whenNotPaused {
        require(seeders[msg.sender] > 0, "EGL:NOT_SEEDER");
        uint seedAmount = seeders[msg.sender];
        delete seeders[msg.sender];

        tokensInCirculation = tokensInCirculation.add(seedAmount);

        uint releaseDate = WEEKS_IN_YEAR.mul(epochLength)
            .add(firstEpochStartDate);
        emit SeedAccountClaimed(msg.sender, seedAmount, releaseDate, now);

        _internalVote(
            msg.sender,
            _gasTarget,
            seedAmount,
            _lockupDuration,
            releaseDate
        );
    }

    /**
     * @dev Vote for desired gas limit and upgrade
     *
     * @param _gasTarget The desired gas limit
     * @param _eglAmount Amount of EGL's to vote with
     * @param _lockupDuration Duration to lock the EGL's
     */
    function vote(
        uint _gasTarget,
        uint _eglAmount,
        uint8 _lockupDuration
    ) 
        external 
        whenNotPaused 
    {
        require(_eglAmount >= 1 ether, "EGL:AMNT_TOO_LOW");
        require(_eglAmount <= eglToken.balanceOf(msg.sender), "EGL:INSUFFICIENT_EGL_BALANCE");
        require(eglToken.allowance(msg.sender, address(this)) >= _eglAmount, "EGL:INSUFFICIENT_ALLOWANCE");
        if (block.timestamp > currentEpochStartDate.add(epochLength))
            tallyVotes();

        eglToken.transferFrom(msg.sender, address(this), _eglAmount);
        _internalVote(
            msg.sender,
            _gasTarget,
            _eglAmount,
            _lockupDuration,
            0
        );
    }

    /**
     * @dev Re-Vote to change parameters of an existing vote
     *
     * @param _gasTarget The desired gas limit
     * @param _eglAmount Amount of EGL's to vote with
     * @param _lockupDuration Duration to lock the EGL's
     */
    function reVote(
        uint _gasTarget,
        uint _eglAmount,
        uint8 _lockupDuration
    ) 
        external 
        whenNotPaused 
    {
        require(voters[msg.sender].tokensLocked > 0, "EGL:NOT_VOTED");
        if (_eglAmount > 0) {
            require(_eglAmount >= 1 ether, "EGL:AMNT_TOO_LOW");
            require(_eglAmount <= eglToken.balanceOf(msg.sender), "EGL:INSUFFICIENT_EGL_BALANCE");
            require(eglToken.allowance(msg.sender, address(this)) >= _eglAmount, "EGL:INSUFFICIENT_ALLOWANCE");
            eglToken.transferFrom(msg.sender, address(this), _eglAmount);
        }
        if (block.timestamp > currentEpochStartDate.add(epochLength))
            tallyVotes();

        uint originalReleaseDate = voters[msg.sender].releaseDate;
        _eglAmount = _eglAmount.add(_internalWithdraw(msg.sender));
        _internalVote(
            msg.sender,
            _gasTarget,
            _eglAmount,
            _lockupDuration,
            originalReleaseDate
        );
        emit ReVote(msg.sender, _gasTarget, _eglAmount, now);
    }

    /**
     * @dev Withdraw EGL's once they have matured
     */
    function withdraw() external whenNotPaused {
        require(voters[msg.sender].tokensLocked > 0, "EGL:NOT_VOTED");
        require(block.timestamp > voters[msg.sender].releaseDate, "EGL:NOT_RELEASE_DATE");
        eglToken.transfer(msg.sender, _internalWithdraw(msg.sender));
    }

    /**
     * @dev Send EGL reward to miner of the block. Reward caclulated based on how close the block gas limit
     * is to the desired EGL. The closer it is, the higher the reward
     */
    function sweepPoolRewards() external whenNotPaused {
        require(block.number > latestRewardSwept, "EGL:ALREADY_SWEPT");
        latestRewardSwept = block.number;
        int blockGasLimit = int(block.gaslimit);
        uint blockReward = _calculateBlockReward(blockGasLimit, desiredEgl, tallyVotesGasLimit);
        if (blockReward > 0) {
            remainingPoolReward = remainingPoolReward.sub(blockReward);
            tokensInCirculation = tokensInCirculation.add(blockReward);
            eglToken.transfer(block.coinbase, Math.umin(eglToken.balanceOf(address(this)), blockReward));
        }

        emit PoolRewardsSwept(
            msg.sender, 
            block.coinbase,
            latestRewardSwept, 
            blockGasLimit, 
            blockReward,
            now
        );
    }

    /**
     * @dev Allows for the withdrawal of liquidity pool tokens once they have matured
     */
    function withdrawPoolTokens() external whenNotPaused {
        require(supporters[msg.sender].matches > 0, "EGL:NO_POOL_TOKENS");
        require(now.sub(firstEpochStartDate) > minLiquidityTokensLockup, "EGL:ALL_TOKENS_LOCKED");

        uint currentEgl = _calculateReleasedEgl(
            block.timestamp.sub(firstEpochStartDate), 
            LAUNCH_EGLS, 
            minLiquidityTokensLockup
        );

        Supporter storage _supporter = supporters[msg.sender];
        require(_supporter.firstEgl <= currentEgl, "EGL:ADDR_TOKENS_LOCKED");

        uint poolTokensDue;
        if (currentEgl >= _supporter.lastEgl) {
            poolTokensDue = _supporter.poolTokens;
            _supporter.poolTokens = 0;

            Voter storage _voter = voters[msg.sender];
            uint releaseEpoch = _voter.voteEpoch.add(_voter.lockupDuration);
            _voter.releaseDate = releaseEpoch > currentEpoch
                ? block.timestamp.add(releaseEpoch.sub(currentEpoch).mul(epochLength))
                : block.timestamp;

            emit PoolTokensWithdrawn(
                msg.sender, 
                currentEgl, 
                poolTokensDue, 
                _supporter.poolTokens,
                _supporter.firstEgl, 
                _supporter.lastEgl, 
                now
            );
            delete supporters[msg.sender];
        } else {
            poolTokensDue = _calculateCurrentPoolTokensDue(
                currentEgl, 
                _supporter.firstEgl, 
                _supporter.lastEgl, 
                _supporter.poolTokens
            );
            _supporter.poolTokens = _supporter.poolTokens.sub(poolTokensDue);
            emit PoolTokensWithdrawn(
                msg.sender,
                currentEgl,
                poolTokensDue,
                _supporter.poolTokens,
                _supporter.firstEgl,
                _supporter.lastEgl,
                now
            );
            _supporter.firstEgl = currentEgl;
        }        

        balancerPoolToken.transfer(
            msg.sender, 
            Math.umin(balancerPoolToken.balanceOf(address(this)), poolTokensDue)
        );        
    }

    /***************************** PUBLIC FUNCTIONS *****************************/
    /**
     * @dev Tally Votes for the most recent epoch and calculate the new desired EGL amount
     */
    function tallyVotes() public whenNotPaused {
        require(block.timestamp > currentEpochStartDate.add(epochLength), "EGL:VOTE_NOT_ENDED");
        tallyVotesGasLimit = int(block.gaslimit);

        uint votingThreshold = DECIMAL_PRECISION.mul(30);
	    if (currentEpoch >= WEEKS_IN_YEAR) {
            uint actualThreshold = votingThreshold.add(
                (DECIMAL_PRECISION.mul(20).div(WEEKS_IN_YEAR.mul(2)))
                .mul(currentEpoch.sub(WEEKS_IN_YEAR.sub(1)))
            );
            votingThreshold = Math.umin(actualThreshold, 50 * DECIMAL_PRECISION);
        }

        int averageGasTarget = voteWeightsSum[0] > 0
            ? int(gasTargetSum[0].div(voteWeightsSum[0]))
            : 0;
        uint votePercentage = _calculatePercentageOfTokensInCirculation(votesTotal[0]);
        if (votePercentage >= votingThreshold) {
            epochGasLimitSum = epochGasLimitSum.add(int(tallyVotesGasLimit));
            epochVoteCount = epochVoteCount.add(1);
            baselineEgl = epochGasLimitSum.div(epochVoteCount);

            desiredEgl = baselineEgl > averageGasTarget
                ? baselineEgl.sub(baselineEgl.sub(averageGasTarget).min(GAS_LIMIT_CHANGE))
                : baselineEgl.add(averageGasTarget.sub(baselineEgl).min(GAS_LIMIT_CHANGE));

            if (
                desiredEgl >= tallyVotesGasLimit.sub(10000) &&
                desiredEgl <= tallyVotesGasLimit.add(10000)
            ) 
                desiredEgl = tallyVotesGasLimit;

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
            if (block.timestamp.sub(firstEpochStartDate) >= epochLength.mul(7))
                desiredEgl = tallyVotesGasLimit.sub(tallyVotesGasLimit.mul(5).div(100));

            emit VoteThresholdFailed(
                msg.sender,
                currentEpoch,
                desiredEgl,
                votingThreshold,
                votePercentage,
                baselineEgl,
                initialEgl,
                block.timestamp.sub(firstEpochStartDate),
                epochLength.mul(6),
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

        if (currentEpoch >= CREATOR_REWARD_FIRST_EPOCH && remainingCreatorReward > 0)
            _issueCreatorRewards(currentEpoch);

        currentEpoch += 1;
        currentEpochStartDate = currentEpochStartDate.add(epochLength);

        emit VotesTallied(
            msg.sender,
            currentEpoch - 1,
            desiredEgl,
            averageGasTarget,
            votingThreshold,
            votePercentage,
            tokensInCirculation,
            now
        );
    }

    /**
     * @dev Owner only function to add a seeder account with specified number of EGL's
     *
     * @param _seedAccount Wallet address of seeder
     * @param _seedAmount Amount to seed
     */
    function addSeedAccount(address _seedAccount, uint _seedAmount) public onlyOwner {
        require(seeders[_seedAccount] == 0, "EGL:ALREADY_SEEDER");
        require(voters[_seedAccount].tokensLocked == 0, "EGL:ALREADY_HAS_VOTE");
        require(eglToken.balanceOf(_seedAccount) == 0, "EGL:ALREADY_HAS_EGLS");
        require(now < firstEpochStartDate.add(minLiquidityTokensLockup), "EGL:SEED_PERIOD_PASSED");
        (uint contributorAmount,,,) = eglGenesis.contributors(msg.sender);
        require(contributorAmount == 0, "EGL:IS_CONTRIBUTOR");
        seeders[_seedAccount] = _seedAmount;
    }

    /**
     * @dev Do not allow owner to renounce ownership, only transferOwnership
     */
    function renounceOwnership() public override onlyOwner {
        revert("EGL:NO_RENOUNCE_OWNERSHIP");
    }

    /**************************** INTERNAL FUNCTIONS ****************************/
    /**
     * @dev Internal function that adds a users vote
     *
     * @param _voter Address the vote should to assigned to
     * @param _gasTarget The desired gas limit
     * @param _eglAmount Amount of EGL's to vote with
     * @param _lockupDuration Duration to lock the EGL's
     * @param _releaseTime Date the EGL's are available to withdraw
     */
    function _internalVote(
        address _voter,
        uint _gasTarget,
        uint _eglAmount,
        uint8 _lockupDuration,
        uint _releaseTime
    ) internal {
        require(voters[_voter].tokensLocked == 0, "EGL:ALREADY_VOTED");
        require(
            Math.udelta(_gasTarget, block.gaslimit) < GAS_TARGET_TOLERANCE,
            "EGL:INVALID_GAS_TARGET"
        );

        require(_lockupDuration >= 1 && _lockupDuration <= 8, "EGL:INVALID_LOCKUP");
        require(block.timestamp < currentEpochStartDate.add(epochLength), "EGL:VOTE_TOO_FAR");
        require(block.timestamp < currentEpochStartDate.add(epochLength).sub(votingPauseSeconds), "EGL:VOTE_TOO_CLOSE");

        epochGasLimitSum = epochGasLimitSum.add(int(block.gaslimit));
        epochVoteCount = epochVoteCount.add(1);

        uint updatedReleaseDate = block.timestamp.add(_lockupDuration.mul(epochLength)).umax(_releaseTime);

        Voter storage voter = voters[_voter];
        voter.voteEpoch = currentEpoch;
        voter.lockupDuration = _lockupDuration;
        voter.releaseDate = updatedReleaseDate;
        voter.tokensLocked = _eglAmount;
        voter.gasTarget = _gasTarget;

        // Add the vote
        uint voteWeight = _eglAmount.mul(_lockupDuration);
        for (uint8 i = 0; i < _lockupDuration; i++) {
            voteWeightsSum[i] = voteWeightsSum[i].add(voteWeight);
            gasTargetSum[i] = gasTargetSum[i].add(_gasTarget.mul(voteWeight));
            if (currentEpoch.add(i) < WEEKS_IN_YEAR)
                voterRewardSums[currentEpoch.add(i)] = voterRewardSums[currentEpoch.add(i)].add(voteWeight);
            votesTotal[i] = votesTotal[i].add(_eglAmount);
        }

        emit Vote(
            _voter,
            currentEpoch,
            _gasTarget,
            _eglAmount,
            _lockupDuration,
            updatedReleaseDate,
            voteWeightsSum[0],
            gasTargetSum[0],
            currentEpoch < WEEKS_IN_YEAR ? voterRewardSums[currentEpoch]: 0,
            votesTotal[0],
            now
        );
    }

    /**
     * @dev Internal function that calculates the rewards due and removes the vote
     *
     * @param _voter Address the voter for be withdrawn for
     */
    function _internalWithdraw(address _voter) internal returns (uint totalWithdrawn) {
        Voter storage voter = voters[_voter];
        uint16 voterEpoch = voter.voteEpoch;
        uint originalEglAmount = voter.tokensLocked;
        uint8 lockupDuration = voter.lockupDuration;
        uint gasTarget = voter.gasTarget;
        delete voters[_voter];

        uint voteWeight = originalEglAmount.mul(lockupDuration);
        uint voterReward = _calculateVoterReward(_voter, currentEpoch, voterEpoch, lockupDuration, voteWeight);        

        // Remove the gas target vote
        uint voterInterval = voterEpoch.add(lockupDuration);
        uint affectedEpochs = currentEpoch < voterInterval ? voterInterval.sub(currentEpoch) : 0;
        for (uint8 i = 0; i < affectedEpochs; i++) {
            voteWeightsSum[i] = voteWeightsSum[i].sub(voteWeight);
            gasTargetSum[i] = gasTargetSum[i].sub(voteWeight.mul(gasTarget));
            if (currentEpoch.add(i) < WEEKS_IN_YEAR) {
                voterRewardSums[currentEpoch.add(i)] = voterRewardSums[currentEpoch.add(i)].sub(voteWeight);
            }
            votesTotal[i] = votesTotal[i].sub(originalEglAmount);
        }
        
        tokensInCirculation = tokensInCirculation.add(voterReward);

        emit Withdraw(
            _voter,
            currentEpoch,
            originalEglAmount,
            voterReward,
            gasTarget,
            currentEpoch < WEEKS_IN_YEAR ? voterRewardSums[currentEpoch]: 0,
            votesTotal[0],
            voteWeightsSum[0],
            gasTargetSum[0],
            now
        );
        totalWithdrawn = originalEglAmount.add(voterReward);
    }

    /**
     * @dev Issues creator reward EGLs' based on the release schedule
     */
    function _issueCreatorRewards(uint _rewardEpoch) internal {
        uint releasedEgl = _calculateReleasedEgl(
            _rewardEpoch.mul(epochLength), 
            TOTAL_CREATOR_EGLS,
            CREATOR_REWARD_FIRST_EPOCH.mul(epochLength)
        );
        uint creatorRewardForEpoch = releasedEgl.sub(lastCreatorRewardAmount).umin(remainingCreatorReward);
                
        eglToken.transfer(creatorRewardsAddress, creatorRewardForEpoch);
        remainingCreatorReward = remainingCreatorReward.sub(creatorRewardForEpoch);
        tokensInCirculation = tokensInCirculation.add(creatorRewardForEpoch);

        emit CreatorRewardsClaimed(
            msg.sender,
            creatorRewardsAddress,
            creatorRewardForEpoch,
            lastCreatorRewardAmount,
            remainingCreatorReward,
            currentEpoch,
            now
        );
        lastCreatorRewardAmount = releasedEgl;
    }

    /**
     * @dev Calulates the block reward depending on the blocks gas limit
     *
     * @param _blockGasLimit gas limit of the currently mined block
     * @param _desiredEgl current desired EGL value
     * @param _tallyVotesGasLimit gas limit of the block that contained the tally votes tx
     */
    function _calculateBlockReward(
        int _blockGasLimit, 
        int _desiredEgl, 
        int _tallyVotesGasLimit
    ) 
        internal 
        returns (uint blockReward) 
    {
        uint totalRewardPercent;
        uint proximityRewardPercent;
        int eglDelta = Math.delta(_tallyVotesGasLimit, _desiredEgl);
        int actualDelta = Math.delta(_tallyVotesGasLimit, _blockGasLimit);
        int ceiling = _desiredEgl.add(10000);
        int floor = _desiredEgl.sub(10000);

        if (_blockGasLimit >= floor && _blockGasLimit <= ceiling) {
            totalRewardPercent = DECIMAL_PRECISION.mul(100);
        } else if (eglDelta > 0 && (
                (
                    _desiredEgl > _tallyVotesGasLimit 
                    && _blockGasLimit > _tallyVotesGasLimit 
                    && _blockGasLimit <= ceiling
                ) || (
                    _desiredEgl < _tallyVotesGasLimit 
                    && _blockGasLimit < _tallyVotesGasLimit 
                    && _blockGasLimit >= floor
                )
            )            
        ) {
            proximityRewardPercent = uint(actualDelta.mul(int(DECIMAL_PRECISION))
                .div(eglDelta))
                .mul(75);                
            totalRewardPercent = proximityRewardPercent.add(DECIMAL_PRECISION.mul(25));
        }

        blockReward = totalRewardPercent.mul(remainingPoolReward.div(5000000))
            .div(DECIMAL_PRECISION)
            .div(100);

        emit BlockRewardCalculated(
            block.number,
            currentEpoch,
            remainingPoolReward,
            _blockGasLimit,
            _desiredEgl,
            _tallyVotesGasLimit,
            proximityRewardPercent,
            totalRewardPercent, 
            blockReward
        );
    }

    /**
     * @dev Calculates the current EGL released
     */
    function _calculateReleasedEgl(uint _timeSinceOrigin, uint _maxEglSupply, uint _timeLocked) 
        internal                  
        returns (uint currentEgl) 
    {
        if (_timeSinceOrigin >= epochLength.mul(WEEKS_IN_YEAR))
            return _maxEglSupply;

        uint timePassedPercentage = _timeSinceOrigin
            .sub(_timeLocked)
            .mul(DECIMAL_PRECISION)
            .div(
                epochLength.mul(WEEKS_IN_YEAR).sub(_timeLocked)
            );

        // Reduced precision so that we don't overflow the uin256 when we raise to 4th power
        currentEgl = ((timePassedPercentage.div(10**8))**4)
            .mul(_maxEglSupply.div(DECIMAL_PRECISION))
            .mul(10**8)
            .div((10**10)**3);

        emit ReleasedEglCalculated(
            currentEpoch, 
            timePassedPercentage.mul(100), 
            currentEgl, 
            _maxEglSupply
        );
    }

    /**
     * @dev Calculates the pool tokens due at time of calling
     */
    function _calculateCurrentPoolTokensDue(
        uint _currentEgl, 
        uint _firstEgl, 
        uint _lastEgl, 
        uint _totalPoolTokens
    ) 
        internal 
        pure
        returns (uint poolTokensDue) 
    {
        uint eglsReleased = (_currentEgl.umin(_lastEgl)).sub(_firstEgl);
        poolTokensDue = _totalPoolTokens
            .mul(eglsReleased)
            .div(
                _lastEgl.sub(_firstEgl)
            );
    }

    /**
     * @dev Calculates bonus EGLs due
     */
    function _calculateBonusEglsDue(
        uint _firstEgl, 
        uint _lastEgl
    )
        internal
        pure 
        returns (uint bonusEglsDue)  
    {
        bonusEglsDue = (_lastEgl.div(DECIMAL_PRECISION)**4)
            .sub(_firstEgl.div(DECIMAL_PRECISION)**4)
            .mul(DECIMAL_PRECISION)
            .div(
                (81/128)*(10**27)
            );
    }

    /**
     * @dev Calculates voter reward at time of withdrawal
     */
    function _calculateVoterReward(
        address _voter,
        uint16 _currentEpoch,
        uint16 _voterEpoch,
        uint8 _lockupDuration,
        uint _voteWeight
    ) 
        internal         
        returns(uint rewardsDue) 
    {
        uint rewardEpochs = _voterEpoch.add(_lockupDuration).umin(_currentEpoch).umin(WEEKS_IN_YEAR);
        for (uint16 i = _voterEpoch; i < rewardEpochs; i++) {
            uint epochReward = _voteWeight.mul(VOTER_REWARD_MULTIPLIER)
                .mul(WEEKS_IN_YEAR.sub(i))
                .div(voterRewardSums[i]);
            rewardsDue = rewardsDue.add(epochReward);
            emit VoterRewardCalculated(
                _voter,
                _currentEpoch,
                rewardsDue,
                epochReward,
                _voteWeight,
                VOTER_REWARD_MULTIPLIER,
                WEEKS_IN_YEAR.sub(i),
                voterRewardSums[i],
                now
            );
        }
    }

    /**
     * @dev Calculates the percentage of tokens in circulation for a given total
     *
     * @param _total The total to calculate the percentage of
     * @return votePercentage The percentage of the total
     */
    function _calculatePercentageOfTokensInCirculation(uint _total) 
        internal 
        view 
        returns (uint votePercentage) 
    {
        votePercentage = tokensInCirculation > 0
            ? _total.mul(DECIMAL_PRECISION).mul(100).div(tokensInCirculation)
            : 0;
    }
}
