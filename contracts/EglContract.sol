pragma solidity ^0.6.0;

import "./EglToken.sol";
import "./libraries/Math.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SignedSafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";

contract EglContract is Initializable, OwnableUpgradeable, PausableUpgradeable {
    /********************************** LIBRARIES ***********************************/
    using Math for *;
    using SafeMathUpgradeable for uint;
    using SafeMathUpgradeable for uint8;
    using SafeMathUpgradeable for uint16;
    using SafeMathUpgradeable for uint32;
    using SignedSafeMathUpgradeable for int;

    /********************************** CONSTANTS ***********************************/
    int constant GAS_LIMIT_CHANGE = 1000000;
    uint8 constant WEEKS_IN_YEAR = 52;
    uint8 constant CREATOR_REWARD_FIRST_EPOCH = 9;
    uint8 constant MAX_CANDIDATES = 10;
    uint constant GAS_TARGET_TOLERANCE = 4000000;
    uint constant DECIMAL_PRECISION = 10**18;
    uint constant DAO_RECIPIENT_MIN_AMOUNT = 1 ether;
    uint constant DAO_RECIPIENT_MAX_AMOUNT = 5000000 ether;
    uint constant VOTER_REWARD_MULTIPLIER = 544267.054 ether;
    uint constant INITIAL_SEED_AMOUNT = 5000000 ether;
    uint constant ETH_EGL_LAUNCH_RATIO = 16000 ether;
    uint constant TOTAL_EGLS_FOR_MATCHING = 750000000 ether;

    /**************************** PUBLIC STATE VARIABLES ****************************/
    int public desiredEgl;
    int public baselineEgl;
    int public initialEgl;

    uint16 public currentEpoch;
    uint public currentEpochStartDate;
    uint public tokensInCirculation;
    uint public previousEpochDaoSum;

    uint[52] public voterRewardSums;
    uint[8] public votesTotal;
    uint[8] public voteWeightsSum;
    uint[8] public gasTargetSum;

    address public previousEpochDaoCandidate;
    address public previousEpochUpgradeCandidate;

    address[] public daoCandidateList;
    address[] public upgradeCandidateList;

    mapping(address => Voter) public voters;
    mapping(address => Launcher) public launchers;
    mapping(address => VoteCandidate) public voteCandidates;

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

    struct Launcher {
        uint32 matches;
        uint32 idx;
        uint[] poolTokens;
        uint[] firstEgl;
        uint[] lastEgl;
    }

    struct VoteCandidate {
        uint voteCount;
        uint amountSum;
        uint8 idx;
    }

    /**************************** PRIVATE STATE VARIABLES ****************************/
    EglToken private eglToken;
    IUniswapV2Router02 private uniSwapRouter;
    IUniswapV2Factory private uniSwapFactory;
    IWETH private weth;
    IUniswapV2Pair private uniSwapPair;

    address private creatorRewardsAddress;

    int private epochGasLimitSum;
    int private epochVoteCount;

    uint24 private votingPauseSeconds;
    uint32 private epochLength;
    uint private firstEpochStartDate;
    uint private latestRewardSwept;
    uint private weeklyCreatorRewardAmount;
    uint private ethRequiredToLaunchUniSwap;
    uint private minLiquidityTokensLockup;
    uint private remainingPoolReward;
    uint private remainingCreatorReward;
    uint private ethToBeDeployed;
    uint private eglsMatched;
    uint private poolTokensHeld;    
    uint private upgradeVoteEglSum;
    uint private daoVoteEglSum;

    bool private uniSwapLaunched;

    /************************************ EVENTS ************************************/
    event Initialized(
        address deployer,
        address eglContract,
        address eglToken,
        address uniSwapRouter,
        address uniSwapFactory,
        address wethToken,
        address uniSwapPair,
        uint ethRequiredToLaunchUniSwap,
        uint minLiquidityTokensLockup,
        uint firstEpochStartDate,
        uint votingPauseSeconds,
        uint epochLength,
        uint weeklyCreatorRewardAmount,
        uint date
    );
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
        uint daoVotePercentage,
        uint upgradeVotePercentage,
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
        uint remainingPoolReward,
        int blockGasLimit, 
        int desiredEgl,
        int delta, 
        uint rewardPercent,
        uint blockReward
    );
    event SeedAccountFunded(
        address seedAddress, 
        uint initialSeedAmount, 
        uint individualSeedAmount, 
        uint date
    );
    event GiftAccountFunded(
        address giftAddress, 
        uint individualGiftAmount, 
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
    event UniSwapLaunch(
        address caller,
        uint amountReceived,
        uint ethEglRatio,
        uint eglsToBeMatched,
        uint ethToBeDeployed,
        uint eglsMatched,
        uint poolTokensReceived,
        uint poolTokensHeld,
        uint date
    );
    event EglsMatched(
        address caller,
        uint amountReceived,
        uint ethEglRatio,
        uint eglsToBeMatched,
        uint ethToBeDeployed,
        uint eglsMatched,
        uint poolTokensReceived,
        uint poolTokensHeld,
        bool uniSwapLaunched,
        uint date
    );
    event LiquidityAdded(
        address caller,
        uint desiredTokenAmount,
        uint ethAmount,
        uint minTokenAmount,
        uint minEthAmount,
        uint poolTokensReceived,
        uint date
    );
    event LiquidityTokensWithdrawn(
        address caller, 
        uint currentEglReleased, 
        uint poolTokensDue, 
        uint poolTokens, 
        uint firstEgl, 
        uint lastEgl, 
        uint date
    );
    event CandidateVoteAdded(
        address candidate, 
        uint currentEpoch,
        uint candidateVoteCount,
        uint candidateAmountSum,
        uint8 candidateIdx,
        uint numberOfCandidates,
        address losingCandidate,
        uint losingCandidateEgls,
        uint8 losingCandidateIdx,
        uint date
    );
    event CandidateVoteRemoved(
        address candidate, 
        uint currentEpoch,
        uint candidateVoteCount,
        uint candidateAmountSum,
        uint8 candidateIdx,
        uint numberOfCandidates,
        uint date
    );
    event CandidateVoteEvaluated(
        address leadingCandidate, 
        uint currentEpoch,
        uint leadingCandidateVotes,
        uint leadingCandidateAmount,
        uint totalVoteWeight,
        uint totalVotePercentage,
        bool thresholdPassed,
        uint date
    );
    event CandidateVoteWinner (
        address winnerAddress,
        uint currentEpoch,
        uint winnerAmount,
        uint date
    );
    /***************************** RECEIVE FUNCTION *****************************/
    /**
     * @dev Receive eth
     */
    receive() external payable {
        emit EthReceived(msg.sender, msg.value);
    }

    /**************************** EXTERNAL FUNCTIONS ****************************/
    /**
     * @dev Initialized contract variables
     *
     * @param _token Address of the EGL token
     * @param _router Address of the Uniswap Router
     * @param _ethRequiredToLaunchUniSwap Amount of ETH required to launch UniSwap pair
     * @param _currentEpochStartDate Start date for the first epoch
     * @param _votingPauseSeconds Number of seconds to pause voting before votes are tallied
     * @param _epochLength The length of each epoch in seconds
     * @param _seedAccounts List of accounts to seed with EGL's
     * @param _creatorRewardsAccount Address that creator rewards get sent to
     */
    function initialize(
        address _token,
        address _router,
        uint _ethRequiredToLaunchUniSwap,
        uint _currentEpochStartDate,
        uint24 _votingPauseSeconds,
        uint32 _epochLength,
        int _baselineGasLimit,
        int _desiredEgl,
        address[] memory _seedAccounts,
        uint _eglsGifted,
        address _creatorRewardsAccount
    ) 
        public 
        initializer 
    {
        require(_token != address(0), "EGL:INVALID_TOKEN_ADDR");
        require(_router != address(0), "EGL:INVALID_ROUTER_ADDR");

        __Context_init_unchained();
        __Ownable_init_unchained();
        __Pausable_init_unchained();

        eglToken = EglToken(_token);
        uniSwapRouter = IUniswapV2Router02(_router);
        uniSwapFactory = IUniswapV2Factory(uniSwapRouter.factory());
        weth = IWETH(uniSwapRouter.WETH());

        require(
            uniSwapFactory.getPair(address(eglToken), address(weth)) == address(0), 
            "EGL:UNISWAP_EXISTS"
        );
        uniSwapPair = IUniswapV2Pair(
            UniswapV2Library.pairFor(
                address(uniSwapFactory), 
                address(eglToken), 
                address(weth)
            )
        );
        ethRequiredToLaunchUniSwap = _ethRequiredToLaunchUniSwap;
        minLiquidityTokensLockup = _epochLength.mul(10);        
        ethToBeDeployed = 1000; // Min uniswap liquidity

        firstEpochStartDate = _currentEpochStartDate;
        currentEpochStartDate = _currentEpochStartDate;
        votingPauseSeconds = _votingPauseSeconds;
        epochLength = _epochLength;
        creatorRewardsAddress = _creatorRewardsAccount;
        tokensInCirculation = _eglsGifted;

        baselineEgl = _baselineGasLimit;
        initialEgl = _desiredEgl;
        desiredEgl = _desiredEgl;

        remainingPoolReward = 1500000000 ether;
        remainingCreatorReward = 500000000 ether;
        weeklyCreatorRewardAmount = remainingCreatorReward.div(WEEKS_IN_YEAR.sub(CREATOR_REWARD_FIRST_EPOCH));

        if (_seedAccounts.length > 0)
            _fundSeedAccounts(_seedAccounts);
        
        emit Initialized(
            msg.sender,
            address(this),
            address(eglToken),
            address(uniSwapRouter), 
            address(uniSwapFactory),
            address(weth),
            address(uniSwapPair),
            ethRequiredToLaunchUniSwap,
            minLiquidityTokensLockup,
            firstEpochStartDate,
            votingPauseSeconds,
            epochLength,
            weeklyCreatorRewardAmount,
            now
        );
    }

    /**
     * @dev Vote for desired gas limit and upgrade
     *
     * @param _gasTarget The desired gas limit
     * @param _eglAmount Amount of EGL's to vote with
     * @param _lockupDuration Duration to lock the EGL's
     * @param _daoRecipient Address of the recipient to received DAO funds
     * @param _daoAmount Amount of EGL's to give to daoRecipient
     * @param _upgradeAddress Address of the upgraded contract
     */
    function vote(
        uint _gasTarget,
        uint _eglAmount,
        uint8 _lockupDuration,
        address _daoRecipient,
        uint _daoAmount,
        address _upgradeAddress
    ) 
        external 
        whenNotPaused 
    {
        require(_eglAmount >= 1 ether, "EGL:AMNT_TOO_LOW");
        require(_eglAmount <= eglToken.balanceOf(msg.sender), "EGL:INSUFFICIENT_EGL_BALANCE");
        require(eglToken.allowance(msg.sender, address(this)) >= _eglAmount, "EGL:INSUFFICIENT_ALLOWANCE");
        eglToken.transferFrom(msg.sender, address(this), _eglAmount);
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
     * @dev Re-Vote to change parameters of an existing vote
     *
     * @param _gasTarget The desired gas limit
     * @param _eglAmount Amount of EGL's to vote with
     * @param _lockupDuration Duration to lock the EGL's
     * @param _daoRecipient Address of the recipient to received DAO funds
     * @param _daoAmount Amount of EGL's to give to daoRecipient
     * @param _upgradeAddress Address of the upgraded contract
     */
    function reVote(
        uint _gasTarget,
        uint _eglAmount,
        uint8 _lockupDuration,
        address _daoRecipient,
        uint _daoAmount,
        address _upgradeAddress
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
        uint originalReleaseDate = voters[msg.sender].releaseDate;
        _eglAmount = _eglAmount.add(_internalWithdraw(msg.sender));
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
     * @dev Withdraw EGL's once they have matured
     */
    function withdraw() external whenNotPaused {
        require(voters[msg.sender].tokensLocked > 0, "EGL:NOT_VOTED");
        require(block.timestamp > voters[msg.sender].releaseDate, "EGL:NOT_RELEASE_DATE");
        eglToken.transfer(msg.sender, _internalWithdraw(msg.sender));
    }

    /**
     * @dev Allows mining pools to collect their reward EGL's 
     */
    function sweepPoolRewards() external whenNotPaused {
        if (uniSwapLaunched) {
            require(block.number > latestRewardSwept, "EGL:ALREADY_SWEPT");
            latestRewardSwept = block.number;
            int blockGasLimit = int(block.gaslimit);
            uint blockReward = _calculateBlockReward(blockGasLimit);
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
    }

    /**
     * @dev Adds liquidity to a UniSwap pool by matching EGL's with ETH at a given ratio 
     */
    function supportLaunch() external whenNotPaused payable {
        require(msg.value > 0, "EGL:INSUFFICIENT_AMOUNT");
        require(eglsMatched <= TOTAL_EGLS_FOR_MATCHING, "EGL:ALL_EGL_MATCHED");        
        uint amountReceived = msg.value;
        uint eglsToBeMatched;
        uint poolTokensReceived;
        uint ethEglRatio;    
        
        if (uniSwapLaunched) {
            (uint eglReserve, uint wethReserve) = UniswapV2Library.getReserves(
                address(uniSwapFactory), address(eglToken), address(weth)
            );
            eglsToBeMatched = UniswapV2Library.quote(amountReceived, wethReserve, eglReserve);            
            require(eglsMatched.add(eglsToBeMatched) <= TOTAL_EGLS_FOR_MATCHING, "EGL:MATCHING_EXCEEDED");        

            ethEglRatio = eglsToBeMatched.mul(DECIMAL_PRECISION).div(amountReceived);
            eglToken.increaseAllowance(address(uniSwapRouter), eglsToBeMatched);
            poolTokensReceived = _addPairLiquidity(amountReceived, eglsToBeMatched);
            tokensInCirculation = tokensInCirculation.add(eglsToBeMatched);
        } else {
            ethEglRatio = ETH_EGL_LAUNCH_RATIO;
            eglsToBeMatched = (amountReceived.mul(ethEglRatio)).div(DECIMAL_PRECISION);        
            require(eglsMatched.add(eglsToBeMatched) <= TOTAL_EGLS_FOR_MATCHING, "EGL:MATCHING_EXCEEDED");        
            poolTokensReceived = (amountReceived.mul(126491106406735173279)).div(DECIMAL_PRECISION);            
        }

        Launcher storage _launcher = launchers[msg.sender];
        _launcher.matches += 1;
        _launcher.poolTokens.push(poolTokensReceived);
        _launcher.firstEgl.push(eglsMatched);
        _launcher.lastEgl.push(eglsMatched.add(eglsToBeMatched));        

        ethToBeDeployed = ethToBeDeployed.add(amountReceived);
        eglsMatched = eglsMatched.add(eglsToBeMatched);
        poolTokensHeld = poolTokensHeld.add(poolTokensReceived);

        if (
            !uniSwapLaunched && 
            (
                ethToBeDeployed >= ethRequiredToLaunchUniSwap || 
                block.timestamp >= firstEpochStartDate.add(epochLength.div(7))
            )
        ) {
            uniSwapLaunched = true;
            eglToken.increaseAllowance(address(uniSwapRouter), eglsMatched);
            uint actualTokensReceived = _addPairLiquidity(ethToBeDeployed, eglsMatched);
            tokensInCirculation = tokensInCirculation.add(eglsMatched);

            emit UniSwapLaunch(
                msg.sender,
                amountReceived,
                ethEglRatio,
                eglsToBeMatched,
                ethToBeDeployed,
                eglsMatched,
                actualTokensReceived,
                poolTokensHeld,
                now
            );
        }

        emit EglsMatched(
            msg.sender,
            amountReceived,
            ethEglRatio,
            eglsToBeMatched,
            ethToBeDeployed,
            eglsMatched,
            poolTokensReceived,
            poolTokensHeld,
            uniSwapLaunched,
            now
        );
    }

    /**
     * @dev Allows for the withdrawal of liquidity pool tokens once they have matured
     */
    function withdrawLiquidityTokens() external whenNotPaused {
        require(launchers[msg.sender].matches > 0, "EGL:NO_POOL_TOKENS");
        require(now.sub(firstEpochStartDate) > minLiquidityTokensLockup, "EGL:ALL_TOKENS_LOCKED");
        require(uniSwapLaunched, "EGL:UNISWAP_NOT_LAUNCHED");

        uint currentEglReleased = block.timestamp
            .sub(firstEpochStartDate)
            .sub(minLiquidityTokensLockup)
            .mul(TOTAL_EGLS_FOR_MATCHING)
            .div(
                (epochLength.mul(52)).sub(minLiquidityTokensLockup)
            );

        Launcher storage launcher = launchers[msg.sender];
        require(launcher.firstEgl[launcher.idx] <= currentEglReleased, "EGL:ADDR_TOKENS_LOCKED");

        uint poolTokensDue;
        if (currentEglReleased >= launcher.lastEgl[launcher.idx]) {
            poolTokensDue = launcher.poolTokens[launcher.idx];
            launcher.poolTokens[launcher.idx] = 0;
            launcher.matches -= 1;
            if (launcher.matches == 0) {                
                emit LiquidityTokensWithdrawn(
                    msg.sender, 
                    currentEglReleased, 
                    poolTokensDue, 
                    launcher.poolTokens[launcher.idx],
                    launcher.firstEgl[launcher.idx], 
                    launcher.lastEgl[launcher.idx], 
                    now
                );
                delete launchers[msg.sender];
            }
            else {
                emit LiquidityTokensWithdrawn(
                    msg.sender, 
                    currentEglReleased, 
                    poolTokensDue, 
                    launcher.poolTokens[launcher.idx],
                    launcher.firstEgl[launcher.idx], 
                    launcher.lastEgl[launcher.idx], 
                    now
                );
                launcher.idx += 1;
            }
            
        } else {
            uint eglsReleased = (currentEglReleased.umin(launcher.lastEgl[launcher.idx]))
                .sub(launcher.firstEgl[launcher.idx]);
            poolTokensDue = launcher.poolTokens[launcher.idx]
                .mul(eglsReleased)
                .div(launcher.lastEgl[launcher.idx].sub(launcher.firstEgl[launcher.idx]));
            launcher.poolTokens[launcher.idx] = launcher.poolTokens[launcher.idx].sub(poolTokensDue);
            emit LiquidityTokensWithdrawn(
                msg.sender, 
                currentEglReleased, 
                poolTokensDue, 
                launcher.poolTokens[launcher.idx], 
                launcher.firstEgl[launcher.idx], 
                launcher.lastEgl[launcher.idx], 
                now
            );
            launcher.firstEgl[launcher.idx] = currentEglReleased;
        }        

        uniSwapPair.transfer(
            msg.sender, 
            Math.umin(uniSwapPair.balanceOf(address(this)), poolTokensDue)
        );
    }

    /**
     * @dev Returns the number of DAO candidates
     */
    function getDaoCandidateCount() external view returns(uint daoCandidateCount) {
        daoCandidateCount = daoCandidateList.length;
    }

    /**
     * @dev Returns the number of upgrade candidates
     */
    function getUpgradeCandidateCount() external view returns(uint upgradeCandidateCount) {
        upgradeCandidateCount = upgradeCandidateList.length;
    }

    /***************************** PUBLIC FUNCTIONS *****************************/
    /**
     * @dev Tally Votes for the most recent epoch and calculate the new desired EGL amount
     */
    function tallyVotes() public whenNotPaused {
        require(block.timestamp > currentEpochStartDate.add(epochLength), "EGL:VOTE_NOT_ENDED");
        uint votingThreshold = 5 * DECIMAL_PRECISION;
	    if (currentEpoch >= WEEKS_IN_YEAR.div(2)) {
            uint actualThreshold = currentEpoch.mul(DECIMAL_PRECISION).mul(5).div(WEEKS_IN_YEAR.div(2));
            votingThreshold = Math.umin(actualThreshold, 50 * DECIMAL_PRECISION);
        }

        int averageGasTarget = voteWeightsSum[0] > 0
            ? int(gasTargetSum[0].div(voteWeightsSum[0]))
            : 0;
        uint votePercentage = _calculatePercentageOfTokensInCirculation(votesTotal[0]);
        if (votePercentage >= votingThreshold) {
            epochGasLimitSum = epochGasLimitSum.add(int(block.gaslimit));
            epochVoteCount = epochVoteCount.add(1);
            baselineEgl = epochGasLimitSum.div(epochVoteCount);

            desiredEgl = baselineEgl > averageGasTarget
                ? baselineEgl.sub(baselineEgl.sub(averageGasTarget).min(GAS_LIMIT_CHANGE))
                : baselineEgl.add(averageGasTarget.sub(baselineEgl).min(GAS_LIMIT_CHANGE));

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
                desiredEgl = desiredEgl > initialEgl
                    ? desiredEgl.sub(desiredEgl.sub(initialEgl).mul(5).div(100))
                    : desiredEgl.add(initialEgl.sub(desiredEgl).mul(5).div(100));
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

        uint daoVotePercentage = _tallyDaoVotes();

        uint upgradeVotePercentage = _tallyUpgradeVotes();

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
            _issueCreatorRewards();

        currentEpoch += 1;
        currentEpochStartDate = currentEpochStartDate.add(epochLength);

        emit VotesTallied(
            msg.sender,
            currentEpoch - 1,
            desiredEgl,
            averageGasTarget,
            votingThreshold,
            votePercentage,
            daoVotePercentage,
            upgradeVotePercentage,
            now
        );
    }

    /**************************** INTERNAL FUNCTIONS ****************************/
    /**
     * @dev Internal function that adds a users vote
     *
     * @param _voter Address the vote should to assigned to
     * @param _gasTarget The desired gas limit
     * @param _eglAmount Amount of EGL's to vote with
     * @param _lockupDuration Duration to lock the EGL's
     * @param _daoRecipient Address of the recipient to received DAO funds
     * @param _daoAmount Amount of EGL's to give to daoRecipient
     * @param _upgradeAddress Address of the upgraded contract
     * @param _releaseTime Date the EGL's are available to withdraw
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
    ) internal {
        require(voters[_voter].tokensLocked == 0, "EGL:ALREADY_VOTED");        
        require(
            Math.udelta(_gasTarget, block.gaslimit) < GAS_TARGET_TOLERANCE,
            "EGL:INVALID_GAS_TARGET"
        );

        require(_lockupDuration >= 1 && _lockupDuration <= 8, "EGL:INVALID_LOCKUP");
        if (block.timestamp > currentEpochStartDate.add(epochLength))
            tallyVotes();
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
        voter.daoRecipient = _daoRecipient;
        voter.daoAmount = _daoAmount;
        voter.upgradeAddress = _upgradeAddress;

        // Add the vote
        uint voteWeight = _eglAmount.mul(_lockupDuration);
        for (uint8 i = 0; i < _lockupDuration; i++) {
            voteWeightsSum[i] = voteWeightsSum[i].add(voteWeight);
            gasTargetSum[i] = gasTargetSum[i].add(_gasTarget.mul(voteWeight));
            if (currentEpoch.add(i) < WEEKS_IN_YEAR)
                voterRewardSums[currentEpoch.add(i)] = voterRewardSums[currentEpoch.add(i)].add(voteWeight);
            votesTotal[i] = votesTotal[i].add(_eglAmount);
        }

        if (
            _daoRecipient != address(0) && 
            _daoAmount >= DAO_RECIPIENT_MIN_AMOUNT && 
            _daoAmount <= DAO_RECIPIENT_MAX_AMOUNT
        ) {
            daoVoteEglSum = daoVoteEglSum.add(_eglAmount);
            _addCandidateVote(_daoRecipient, daoCandidateList, voteWeight, _daoAmount);
        }

        if (_upgradeAddress != address(0)) 
        {
            upgradeVoteEglSum = upgradeVoteEglSum.add(_eglAmount);
            _addCandidateVote(_upgradeAddress, upgradeCandidateList, voteWeight, 0);        
        }

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
        address daoRecipient = voter.daoRecipient;
        uint daoAmount = voter.daoAmount;
        address upgradeAddress = voter.upgradeAddress;
        delete voters[_voter];

        uint voteWeight = originalEglAmount.mul(lockupDuration);
        uint voterReward;
        uint rewardEpochs = voterEpoch.add(lockupDuration).umin(currentEpoch).umin(WEEKS_IN_YEAR);
        for (uint16 i = voterEpoch; i < rewardEpochs; i++) {
            uint epochReward = (voteWeight.mul(VOTER_REWARD_MULTIPLIER).mul(WEEKS_IN_YEAR.sub(i))).div(voterRewardSums[i]);
            voterReward = voterReward.add(epochReward);
            emit VoterRewardCalculated(
                _voter,
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

        // Remove the dao recipient vote
        if (daoRecipient != address(0)) {
            daoVoteEglSum = daoVoteEglSum < originalEglAmount 
                ? 0 
                : daoVoteEglSum.sub(originalEglAmount);
            _removeCandidateVote(daoRecipient, daoCandidateList, voteWeight, daoAmount);
        }

        // Remove the upgrade vote
        if (upgradeAddress != address(0)) {
            upgradeVoteEglSum = upgradeVoteEglSum < originalEglAmount 
                ? 0 
                : upgradeVoteEglSum.sub(originalEglAmount);
            _removeCandidateVote(upgradeAddress, upgradeCandidateList, voteWeight, 0);
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
     * @dev Lock tokens for seed accounts in a vote for 52 epochs
     */
    function _fundSeedAccounts(address[] memory _seedAccounts) internal {
        uint individualSeedAmount = INITIAL_SEED_AMOUNT.div(_seedAccounts.length);
        for (uint8 i = 0; i < _seedAccounts.length; i++) {
            tokensInCirculation = tokensInCirculation.add(individualSeedAmount);
            _internalVote(
                _seedAccounts[i],
                block.gaslimit,
                individualSeedAmount,
                8,
                address(0), 0, address(0),
                currentEpochStartDate.add(epochLength.mul(52))
            );
            emit SeedAccountFunded(_seedAccounts[i], INITIAL_SEED_AMOUNT, individualSeedAmount, now);
        }
    }

    /**
     * @dev Issues creator reward EGLs' based on the number of creator rewards remaining
     */
    function _issueCreatorRewards() internal {
        uint creatorRewardForEpoch = Math.umin(weeklyCreatorRewardAmount, remainingCreatorReward);
        eglToken.transfer(creatorRewardsAddress, creatorRewardForEpoch);
        remainingCreatorReward = remainingCreatorReward.sub(creatorRewardForEpoch);
        tokensInCirculation = tokensInCirculation.add(creatorRewardForEpoch);
        emit CreatorRewardsClaimed(
            msg.sender,
            creatorRewardsAddress,
            creatorRewardForEpoch,
            remainingCreatorReward,
            currentEpoch,
            now
        );
    }

    /**
     * @dev Calulates the block reward depending on the blocks gas limit
     */
    function _calculateBlockReward(int _blockGasLimit) internal returns (uint blockReward) {
        uint proximityRewardPercent;        
        int delta = Math.delta(_blockGasLimit, desiredEgl);
        if (delta <= GAS_LIMIT_CHANGE) {
            proximityRewardPercent = 
                uint(
                    GAS_LIMIT_CHANGE.sub(delta)
                    .mul(int(DECIMAL_PRECISION))
                    .div(GAS_LIMIT_CHANGE)
                )
                .mul(75)
                .add(DECIMAL_PRECISION.mul(25));
            blockReward = proximityRewardPercent
                .mul(remainingPoolReward.div(2**22))
                .div(DECIMAL_PRECISION)
                .div(100);
        }
        emit BlockRewardCalculated(
            block.number,
            remainingPoolReward,
            _blockGasLimit,
            desiredEgl,
            delta,
            proximityRewardPercent,
            blockReward
        );
    }

    /**
     * @dev Calculates the percentage of tokens in circulation for a given total
     *
     * @param _dividend The value to calculate the percentage on
     * @return votePercentage The percentage
     */
    function _calculatePercentageOfTokensInCirculation(uint _dividend) 
        internal 
        view 
        returns (uint votePercentage) 
    {
        votePercentage = tokensInCirculation > 0
            ? _dividend.mul(DECIMAL_PRECISION).mul(100).div(tokensInCirculation)
            : 0;
    }

    /**
     * @dev Tallies the votes cast for DAO recipient and amount
     */
    function _tallyDaoVotes() internal returns (uint daoVotePercentage) {
        daoVotePercentage = _calculatePercentageOfTokensInCirculation(daoVoteEglSum);
        bool continueVote;
        if (daoCandidateList.length > 0 && daoVotePercentage >= 20 * DECIMAL_PRECISION) {            
            (
                bool thresholdPassed, 
                address leadingCandidateAddress, 
                uint leadingCandidateAmount
            ) = _evaluateCandidateVote(daoCandidateList);
            delete daoCandidateList;
            if (thresholdPassed) {
                if (previousEpochDaoCandidate != address(0) && leadingCandidateAddress == previousEpochDaoCandidate) {
                    uint finalDaoAmount = previousEpochDaoSum.add(leadingCandidateAmount).div(2);
                    eglToken.transfer(leadingCandidateAddress, finalDaoAmount);
                    emit CandidateVoteWinner(
                        leadingCandidateAddress,
                        currentEpoch,
                        finalDaoAmount,
                        now
                    );
                }
                else {
                    previousEpochDaoCandidate = leadingCandidateAddress;
                    previousEpochDaoSum = leadingCandidateAmount;
                    continueVote = true;
                }
            }            
        } 
        if (!continueVote) {
            previousEpochDaoCandidate = address(0);
            previousEpochDaoSum = 0;
            daoVoteEglSum = 0;
        }
    }

    /**
     * @dev Tallies the votes cast for upgrade address
     */
    function _tallyUpgradeVotes() internal returns (uint upgradeVotePercentage) {
        upgradeVotePercentage = _calculatePercentageOfTokensInCirculation(upgradeVoteEglSum);
        bool continueVote;
        if (upgradeCandidateList.length > 0 && upgradeVotePercentage >= 50 * DECIMAL_PRECISION) {
            (
                bool thresholdPassed, 
                address leadingCandidateAddress, 
            ) = _evaluateCandidateVote(upgradeCandidateList);
            delete upgradeCandidateList;
            if (thresholdPassed) {
                if (previousEpochUpgradeCandidate != address(0) && leadingCandidateAddress == previousEpochUpgradeCandidate) {
                    // _doUpgrade();
                    emit CandidateVoteWinner(
                        leadingCandidateAddress,
                        currentEpoch,
                        0,
                        now
                    );
                }
                else {
                    previousEpochUpgradeCandidate = leadingCandidateAddress;
                    continueVote = true;
                }                    
            } 
        } 
        if (!continueVote) {
            previousEpochUpgradeCandidate = address(0);
            upgradeVoteEglSum = 0;
        }
    }

    /**
     * @dev Internal function to add candidate (DAO and upgrade) votes
     *
     * @param _candidateAddress Address of the vote recipient (DAO recipient or upgrade)
     * @param _candidateList List of candidate addresses (DAO recipient or upgrade)
     * @param _voteWeight Amount of EGL's in the vote 
     * @param _voteAmountSum Amount of EGL's to give to dao recipient or 0 for upgrade address
     */
    function _addCandidateVote(
        address _candidateAddress, 
        address[] storage _candidateList,
        uint _voteWeight, 
        uint _voteAmountSum
    ) internal {
        address ejectedCandidate;
        uint ejectedCandidateEgls;
        uint8 ejectedCandidateIdx;
        VoteCandidate storage _candidate = voteCandidates[_candidateAddress];
        if (_candidate.voteCount > 0) {
            _candidate.voteCount = _candidate.voteCount.add(_voteWeight);
            _candidate.amountSum = _candidate.amountSum.add(_voteWeight.mul(_voteAmountSum));
        } else if (_candidateList.length < MAX_CANDIDATES) {
            _candidateList.push(_candidateAddress);
            _candidate.voteCount = _voteWeight;
            _candidate.amountSum = _voteWeight.mul(_voteAmountSum);
            _candidate.idx = uint8(_candidateList.length - 1);
        } else {
            ejectedCandidate = _candidateAddress;
            ejectedCandidateEgls = _voteWeight;
            for (uint8 i = 0; i < _candidateList.length; i++) {
                uint existingCandidateEgls = voteCandidates[_candidateList[i]].voteCount;
                if (existingCandidateEgls < ejectedCandidateEgls) {
                    ejectedCandidate = _candidateList[i];
                    ejectedCandidateEgls = existingCandidateEgls;
                    ejectedCandidateIdx = i;
                }
            }
            if (ejectedCandidate != _candidateAddress) {
                delete voteCandidates[ejectedCandidate];
                _candidateList[ejectedCandidateIdx] = _candidateAddress;
                _candidate.voteCount = _voteWeight;
                _candidate.amountSum = _voteWeight.mul(_voteAmountSum);
                _candidate.idx = ejectedCandidateIdx;
            }
        }
        emit CandidateVoteAdded(
            _candidateAddress,
            currentEpoch,
            _candidate.voteCount,
            _candidate.amountSum,
            _candidate.idx,
            _candidateList.length,
            ejectedCandidate,
            ejectedCandidateEgls,
            ejectedCandidateIdx,
            now
        );
    }

    /**
     * @dev Internal function to remove candidate (DAO and upgrade) votes
     *
     * @param _candidateAddress Address of the vote recipient (DAO recipient or upgrade)
     * @param _candidateList List of candidate addresses (DAO recipient or upgrade)
     * @param _voteWeight Amount of EGL's in the vote 
     * @param _voteAmountSum Amount of EGL's to give to dao recipient or 0 for upgrade address
     */
    function _removeCandidateVote(
        address _candidateAddress, 
        address[] storage _candidateList,
        uint _voteWeight, 
        uint _voteAmountSum
    ) internal {
        VoteCandidate storage _candidate = voteCandidates[_candidateAddress];
        if (_candidate.voteCount > 0) {
            if (_candidate.voteCount.sub(_voteWeight) > 0) {
                _candidate.voteCount = _candidate.voteCount.sub(_voteWeight);
                _candidate.amountSum = _candidate.amountSum.sub(_voteAmountSum);
            } else {
                delete voteCandidates[_candidateAddress];
                _candidateList[_candidate.idx] = _candidateList[_candidateList.length - 1];
                _candidateList.pop();        
            }   

            emit CandidateVoteRemoved(
                _candidateAddress,
                currentEpoch,
                _candidate.voteCount,
                _candidate.amountSum,
                _candidate.idx,
                _candidateList.length,
                now
            );
        }
    }

    function _evaluateCandidateVote(
        address[] memory _candidateList
    ) 
        internal 
        returns (bool thresholdPassed, address leadingCandidateAddress, uint leadingCandidateAmount) 
    {
        uint leadingCandidateVotes;
        uint leadingCandidateAmountSum;
        uint totalVoteWeight;

        for (uint8 i = 0; i < _candidateList.length; i++) {
            VoteCandidate memory _candidate = voteCandidates[_candidateList[i]];
            if (_candidate.voteCount > leadingCandidateVotes) {
                leadingCandidateAddress = _candidateList[i];
                leadingCandidateVotes = _candidate.voteCount;
                leadingCandidateAmountSum = _candidate.amountSum;
            }
            totalVoteWeight = totalVoteWeight.add(_candidate.voteCount);
            delete voteCandidates[_candidateList[i]];
        }

        if (leadingCandidateVotes >= totalVoteWeight.div(2)) {
            leadingCandidateAmount = leadingCandidateAmountSum.div(totalVoteWeight);
            thresholdPassed = true;
        }
        
        emit CandidateVoteEvaluated(
            leadingCandidateAddress,
            currentEpoch,
            leadingCandidateVotes,
            leadingCandidateAmount,
            totalVoteWeight,
            leadingCandidateVotes.mul(DECIMAL_PRECISION).mul(100).div(totalVoteWeight),
            thresholdPassed,
            now
        );
    }

    /**
     * @dev Adds liquidity ETH to the UniSwap pair, creating it if it does not exist
     */
    function _addPairLiquidity(uint _ethAmount, uint _desiredTokenAmount) internal returns (uint tokensReceived) {
        uint minTokenAmount = _desiredTokenAmount.mul(99).div(100);
        uint minEthAmount = _ethAmount.mul(99).div(100);
        (, , tokensReceived) = uniSwapRouter.addLiquidityETH{value: _ethAmount}(
            address(eglToken),
            _desiredTokenAmount,
            minTokenAmount,
            minEthAmount,
            address(this),
            now + 120
        );

        emit LiquidityAdded(
            msg.sender,
            _desiredTokenAmount, 
            _ethAmount,
            minTokenAmount,
            minEthAmount,
            tokensReceived,
            now
        );
    }
}
