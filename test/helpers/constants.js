const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const { expectRevert, BN } = require("@openzeppelin/test-helpers");

const Contract = require("@truffle/contract");
const FactoryJson = require("@uniswap/v2-core/build/UniswapV2Factory.json")
const RouterJson = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const UniswapV2Factory = Contract(FactoryJson);
const UniswapV2Router = Contract(RouterJson);

const WethToken = artifacts.require("@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol")
const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");
const TestableEglContract = artifacts.require("./TestableEglContract.sol");

const EventType = {
    INITIALIZED: "Initialized",
    VOTE: "Vote",
    REVOTE: "ReVote",
    WITHDRAW: "Withdraw",
    VOTES_TALLIED: "VotesTallied",
    CREATOR_REWARDS_CLAIMED: "CreatorRewardsClaimed",
    VOTE_THRESHOLD_MET: "VoteThresholdMet",
    VOTE_THRESHOLD_FAILED: "VoteThresholdFailed",
    POOL_REWARD_SWEPT: "PoolRewardsSwept",
    CANDIDATE_VOTE_ADDED: "CandidateVoteAdded",
    CANDIDATE_VOTE_REMOVED: "CandidateVoteRemoved",
    CANDIDATE_VOTE_EVALUATED: "CandidateVoteEvaluated",
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

const ZeroAddress = "0x0000000000000000000000000000000000000000";
const DefaultEthToLaunch = web3.utils.toWei("5");
const DefaultVotePauseSeconds = 0;
const DefaultEpochLengthSeconds = 3; 

/***************************************************************/
/**** Assumes default block gas limit in ganache of 6721975 ****/
/***************************************************************/
const ValidGasTarget = 7000000;
const InvalidGasTargetHigh = 13000000;
const InvalidGasTargetLow = 1000000;

const InitialCreatorReward = new BN(web3.utils.toWei("500000000")).div(new BN("43"));   


module.exports = {
    expectRevert,
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
}