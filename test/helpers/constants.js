const { BN } = require("bn.js");

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
    SEED_ACCOUNT_CLAIMED: "SeedAccountClaimed",
    VOTER_REWARD_CALCULATED: "VoterRewardCalculated",
    SUPPORTER_TOKENS_CLAIMED: "SupporterTokensClaimed",
    POOL_TOKENS_WITHDRAWN: "PoolTokensWithdrawn",
    SERIALIZED_EGL_CALCULATED: "SerializedEglCalculated",
    SEED_ACCOUNT_ADDED: "SeedAccountAdded"
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
const DefaultVotePauseSeconds = 300;
const DefaultEpochLengthSeconds = 604800; 

/***************************************************************/
/**** Assumes default block gas limit in ganache of 6721975 ****/
/***************************************************************/
const ValidGasTarget = 7000000;
const InvalidGasTargetHigh = 13000000;
const InvalidGasTargetLow = 1000000;

module.exports = {
    BN,
    EventType,
    ZeroAddress,
    DefaultVotePauseSeconds,
    DefaultEpochLengthSeconds,
    ValidGasTarget,
    InvalidGasTargetHigh,
    InvalidGasTargetLow,
    ConsoleColors,    
}