const { BN } = require("bn.js");

const Contract = require("@truffle/contract");
const FactoryJson = require("@uniswap/v2-core/build/UniswapV2Factory.json")
const RouterJson = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const UniswapV2Factory = Contract(FactoryJson);
const UniswapV2Router = Contract(RouterJson);
const WethToken = artifacts.require("@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol")
const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");
const TestableEglContract = artifacts.require("./helpers/TestableEglContract.sol");

const EventType = {
    INITIALIZED: "Initialized",
    VOTE: "Vote",
    REVOTE: "ReVote",
    WITHDRAW: "Withdraw",
    VOTES_TALLIED: "VotesTallied",
    CREATOR_REWARDS_CLAIMED: "CreatorRewardsClaimed",
    VOTE_THRESHOLD_MET: "VoteThresholdMet",
    VOTE_THRESHOLD_FAILED: "VoteThresholdFailed",
    POOL_REWARDS_SWEPT: "PoolRewardsSwept",
    BLOCK_REWARD_CALCULATED: "BlockRewardCalculated",
    SEED_ACCOUNT_FUNDED: "SeedAccountFunded",
    GIFT_ACCOUNT_FUNDED: "GiftAccountFunded",
    VOTER_REWARD_CALCULATED: "VoterRewardCalculated",
    ETH_RECEIVED: "EthReceived",
    UNISWAP_LAUNCH: "UniSwapLaunch",
    EGLS_MATCHED: "EglsMatched",
    LIQUIDITY_ADDED: "LiquidityAdded",
    LIQUIDITY_TOKENS_WITHDRAWN: "LiquidityTokensWithdrawn",
    CANDIDATE_VOTE_ADDED: "CandidateVoteAdded",
    CANDIDATE_VOTE_REMOVED: "CandidateVoteRemoved",
    CANDIDATE_VOTE_EVALUATED: "CandidateVoteEvaluated"
};

const VoterAttributes = {
    LOCKUP_DURATION: 0,
    VOTE_EPOCH: 1,
    RELEASE_DATE: 2,
    TOKENS_LOCKED: 3,
    GAS_TARGET: 4,
    DAO_RECIPIENT: 5,
    DAO_AMOUNT: 6,
    UPGRADE_ADDRESS: 7,
};

const ConsoleColors = {
    BLACK: "\x1b[30m \x1b[0m",
    RED: "\x1b[31m%s\x1b[0m",
    GREEN: "\x1b[32m%s\x1b[0m",
    YELLOW: "\x1b[33m%s\x1b[0m",
    BLUE: "\x1b[34m%s\x1b[0m",
    MAGENTA: "\x1b[35m%s\x1b[0m",
    CYAN: "\x1b[36m%s\x1b[0m",
    WHITE: "\x1b[37m%s\x1b[0m",
}

const ZeroAddress = "0x0000000000000000000000000000000000000000";
const DefaultEthToLaunch = new BN("5000000000000000000").toString();
const DefaultVotePauseSeconds = 300;
const DefaultEpochLengthSeconds = 1800; 

/***************************************************************/
/**** Assumes default block gas limit in ganache of 6721975 ****/
/***************************************************************/
const ValidGasTarget = 7000000;
const InvalidGasTargetHigh = 13000000;
const InvalidGasTargetLow = 1000000;

const InitialCreatorReward = new BN("500000000000000000000000000").div(new BN("43"));   


module.exports = {
    BN,
    UniswapV2Factory,
    UniswapV2Router,
    WethToken,
    EglToken,
    EglContract,
    TestableEglContract,
    EventType,
    VoterAttributes,
    ZeroAddress,
    DefaultEthToLaunch,
    DefaultVotePauseSeconds,
    DefaultEpochLengthSeconds,
    ValidGasTarget,
    InvalidGasTargetHigh,
    InvalidGasTargetLow,
    InitialCreatorReward,
    ConsoleColors,
}