const { expectRevert, time } = require("@openzeppelin/test-helpers");
const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");
const MockEglGenesis = artifacts.require("./helpers/MockEglGenesis.sol");
const MockBalancerPoolToken = artifacts.require("./helpers/MockBalancerPoolToken.sol");

const {
    BN,
    EventType,
    VoterAttributes,
    ZeroAddress,
    DefaultVotePauseSeconds,
    DefaultEpochLengthSeconds,
    ValidGasTarget,
    InvalidGasTargetHigh,
    InvalidGasTargetLow,
    InitialCreatorReward,
} = require("./helpers/constants");

const {
    sleep, 
    populateEventDataFromLogs,
    getBlockTimestamp,
    populateAllEventDataFromLogs,
    getAllEventsForType,
} = require("./helpers/helper-functions")

contract("EglTests", (accounts) => {
    const [
        _deployer, 
        _voter1, _voter2, _voter3, _voter4NoAllowance, 
        _creator, 
        _seed1, _seed2, 
        _supporter1, _supporter2
    ] = accounts;
    const SEED_ACCOUNTS = [
        _seed1, 
        _seed2
    ];
    const SEED_AMOUNTS = [
        web3.utils.toWei("2500000"), 
        web3.utils.toWei("2500000")
    ];
    const CREATOR_REWARDS_ACCOUNT = _creator;
    
    let eglTokenInstance;
    let eglContractInstance;
    let mockEglGenesisInstance;
    let mockBalancerPoolTokenInstance;
    let eglContractDeployBlockNumber;
    let eglContractDeployGasLimit;
    let initEvent;

    async function castSimpleVotes(...voteValues) {
        return await Promise.all(
            voteValues.map(async (voteValues) => {
                return await eglContractInstance.vote(
                    voteValues[0],
                    web3.utils.toWei(voteValues[1]),
                    voteValues[2],
                    { from: voteValues[3] }
                );
            })
        );
    }

    async function getVoteAmount(percent) {
        let tokensInCirculation = await eglContractInstance.tokensInCirculation();            
        let voteTotalFor30Percent = tokensInCirculation.mul(new BN(percent)).div(new BN("100"));
        
        let epochVoteTotal = await eglContractInstance.votesTotal(0);            
        return voteTotalFor30Percent.sub(epochVoteTotal)        
    }

    beforeEach(async () => {             
        let totalTokenSupply = new BN(web3.utils.toWei("4000000000"));
        eglTokenInstance = await EglToken.new();
        await eglTokenInstance.initialize("EthereumGasLimit", "EGL", totalTokenSupply);

        mockEglGenesisInstance = await MockEglGenesis.new(accounts[1]);
        await mockEglGenesisInstance.sendTransaction({from: _supporter1, value: web3.utils.toWei("0.1")});
        await mockEglGenesisInstance.sendTransaction({from: _supporter2, value: web3.utils.toWei("1.65")});
        await eglTokenInstance.transfer(
            accounts[1],
            web3.utils.toWei("750000000"),
            { from: _deployer }
        )

        mockBalancerPoolTokenInstance = await MockBalancerPoolToken.new();
        await mockBalancerPoolTokenInstance.initialize("BalancerPoolToken", "BPT", web3.utils.toWei("10000"));        
        
        eglContractInstance = await EglContract.new();        
        
        let eglContractDeploymentHash = eglContractInstance.transactionHash;
        let eglContractDeploymentTransaction = await web3.eth.getTransaction(eglContractDeploymentHash);
        eglContractDeployBlockNumber = eglContractDeploymentTransaction.blockNumber;
        let eglContractDeploymentBlock = await web3.eth.getBlock(eglContractDeployBlockNumber);
        let eglContractDeploymentTimestamp = eglContractDeploymentBlock.timestamp;        
        eglContractDeployGasLimit = eglContractDeploymentBlock.gasLimit;

        let txReceipt = await eglContractInstance.initialize(
            eglTokenInstance.address,
            mockBalancerPoolTokenInstance.address,
            mockEglGenesisInstance.address,
            eglContractDeploymentTimestamp,
            DefaultVotePauseSeconds,
            DefaultEpochLengthSeconds,
            SEED_ACCOUNTS,
            SEED_AMOUNTS,
            CREATOR_REWARDS_ACCOUNT
        );

        let remainingTokenBalance = await eglTokenInstance.balanceOf(_deployer);
        await eglTokenInstance.transfer(eglContractInstance.address, remainingTokenBalance.toString(), { from: _deployer });
        await mockBalancerPoolTokenInstance.transfer(eglContractInstance.address, web3.utils.toWei("10000"), { from: _deployer });
      
        initEvent = populateAllEventDataFromLogs(txReceipt, EventType.INITIALIZED)[0];        
    });

    describe.skip("Debug", function () {
        it("", async () => {
        });
    });
    describe("EGL Genesis Claims", function () {
        it("should be able to claim bonus EGL's", async () => {
            let supporter = await eglContractInstance.supporters(_supporter1);
            assert.equal(supporter.matches, "0", "Should have no matches before claim");
            
            let txReceipt = await eglContractInstance.claimSupporterEgls({ from: _supporter1 });
            let supporterTokensClaimedEvent = populateAllEventDataFromLogs(txReceipt, EventType.SUPPORTER_TOKENS_CLAIMED)[0];        
            
            supporter = await eglContractInstance.supporters(_supporter1);
            assert.equal(supporter.matches, "1", "Should have 1 match after claim");
            assert.isAbove(parseFloat(web3.utils.fromWei(supporter.poolTokens)), 0, "Should have more than 0 pool tokens");
            assert.isAbove(parseFloat(web3.utils.fromWei(supporter.lastEgl)), 0, "Last EGL should be greater than 0");
            assert.isAbove(parseFloat(web3.utils.fromWei(supporterTokensClaimedEvent.bonusEglsReceived)), 0, "Should receive bonus EGL's");

            // console.log("ETH:EGL ratio: ", web3.utils.fromWei(initEvent.ethEglRatio.toString()));
            // console.log("");

            // let txReceipt = await eglContractInstance.claimSupporterEgls({from: _supporter1});
            // let supporter = await eglContractInstance.supporters(_supporter1);
            // let originalContributor = await mockEglGenesisInstance.contributors(_supporter1);
            // console.log("Contribution Amount: ", web3.utils.fromWei(originalContributor.amount.toString()));
            // console.log("S1 Pool Tokens: ", web3.utils.fromWei(supporter.poolTokens.toString()));
            // console.log("S1 First Egl: ", web3.utils.fromWei(supporter.firstEgl.toString()));
            // console.log("S1 last Egl: ", web3.utils.fromWei(supporter.lastEgl.toString()));
            // supporterTokensClaimedEvent = populateAllEventDataFromLogs(txReceipt, "SupporterTokensClaimed")[0];
            // console.log("S1 Bonus Egls Received: ", web3.utils.fromWei(supporterTokensClaimedEvent.bonusEglsReceived.toString()));
            
            // let txReceipt2 = await eglContractInstance.claimSupporterEgls({from: _supporter2});
            // let supporter2 = await eglContractInstance.supporters(_supporter2);
            // let originalContributor2 = await mockEglGenesisInstance.contributors(_supporter2);
            // console.log("Contribution Amount: ", web3.utils.fromWei(originalContributor2.amount.toString()));
            // console.log("S2 Pool Tokens: ", web3.utils.fromWei(supporter2.poolTokens.toString()));
            // console.log("S2 First Egl: ", web3.utils.fromWei(supporter2.firstEgl.toString()));
            // console.log("S2 last Egl: ", web3.utils.fromWei(supporter2.lastEgl.toString()));
            // supporterTokensClaimedEvent2 = populateAllEventDataFromLogs(txReceipt2, "SupporterTokensClaimed")[0];
            // console.log("S2 Bonus Egls Received: ", web3.utils.fromWei(supporterTokensClaimedEvent2.bonusEglsReceived.toString()));
            
            // let txReceipt3 = await eglContractInstance.withdrawPoolTokens({from: _supporter1});
            // debugEvent = populateAllEventDataFromLogs(txReceipt3, EventType.POOL_TOKENS_WITHDRAWN)[0];
            // console.log("Event: ", debugEvent);
            // console.log("Intentional Error", debugEvent.noAttribute());
            // console.log("seconds passed: ", debugEvent.secondsPassed.toString());
            // console.log("timePassedPercentage: ", debugEvent.timePassedPercentage.toString());
            // console.log("releasedEgl: ", debugEvent.releasedEgl.toString());

            // let tx = await eglContractInstance.calculateCurrentEgl("93600")
            // let currentEglEvent = populateAllEventDataFromLogs(tx, "CurrentEglCalculated")[0];
            // let currentEglCalcEvent = populateAllEventDataFromLogs(tx, "Debug")[0];
            // console.log("Testable: Current Egl after 18001 seconds: ", web3.utils.fromWei(currentEglEvent.currentEgl.toString()));
            // console.log("Intentional Error", currentEglEvent.noAttribute());
        });
        it("should calculate amount of pool tokens due after claim", async () => {
            let bptRatio = new BN(initEvent.ethBptRatio);
            let expectedPoolTokens = web3.utils.fromWei(
                new BN(web3.utils.toWei("0.1"))
                .mul(bptRatio)
                .div(new BN(10).pow(new BN(18)))
            );
            let txReceipt = await eglContractInstance.claimSupporterEgls({ from: _supporter1 });            
            let supporterTokensClaimedEvent = populateAllEventDataFromLogs(txReceipt, EventType.SUPPORTER_TOKENS_CLAIMED)[0];
            assert.equal(
                parseFloat(web3.utils.fromWei(supporterTokensClaimedEvent.poolTokensReceived)), 
                expectedPoolTokens.toString(), 
                "Incorrect number of pool tokens received"
            );
        });
        it("should calculate the correct first and last serialized EGL's", async () => {
            await eglContractInstance.claimSupporterEgls({ from: _supporter2 });            
            let genesisContribution = await mockEglGenesisInstance.contributors(_supporter2);
            let expectedFirstEgl = (genesisContribution.cumulativeBalance)
                .sub(genesisContribution.amount)
                .mul(initEvent.ethEglRatio)
                .div(new BN(10).pow(new BN(18)));
            let expectedLastEgl = expectedFirstEgl
                .add(
                    (genesisContribution.amount)
                    .mul(initEvent.ethEglRatio)
                    .div(new BN(10).pow(new BN(18)))
                )
            let supporter = await eglContractInstance.supporters(_supporter2);

            assert.equal(
                web3.utils.fromWei(supporter.firstEgl), 
                web3.utils.fromWei(expectedFirstEgl.toString()), 
                "Incorrect first EGL calculated"
            );
            assert.equal(
                web3.utils.fromWei(supporter.lastEgl), 
                web3.utils.fromWei(expectedLastEgl.toString()), 
                "Incorrect last EGL calculated"
            );
        });
        it("should not be able to claim if already claimed", async () => {
            await eglContractInstance.claimSupporterEgls({ from: _supporter1 });  
            await expectRevert(
                eglContractInstance.claimSupporterEgls({ from: _supporter1 }),
                "EGL:ALREADY_CLAIMED"
            );          
        });
        it("should not be able to claim if not contributed to Genesis", async () => {
            await expectRevert(
                eglContractInstance.claimSupporterEgls({ from: _voter1 }),
                "EGL:NOT_CONTRIBUTED"
            );          
        });
    });

    describe("Initial Balances & Seed Accounts", function () {
        it("seed account tokens should be locked and not available to withdraw", async () => {
            assert.equal(
                await eglTokenInstance.balanceOf(_seed1),
                "0",
                "Seed 1 account tokens should still be locked"
            );
            assert.equal(
                await eglTokenInstance.balanceOf(_seed2),
                "0",
                "Seed 2 account tokens should still be locked"
            );
        });
        it("seed accounts should have tokens locked in voting", async () => {
            let seeders = [
                await eglContractInstance.voters(_seed1), 
                await eglContractInstance.voters(_seed2),
            ];
            let epochLength = parseInt(initEvent.epochLength);
            let expectedReleaseDate = parseInt(initEvent.firstEpochStartDate) + (52 * epochLength);

            seeders.forEach((seedAccount) => {
                assert.equal(
                    seedAccount[VoterAttributes.LOCKUP_DURATION],
                    "8",
                    "Incorrect seed account initial lockup duration"
                );
                assert.equal(
                    seedAccount[VoterAttributes.VOTE_EPOCH],
                    "0",
                    "Incorrect seed account initial vote epoch"
                );
                assert.equal(
                    seedAccount[VoterAttributes.RELEASE_DATE],
                    expectedReleaseDate,
                    "Incorrect seed account release date"
                );
                assert.equal(
                    seedAccount[VoterAttributes.TOKENS_LOCKED].toString(),
                    web3.utils.toWei("2500000"),
                    "Incorrect seed account tokens locked"
                );
                assert.equal(
                    seedAccount[VoterAttributes.GAS_TARGET],
                    eglContractDeployGasLimit,
                    "Incorrect seed account gas target"
                );
            });
        });
        it("seed account votes should be included in initial totals", async () => {
            for (let i = 0; i < 8; i++) {
                // Vote weight total for epoch
                assert.equal(
                    (await eglContractInstance.voteWeightsSum(i)).toString(),
                    web3.utils.toWei("40000000"),                    
                    "Incorrect initial vote weight sum - week " + i
                );

                // Gas target total for epoch
                assert.equal(
                    (await eglContractInstance.gasTargetSum(i)).toString(),
                    new BN(web3.utils.toWei("40000000")).mul(new BN(eglContractDeployGasLimit)).toString(),
                    "Incorrect initial gas target sum - week " + i
                );

                // Votes total for epoch
                assert.equal(
                    (await eglContractInstance.votesTotal(i)).toString(),
                    web3.utils.toWei("5000000"),
                    "Incorrect initial votes total - week " + i
                );

                // Voter reward total for epoch
                assert.equal(
                    (await eglContractInstance.voterRewardSums(i)).toString(),
                    web3.utils.toWei("40000000"),
                    "Incorrect initial voter reward sum - week " + i
                );
            }

            assert.equal(
                (await eglContractInstance.voterRewardSums(8)).toString(),
                "0",
                "Initial vote reward sums should be '0' - week 9"
            );

        });
        it("gift accounts should have a token balance but no locked tokens", async () => {
            assert.equal(
                await eglTokenInstance.balanceOf(_voter1),
                web3.utils.toWei("50000000"),
                "Account 1 should have free tokens"
            );
            assert.equal(
                await eglTokenInstance.balanceOf(_voter2),
                web3.utils.toWei("50000000"),
                "Account 2 should have free tokens"
            );

            let gifters = [
                await eglContractInstance.voters(_voter1), 
                await eglContractInstance.voters(_voter2),
            ];

            gifters.forEach((giftAccount) => {
                assert.equal(
                    giftAccount[VoterAttributes.TOKENS_LOCKED],
                    "0",
                    "Gifter account should not have any tokens locked"
                );
            });
        });
        it("no other accounts should have tokens locked in voting", async () => {
            let uninitializedAccounts = [
                await eglContractInstance.voters(_voter3),
                await eglContractInstance.voters(_voter4NoAllowance),
            ];

            uninitializedAccounts.forEach((uninitializedAccount) => {
                assert.equal(
                    uninitializedAccount[VoterAttributes.LOCKUP_DURATION],
                    "0",
                    "Uninitialized account should not have an initial lockup duration"
                );
                assert.equal(
                    uninitializedAccount[VoterAttributes.VOTE_EPOCH],
                    "0",
                    "Uninitialized account should not have an initial vote epoch"
                );
                assert.equal(
                    uninitializedAccount[VoterAttributes.RELEASE_DATE],
                    "0",
                    "Uninitialized account should not have an initial release date"
                );
                assert.equal(
                    uninitializedAccount[VoterAttributes.TOKENS_LOCKED],
                    "0",
                    "Uninitialized account should not have an initial tokens locked"
                );
                assert.equal(
                    uninitializedAccount[VoterAttributes.GAS_TARGET],
                    "0",
                    "Uninitialized account should not have an initial gas target"
                );
            });
        });
    });

    describe("EGL Vote", function () {
        it("should not allow voting with no tokens available", async () => {
            await expectRevert(
                eglContractInstance.vote(
                    ValidGasTarget,
                    web3.utils.toWei("1"),
                    1,
                    {from: _voter3}
                ),
                "EGL:INSUFFICIENT_EGL_BALANCE"
            );
        });
        it("should not allow voting without first giving an allowance to the EGL contract", async () => {
            await expectRevert(
                eglContractInstance.vote(
                    ValidGasTarget,
                    web3.utils.toWei("1"),
                    1,
                    {from: _voter1}
                ),
                "EGL:INSUFFICIENT_ALLOWANCE"
            );
        });
        it("should require at least 1 EGL per vote", async () => {
            await expectRevert(
                eglContractInstance.vote(
                    ValidGasTarget,
                    web3.utils.toWei("0.5"),
                    1,
                    {from: _voter1}
                ),
                "EGL:AMNT_TOO_LOW"
            );
        });
        it("should record valid vote", async () => {
            const VoteAmount = web3.utils.toWei("10");
            const VoteLockupDuration = 2;
            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                web3.utils.toWei("50000000"),
                {from: _voter1}
            );

            let txReceipt = await eglContractInstance.vote(
                ValidGasTarget,
                VoteAmount,
                VoteLockupDuration,
                {from: _voter1}
            );

            let voter = await eglContractInstance.voters(_voter1);
            let voteCallBlockTimestamp = await getBlockTimestamp(web3, txReceipt);

            assert.equal(
                voter[VoterAttributes.GAS_TARGET],
                ValidGasTarget,
                "Incorrect vote target stored after vote()"
            );
            assert.equal(
                voter[VoterAttributes.LOCKUP_DURATION],
                VoteLockupDuration.toString(),
                "Incorrect lockup duration stored after vote()"
            );
            assert.equal(
                voter[VoterAttributes.VOTE_EPOCH],
                "0",
                "Incorrect starting epoch stored after vote()"
            );
            assert.equal(
                voter[VoterAttributes.RELEASE_DATE],
                voteCallBlockTimestamp + VoteLockupDuration * DefaultEpochLengthSeconds,
                "Incorrect release date stored after vote()"
            );
            assert.equal(
                voter[VoterAttributes.TOKENS_LOCKED],
                VoteAmount,
                "Incorrect tokens locked stored for voter"
            );
        });
        it("should increase egl balance of contract after vote", async () => {
            let initialContractEglBalance = new BN(await eglTokenInstance.balanceOf(eglContractInstance.address));
            let voteAmount = new BN(web3.utils.toWei("10"));

            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                voteAmount.toString(),
                {from: _voter1}
            );

            await eglContractInstance.vote(
                ValidGasTarget,
                voteAmount.toString(),
                2,
                {from: _voter1}
            );            

            assert.equal(
                (await eglTokenInstance.balanceOf(eglContractInstance.address)).toString(),
                initialContractEglBalance.add(voteAmount).toString(),
                "Incorrect EglContract token balance after vote()"
            );
        });
        it("should add vote to existing totals", async () => {
            let voteAmount = new BN(web3.utils.toWei("10"));

            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                voteAmount.toString(),
                {from: _voter1}
            );

            await eglContractInstance.vote(
                ValidGasTarget,
                voteAmount.toString(),
                2,
                {from: _voter1}
            );            

            let voteWeight = voteAmount.mul(new BN("2"));
            let seedEpochGasTargetTotal = new BN(web3.utils.toWei("40000000")).mul(new BN(eglContractDeployGasLimit));
            // Include voters vote for 2 periods
            for (let i = 0; i < 2; i++) {
                // Vote weight total for epoch
                assert.equal(
                    (await eglContractInstance.voteWeightsSum(i)).toString(),
                    web3.utils.toWei("40000020"),
                    "Incorrect vote weight sum after vote - week " + i
                );

                // Gas target total for epoch
                assert.equal(
                    (await eglContractInstance.gasTargetSum(i)).toString(),
                    seedEpochGasTargetTotal.add(voteWeight.mul(new BN(ValidGasTarget))).toString(),
                    "Incorrect initial gas target sum - week " + i
                );

                // Votes total
                assert.equal(
                    (await eglContractInstance.votesTotal(i)).toString(),
                    web3.utils.toWei("5000010"),
                    "Incorrect votes total after vote() - week " + i
                );

                // Voter reward sums
                assert.equal(
                    (await eglContractInstance.voterRewardSums(i)).toString(),
                    web3.utils.toWei("40000020"),
                    "Incorrect voter reward sums after vote() - week " + i
                );
            }

            // Only seed votes left
            for (let i = 2; i < 8; i++) {
                // Vote weight total for epoch
                assert.equal(
                    (await eglContractInstance.voteWeightsSum(i)).toString(),
                    web3.utils.toWei("40000000"),
                    "Incorrect vote weight sum after vote - week " + i
                );

                // Gas target total for epoch
                assert.equal(
                    (await eglContractInstance.gasTargetSum(i)).toString(),
                    seedEpochGasTargetTotal.toString(),
                    "Incorrect initial gas target sum - week " + i
                );

                // Votes total
                assert.equal(
                    (await eglContractInstance.votesTotal(i)).toString(),
                    web3.utils.toWei("5000000"),
                    "Incorrect votes total after vote() - week " + i
                );

                // Voter reward sums
                assert.equal(
                    (await eglContractInstance.voterRewardSums(i)).toString(),
                    web3.utils.toWei("40000000"),
                    "Incorrect voter reward sums after vote() - week " + i
                );
            }
        });
        it("should not be able to vote if a vote already exists for user", async () => {
            let voteAmount = new BN(web3.utils.toWei("1"));
            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                web3.utils.toWei("2"),
                {from: _voter1}
            );
            await eglContractInstance.vote(
                ValidGasTarget,
                voteAmount.toString(),
                1,
                {from: _voter1}
            );
            await expectRevert(
                eglContractInstance.vote(
                    ValidGasTarget,
                    voteAmount.toString(),
                    1,
                    {from: _voter1}
                ),
                "EGL:ALREADY_VOTED"
            );
        });
        it("should not be able to vote if gas target outside current gas limit tolerance", async () => {
            let voteAmount = new BN(web3.utils.toWei("1"));
            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                voteAmount.toString(),
                {from: _voter1}
            );
            await expectRevert(
                eglContractInstance.vote(
                    InvalidGasTargetHigh,
                    voteAmount.toString(),
                    1,
                    {from: _voter1}
                ),
                "EGL:INVALID_GAS_TARGET."
            );

            await expectRevert(
                eglContractInstance.vote(
                    InvalidGasTargetLow,
                    voteAmount.toString(),
                    1,
                    {from: _voter1}
                ),
                "EGL:INVALID_GAS_TARGET"
            );
        });
        it("should not be able to vote if invalid lockup duration specified", async () => {
            let voteAmount = new BN(web3.utils.toWei("1"));
            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                voteAmount.toString(),
                {from: _voter1}
            );
            await expectRevert(
                eglContractInstance.vote(
                    ValidGasTarget,
                    voteAmount.toString(),
                    9,
                    {from: _voter1}
                ),
                "EGL:INVALID_LOCKUP"
            );
            await expectRevert(
                eglContractInstance.vote(
                    ValidGasTarget,
                    voteAmount.toString(),
                    0,
                    {from: _voter1}
                ),
                "EGL:INVALID_LOCKUP"
            );
        });
        it.skip("should record votes in different epochs and update totals for relevant periods", async () => {

        });
        it.skip("should emit 'Vote' event with relevant details of the vote", async () => {

        });
    });

    describe("ReVote", function () {
        it("should not change release date of seeder account after re-vote", async () => {
            let seed = await eglContractInstance.voters(_seed1);
            let originalReleaseDate = seed[VoterAttributes.RELEASE_DATE];

            await eglContractInstance.reVote(
                ValidGasTarget,
                "0",
                4,
                {from: _seed1}
            );
            seed = await eglContractInstance.voters(_seed1);
            assert.equal(
                seed[VoterAttributes.RELEASE_DATE],
                originalReleaseDate.toNumber(),
                "Incorrect release date after re-vote()"
            );
        });
        it("should add to existing locked EGL's on re-vote if EGL amount > 0 for seeder account", async () => {
            let voteAmount = new BN(web3.utils.toWei("2"));
            let reVoteAmount = new BN(web3.utils.toWei("1"));
            
            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                (voteAmount.add(reVoteAmount)).toString(),
                {from: _voter1}
            );

            await eglContractInstance.vote(
                ValidGasTarget,
                voteAmount.toString(),
                4,
                {from: _voter1}
            );

            let initialContractEglBalance = new BN(
                await eglTokenInstance.balanceOf(eglContractInstance.address)
            );

            let voter = await eglContractInstance.voters(_voter1);
            let originalLockedTokens = new BN(voter[VoterAttributes.TOKENS_LOCKED]);

            await eglContractInstance.reVote(
                ValidGasTarget,
                reVoteAmount.toString(),
                3,
                {from: _voter1}
            );

            voter = await eglContractInstance.voters(_voter1);
            assert.notEqual(
                voter[VoterAttributes.TOKENS_LOCKED],
                originalLockedTokens.toString(),
                "Tokens locked should not be the same as original vote"
            );
            assert.equal(
                voter[VoterAttributes.TOKENS_LOCKED],
                web3.utils.toWei("3"),
                "Incorrect locked tokens after re-vote()"
            );

            assert.equal(
                (await eglTokenInstance.balanceOf(eglContractInstance.address)).toString(),
                initialContractEglBalance.add(reVoteAmount).toString(),
                "Incorrect EglContract token balance after re-vote()"
            );
        });
        it("should allow changing of lockup duration on re-vote in same epoch", async () => {
            let newLockupDuration = 4;
            let seed = await eglContractInstance.voters(_seed1);
            let originalLockupDuration = seed[VoterAttributes.LOCKUP_DURATION];

            await eglContractInstance.reVote(
                7325000,
                "0",
                newLockupDuration,
                {from: _seed1}
            );

            seed = await eglContractInstance.voters(_seed1);
            assert.notEqual(
                seed[VoterAttributes.LOCKUP_DURATION],
                originalLockupDuration,
                "Lockup duration should not the same as the original vote"
            )
            assert.equal(
                seed[VoterAttributes.LOCKUP_DURATION],
                newLockupDuration,
                "Incorrect lockup duration after re-vote()"
            );

            // Totals
            for (let i = 0; i < 4; i++) {
                // Vote weight total for epoch
                assert.equal(
                    (await eglContractInstance.voteWeightsSum(i)).toString(),
                    web3.utils.toWei("30000000"),
                    "Incorrect vote weight sum after re-vote - week " + i
                );

                // TODO: Test gasTargetSum

                // Votes total
                assert.equal(
                    (await eglContractInstance.votesTotal(i)).toString(),
                    web3.utils.toWei("5000000"),
                    "Incorrect votes total after re-vote() - week " + i
                );

                // Voter reward sums
                assert.equal(
                    (await eglContractInstance.voterRewardSums(i)).toString(),
                    web3.utils.toWei("30000000"),
                    "Incorrect voter reward sums after re-vote() - week " + i
                );
            }

            for (let i = 4; i < 8; i++) {
                // Vote weight total for epoch
                assert.equal(
                    (await eglContractInstance.voteWeightsSum(i)).toString(),
                    web3.utils.toWei("20000000"),
                    "Incorrect vote weight sum after re-vote - week " + i
                );

                // Votes total
                assert.equal(
                    (await eglContractInstance.votesTotal(i)).toString(),
                    web3.utils.toWei("2500000"),
                    "Incorrect votes total after vote() - week " + i
                );

                // Voter reward sums
                assert.equal(
                    (await eglContractInstance.voterRewardSums(i)).toString(),
                    web3.utils.toWei("20000000"),
                    "Incorrect voter reward sums after vote() - week " + i
                );
            }
        });
        it("should allow changing of gas target amount on re-vote in same epoch", async () => {
            let seed = await eglContractInstance.voters(_seed1);
            let originalGasTarget = seed[VoterAttributes.GAS_TARGET];

            await eglContractInstance.reVote(
                7325000,
                "0",
                "4",
                {from: _seed1}
            );

            seed = await eglContractInstance.voters(_seed1);
            assert.notEqual(
                seed[VoterAttributes.GAS_TARGET],
                originalGasTarget,
                "Gas target should not the same as the original vote"
            )
            assert.equal(
                seed[VoterAttributes.GAS_TARGET],
                7325000,
                "Incorrect gas target after re-vote()"
            );

        });
        it("user account can re-vote with additional tokens and extend lockup period (same epoch)", async () => {
            const REVOTE_AMOUNT = web3.utils.toWei("60");
            const REVOTE_LOCKUP_DURATION = 4;
            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                web3.utils.toWei("50000000"),
                {from: _voter1}
            );

            let [txReceipt] = await castSimpleVotes([
                ValidGasTarget,
                "10",
                2,
                _voter1,
            ]);

            let initialContractEglBalance = new BN(
                await eglTokenInstance.balanceOf(eglContractInstance.address)
            );
            let voteBlockTimestamp = (
                await web3.eth.getBlock(txReceipt.receipt.blockNumber)
            ).timestamp;
            let expectedReleaseDate = new BN(
                voteBlockTimestamp + REVOTE_LOCKUP_DURATION * DefaultEpochLengthSeconds
            );

            await eglContractInstance.reVote(
                ValidGasTarget,
                REVOTE_AMOUNT,
                REVOTE_LOCKUP_DURATION,
                {from: _voter1}
            );
            let voter = await eglContractInstance.voters(_voter1);

            assert.equal(
                voter[VoterAttributes.LOCKUP_DURATION],
                REVOTE_LOCKUP_DURATION,
                "Incorrect lockup duration after re-vote()"
            );
            assert.equal(
                voter[VoterAttributes.VOTE_EPOCH],
                "0",
                "Incorrect starting epoch after re-vote()"
            );
            assert.approximately(
                voter[VoterAttributes.RELEASE_DATE].toNumber(),
                expectedReleaseDate.toNumber(),
                1,
                "Incorrect release date after re-vote()"
            );
            assert.equal(
                voter[VoterAttributes.TOKENS_LOCKED],
                web3.utils.toWei("70"),
                "Incorrect tokens locked after re-vote()"
            );

            //Token transfer
            assert.equal(
                (
                    await eglTokenInstance.balanceOf(eglContractInstance.address)
                ).toString(),
                initialContractEglBalance.add(new BN(REVOTE_AMOUNT)).toString(),
                "Incorrect EglContract token balance"
            );

            // Totals
            for (let i = 0; i < 4; i++) {
                // Vote weight total for epoch
                assert.equal(
                    (await eglContractInstance.voteWeightsSum(i)).toString(),
                    web3.utils.toWei("40000280"),
                    "Incorrect vote weight sum after re-vote - week " + i
                );

                // Votes total
                assert.equal(
                    (await eglContractInstance.votesTotal(i)).toString(),
                    web3.utils.toWei("5000070"),
                    "Incorrect votes total after re-vote() - week " + i
                );

                // Voter reward sums
                assert.equal(
                    (await eglContractInstance.voterRewardSums(i)).toString(),
                    web3.utils.toWei("40000280"),
                    "Incorrect voter reward sums after re-vote() - week " + i
                );
            }

            for (let i = 4; i < 8; i++) {
                // Vote weight total for epoch
                assert.equal(
                    (await eglContractInstance.voteWeightsSum(i)).toString(),
                    web3.utils.toWei("40000000"),
                    "Incorrect vote weight sum after re-vote - week " + i
                );

                // Votes total
                assert.equal(
                    (await eglContractInstance.votesTotal(i)).toString(),
                    web3.utils.toWei("5000000"),
                    "Incorrect votes total after vote() - week " + i
                );

                // Voter reward sums
                assert.equal(
                    (await eglContractInstance.voterRewardSums(i)).toString(),
                    web3.utils.toWei("40000000"),
                    "Incorrect voter reward sums after vote() - week " + i
                );
            }
        });
        it("should fail re-vote validations", async () => {
            await expectRevert(
                eglContractInstance.reVote(
                    ValidGasTarget,
                    web3.utils.toWei("1"),
                    1,
                    {from: _voter1}
                ),
                "EGL:NOT_VOTED"
            );

            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                web3.utils.toWei("20000000"),
                {from: _voter1}
            );
            await castSimpleVotes([ValidGasTarget, "10", 2, _voter1]);

            await expectRevert(
                eglContractInstance.reVote(
                    ValidGasTarget,
                    web3.utils.toWei("0.1"),
                    1,
                    {from: _voter1}
                ),
                "EGL:AMNT_TOO_LOW"
            );

            await expectRevert(
                eglContractInstance.reVote(
                    ValidGasTarget,
                    web3.utils.toWei("100000000"),
                    1,
                    {from: _voter1}
                ),
                "EGL:INSUFFICIENT_EGL_BALANCE"
            );

            await expectRevert(
                eglContractInstance.reVote(
                    ValidGasTarget,
                    web3.utils.toWei("30000000"),
                    1,
                    {from: _voter1}
                ),
                "EGL:INSUFFICIENT_ALLOWANCE"
            );
        });
    });

    describe("Tally Votes", function () {
        it("should revert if epoch has not ended", async () => {
            let currentEpoch = await eglContractInstance.currentEpoch();
            assert.equal(currentEpoch, "0", "Incorrect epoch before votes tallied");
            await expectRevert(
                eglContractInstance.tallyVotes({from: _voter1}),
                "EGL:VOTE_NOT_ENDED"
            );
        });
        it("should set voting threshold to 30% for the first 52 epochs", async () => {
            for (let i = 0; i <= 52; i++) {
                await time.increase(DefaultEpochLengthSeconds + 10);
                let txReceipt = await eglContractInstance.tallyVotes({ from: accounts[9] })
                let tallyVotesEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED)[0];
                assert.equal(web3.utils.fromWei(tallyVotesEvent.votingThreshold.toString()), "30", "Vote threshold should be 30%")
            }
        });
        it("should increase vote threshold from 30% to a max of 50% over 3 years (runs long)", async () => {
            let yearlyThreshold = 30;
            for (let i = 0; i <= 52 * 4; i++) {
                await time.increase(DefaultEpochLengthSeconds + 10);
                let txReceipt = await eglContractInstance.tallyVotes({ from: accounts[9] })
                if (i > 0 && i % 52 === 0) {
                    let tallyVotesEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED)[0];
                    assert.approximately(
                        parseFloat(web3.utils.fromWei(tallyVotesEvent.votingThreshold)), 
                        yearlyThreshold, 
                        0.0000001,
                        "Incorrect vote threshold percentage after"
                    );
                    yearlyThreshold = yearlyThreshold === 50 ? yearlyThreshold : yearlyThreshold + 6.66666666666666667;
                }
            }
        });
        it("should pass vote if vote percentage greater than the vote threshold", async () => {
            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                web3.utils.toWei("50000000"),
                {from: _voter1}
            );

            let voteAmount = await getVoteAmount("31");
            await castSimpleVotes([ValidGasTarget, (parseFloat(web3.utils.fromWei(voteAmount))).toString(), 1, _voter1]);
            epochVoteTotal = await eglContractInstance.votesTotal(0);            
            await time.increase(DefaultEpochLengthSeconds + 10)
            let txReceipt = await eglContractInstance.tallyVotes({ from: accounts[9] })

            let votesThresholdMetEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_MET)[0];
            assert.exists(votesThresholdMetEvent, "Expected 'VoteThresholdMet' event");
            assert.isAtLeast(parseFloat(web3.utils.fromWei(votesThresholdMetEvent.actualVotePercentage)), 30, "Vote percentage should be above 30%")

        });
        it("should fail vote if vote percentage less than the vote threshold", async () => {
            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                web3.utils.toWei("50000000"),
                {from: _voter1}
            );

            let voteAmount = await getVoteAmount("29");
            await castSimpleVotes([ValidGasTarget, (parseFloat(web3.utils.fromWei(voteAmount.toString()))).toString(), 1, _voter1]);
            await time.increase(DefaultEpochLengthSeconds + 10)
            let txReceipt = await eglContractInstance.tallyVotes({ from: accounts[9] })

            let votesThresholdFailedEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_FAILED)[0];
            assert.isBelow(parseFloat(web3.utils.fromWei(votesThresholdFailedEvent.actualVotePercentage)), 30, "Vote percentage should be below 30%")
            assert.exists(votesThresholdFailedEvent, "Expected 'VoteThresholdFailed' event");
        });
        it("should adjust EGL to average gas target value if vote passes", async () => {
            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                web3.utils.toWei("50000000"),
                {from: _voter1}
            );

            let voteAmount = await getVoteAmount("30");
            await castSimpleVotes([9000000, parseFloat(web3.utils.fromWei(voteAmount)).toString(), 8, _voter1]);
            await time.increase(DefaultEpochLengthSeconds + 10)
            let txReceipt = await eglContractInstance.tallyVotes({ from: accounts[9] })

            let votesThresholdMetEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_MET)[0];
            let gasTargetSum = await eglContractInstance.gasTargetSum(0);
            let voteWeightSum = await eglContractInstance.voteWeightsSum(0);
            let averageGasTarget = gasTargetSum.div(voteWeightSum);
            let expectedDesiredEgl = eglContractDeployGasLimit + Math.min(averageGasTarget - eglContractDeployGasLimit, 1000000);
            assert.equal(votesThresholdMetEvent.desiredEgl.toString(), expectedDesiredEgl.toString(), "Incorrect desired EGL amount calculated")
        });
        it("should not adjust EGL if vote fails and still within grace period", async () => {
            eglTokenInstance.increaseAllowance(eglContractInstance.address, web3.utils.toWei("50000000"), { from: _voter1 });
            eglTokenInstance.increaseAllowance(eglContractInstance.address, web3.utils.toWei("50000000"), { from: _voter2 });

            // Vote to increase EGL
            let voteAmount = await getVoteAmount("30");         
            await castSimpleVotes(
                [10500000, parseFloat(web3.utils.fromWei(voteAmount)).toString(), 1, _voter1],
                [10500000, parseFloat(web3.utils.fromWei(voteAmount)).toString(), 1, _voter2],
            );
            await time.increase(DefaultEpochLengthSeconds + 10)
            let txReceipt = await eglContractInstance.tallyVotes({ from: accounts[9] })
            let votesThresholdMetEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_MET)[0];
            let newDesiredEgl = votesThresholdMetEvent.desiredEgl;

            for (let i = 1; i < 6; i++) {
                await time.increase(DefaultEpochLengthSeconds + 10);
                let txReceipt = await eglContractInstance.tallyVotes({ from: accounts[9] })
                let votesThresholdFailedEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_FAILED)[0];
                assert.equal(votesThresholdFailedEvent.desiredEgl.toString(), newDesiredEgl.toString(), "Failed vote during grace period should not change desired EGL");
            }
        });
        it("should adjust EGL if vote fails and grace period is over", async () => {
            eglTokenInstance.increaseAllowance(eglContractInstance.address, web3.utils.toWei("50000000"), { from: _voter1 });
            eglTokenInstance.increaseAllowance(eglContractInstance.address, web3.utils.toWei("50000000"), { from: _voter2 });

            // Vote to increase EGL
            let voteAmount = await getVoteAmount("30");
            await castSimpleVotes(
                [10500000, parseFloat(web3.utils.fromWei(voteAmount)).toString(), 1, _voter1],
                [10500000, parseFloat(web3.utils.fromWei(voteAmount)).toString(), 1, _voter2],
            );
            await time.increase(DefaultEpochLengthSeconds + 10)
            let txReceipt = await eglContractInstance.tallyVotes({ from: accounts[9] })
            let votesThresholdMetEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_MET)[0];
            let newDesiredEgl = votesThresholdMetEvent.desiredEgl;

            // End grace period
            for (let i = 1; i < 6; i++) {
                await time.increase(DefaultEpochLengthSeconds + 10);
                await eglContractInstance.tallyVotes({ from: accounts[9] })
            }

            await time.increase(DefaultEpochLengthSeconds + 10);
            txReceipt = await eglContractInstance.tallyVotes({ from: accounts[9] })
            votesThresholdFailedEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_FAILED)[0];
            let initialEgl = await eglContractInstance.initialEgl();
            let expectedDesiredEgl = Math.trunc(newDesiredEgl.toNumber() + ((initialEgl.toNumber() - newDesiredEgl.toNumber()) * 0.05));
            assert.approximately(
                parseFloat(votesThresholdFailedEvent.desiredEgl.toString()), 
                parseFloat(expectedDesiredEgl.toString()), 
                1,
                "Incorrect desired EGL after failed vote"
            );
        });

        it("should issue creator rewards starting from epoch 10", async () => {
            for (let i = 0; i < 9; i++) {
                await time.increase(DefaultEpochLengthSeconds + 10);
                await eglContractInstance.tallyVotes({ from: accounts[9] })
            }

            let creatorRewardsClaimedEvents = await getAllEventsForType(EventType.CREATOR_REWARDS_CLAIMED, eglContractInstance);
            assert.equal(creatorRewardsClaimedEvents.length, 0, "Should not have any creator reward events yet");

            await time.increase(DefaultEpochLengthSeconds + 10);
            let txReceipts = await eglContractInstance.tallyVotes({ from: accounts[9] })

            let creatorRewardEvent = populateAllEventDataFromLogs(txReceipts, EventType.CREATOR_REWARDS_CLAIMED)[0];
            assert.equal(creatorRewardEvent.creatorRewardAddress, CREATOR_REWARDS_ACCOUNT, "Incorrect creator reward address");
            assert.equal(creatorRewardEvent.amountClaimed.toString(), InitialCreatorReward.toString(), "Incorrect creator reward amount");    
        });
    });

    describe("Withdraw", function () {
        it.skip("account can withdraw tokens after lockup period has elapsed", async () => {
            let initialContractEglBalance = (
                await eglTokenInstance.balanceOf(eglContractInstance.address)
            ).toString();
            let initialVoterBalance = (
                await eglTokenInstance.balanceOf(_voter1)
            ).toString();
            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                web3.utils.toWei("50000000"),
                {from: _voter1}
            );

            let [voteTxReceipt] = await castSimpleVotes([
                ValidGasTarget,
                "10",
                1,
                _voter1,
            ]);

            let voter = await eglContractInstance.voters(_voter1);
            let expectedReleaseDate =
                (await getBlockTimestamp(web3)) + 2 * DefaultEpochLengthSeconds;
            console.log(
                "Release date on chain: ",
                voter[VoterAttributes.RELEASE_DATE].toString()
            );
            assert.approximately(
                voter[VoterAttributes.RELEASE_DATE].toNumber(),
                expectedReleaseDate,
                5,
                "Incorrect release date"
            );

            await sleep(DefaultEpochLengthSeconds + 1);
            await eglContractInstance.tallyVotes({from: _voter2});

            let withdrawTxReceipt = await eglContractInstance.withdraw({
                from: _voter1,
            });
            let withdrawEvents = populateEventDataFromLogs(withdrawTxReceipt, EventType.WITHDRAW);

            assert.equal(
                withdrawEvents.tokensLocked.toString(),
                web3.utils.toWei("10"),
                "Incorrect original voter amount"
            );

            console.log(
                "Voter reward: ",
                withdrawEvents.rewardTokens.toString()
            );
            let expectedVoterReward = 0;
            // assert.equal(withdrawEvents[EventType.WITHDRAW].rewardTokens.toString, expectedVoterReward, "Incorrect original voter amount");

            // await eglContractInstance.reVote(
            //     VoteDirection.UP, web3.utils.toWei("5"), 2, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000",
            //     {from: _voter2}
            // );
            // voter = await eglContractInstance.voters(_voter2);
            //
            // assert.equal(voter[VoterAttributes.LOCKUP_DURATION], "2", "Incorrect lockup duration saved for voter");
            // assert.equal(voter[VoterAttributes.VOTE_EPOCH], "0", "Incorrect starting epoch saved for voter");
            // assert.equal(voter[VoterAttributes.RELEASE_DATE], expectedReleaseDate, "Incorrect release date saved for voter");
            // assert.equal(voter[VoterAttributes.TOKENS_LOCKED], web3.utils.toWei("7"), "Incorrect tokens locked for voter");
            //
            // //Token transfer
            // assert.equal(
            //     await eglTokenInstance.balanceOf(eglContractInstance.address),
            //     parseInt(initialContractEglBalance) + parseInt(web3.utils.toWei("37")),
            //     "Incorrect EglContract token balance"
            // );
            //
            // // Direction vote totals
            // assert.equal(
            //     (await eglContractInstance.directionVoteCount(VoteDirection.UP, 0)).toString(),
            //     web3.utils.toWei("34"),
            //     "Incorrect 'UP' vote count for vote period 0"
            // );
            // assert.equal(
            //     (await eglContractInstance.directionVoteCount(VoteDirection.UP, 2)).toString(),
            //     "0",
            //     "Incorrect 'UP' vote count for vote period 2"
            // );
            //
            // // Voter reward sums
            // assert.equal(
            //     (await eglContractInstance.voterRewardSums(0)).toString(), web3.utils.toWei("114"), "Incorrect reward sum for epoch 0"
            // );
            // assert.equal(
            //     (await eglContractInstance.voterRewardSums(1)).toString(), web3.utils.toWei("114"), "Incorrect reward sum for epoch 1"
            // );
            // assert.equal(
            //     (await eglContractInstance.voterRewardSums(2)).toString(), web3.utils.toWei("80"), "Incorrect reward sum for epoch 2"
            // );
            //
            // // Vote totals
            // assert.equal(
            //     (await eglContractInstance.votesTotal(0)).toString(), web3.utils.toWei("37"), "Incorrect reward sum for vote period 0"
            // );
            // assert.equal(
            //     (await eglContractInstance.votesTotal(1)).toString(), web3.utils.toWei("37"), "Incorrect reward sum for vote period 1"
            // );
            // assert.equal(
            //     (await eglContractInstance.votesTotal(2)).toString(), web3.utils.toWei("20"), "Incorrect reward sum for vote period 2"
            // );
        });
        it("should not be able to withdraw before lockup period elapsed", async () => {
            eglTokenInstance.increaseAllowance(eglContractInstance.address, web3.utils.toWei("50000000"), { from: _voter1 });
            await castSimpleVotes([ValidGasTarget, "10", 2, _voter1]);
            await expectRevert(
                eglContractInstance.withdraw({from: _voter1}),
                "EGL:NOT_RELEASE_DATE"
            );
        });
        it("should not be able to withdraw if not voted", async () => {
            await expectRevert(
                eglContractInstance.withdraw({from: _voter1}),
                "EGL:NOT_VOTED"
            );
        });
    });

    describe.skip("Sweep Pool Rewards", function () {
        it("should send block reward to coinbase account", async () => {
          let txReceipt = await eglContractInstance.sweepPoolRewards();
          let eventData = populateEventDataFromLogs(txReceipt, EventType.POOL_REWARD_SWEPT);
          console.log("blockReward: ", (eventData.blockReward).toString());
          console.log("proximityRewardPercent: ", (eventData.proximityRewardPercent).toString());
        });
    });
});