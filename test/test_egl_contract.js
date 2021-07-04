const { expectRevert, time } = require("@openzeppelin/test-helpers");
const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");
const MockEglGenesis = artifacts.require("./helpers/MockEglGenesis.sol");
const MockBalancerPoolToken = artifacts.require("./helpers/MockBalancerPoolToken.sol");

const {
    BN,
    EventType,
    DefaultVotePauseSeconds,
    DefaultEpochLengthSeconds,
    ValidGasTarget,
} = require("./helpers/constants");

const {
    populateEventDataFromLogs,
    populateAllEventDataFromLogs,
} = require("./helpers/helper-functions")

contract("EglVotingTests", (accounts) => {
    [
        _deployer, 
        _genesisOwner, 
        _seedAccount1, 
        _seedAccount2, 
        _genesisSupporter2, 
        _voter1, 
        _voter2, 
        _creatorRewardsAccount, 
        _genesisSupporter1, 
        _proxyAdmin
    ] = accounts;

    let seedAccounts = [
        _seedAccount1, 
        _seedAccount2
    ];
    let seedAmounts = [
        web3.utils.toWei("10000000"), 
        web3.utils.toWei("12000000")
    ];

    let eglContractDeployBlockNumber;
    let eglContractDeployGasLimit;
    let eglContractDeploymentBlock;
    let minLiquidityTokensLockup;
    let epochLength;
    let firstEpochStartDate;

    let eglTokenInstance;
    let eglContractInstance;
    let mockEglGenesisInstance;
    let mockBalancerPoolTokenInstance;
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
        await eglTokenInstance.initialize(_genesisOwner, "EthereumGasLimit", "EGL", totalTokenSupply);

        mockEglGenesisInstance = await MockEglGenesis.new(accounts[1]);
        await mockEglGenesisInstance.sendTransaction({from: _genesisSupporter1, value: web3.utils.toWei("0.1")});
        await mockEglGenesisInstance.sendTransaction({from: _genesisSupporter2, value: web3.utils.toWei("1.65")});

        mockBalancerPoolTokenInstance = await MockBalancerPoolToken.new();
        await mockBalancerPoolTokenInstance.initialize("BalancerPoolToken", "BPT", web3.utils.toWei("75000000"));        
        await mockBalancerPoolTokenInstance.transfer(
            _genesisOwner,
            web3.utils.toWei("75000000"),
            { from: _deployer }
        )
        
        eglContractInstance = await EglContract.new();        
        
        let eglContractDeploymentHash = eglContractInstance.transactionHash;
        let eglContractDeploymentTransaction = await web3.eth.getTransaction(eglContractDeploymentHash);        
        eglContractDeployBlockNumber = eglContractDeploymentTransaction.blockNumber;
        eglContractDeploymentBlock = await web3.eth.getBlock(eglContractDeployBlockNumber);
        let eglContractDeploymentTimestamp = eglContractDeploymentBlock.timestamp;        
        eglContractDeployGasLimit = eglContractDeploymentBlock.gasLimit;

        let txReceipt = await eglContractInstance.initialize(
            eglTokenInstance.address,
            mockBalancerPoolTokenInstance.address,
            mockEglGenesisInstance.address,
            eglContractDeploymentTimestamp,
            DefaultVotePauseSeconds,
            DefaultEpochLengthSeconds,
            seedAccounts,
            seedAmounts,
            _creatorRewardsAccount
        );

        await eglTokenInstance.transfer(eglContractInstance.address, web3.utils.toWei("3250000000"), { from: _genesisOwner });
        await mockBalancerPoolTokenInstance.transfer(eglContractInstance.address, web3.utils.toWei("75000000"), { from: _genesisOwner });

        await eglTokenInstance.transfer(_voter1, web3.utils.toWei("250000000"), { from: accounts[1] })
        await eglTokenInstance.transfer(_voter2, web3.utils.toWei("250000000"), { from: accounts[1] })
        await eglTokenInstance.increaseAllowance(eglContractInstance.address, web3.utils.toWei("250000000"), { from: _voter1 });
        await eglTokenInstance.increaseAllowance(eglContractInstance.address, web3.utils.toWei("250000000"), { from: _voter2 });

        initEvent = populateAllEventDataFromLogs(txReceipt, EventType.INITIALIZED)[0];        

        minLiquidityTokensLockup = parseInt(initEvent.minLiquidityTokensLockup);
        epochLength = parseInt(initEvent.epochLength);
        firstEpochStartDate = parseInt(initEvent.firstEpochStartDate);
    });

    describe("Claim Genesis EGLs (Bonus EGLs)", function () {
        it("should not be able to claim if genesis not ended", async () => {
            await mockEglGenesisInstance.setCanContribute(true)
            await expectRevert(
                eglContractInstance.claimSupporterEgls(7000000, 2, { from: _genesisSupporter1 }),
                "EGL:GENESIS_LOCKED"
            )
        });
        it("should not be able to claim if genesis is refunding", async () => {
            await mockEglGenesisInstance.setCanWithdraw(true)
            await expectRevert(
                eglContractInstance.claimSupporterEgls(7000000, 2, { from: _genesisSupporter1 }),
                "EGL:GENESIS_LOCKED"
            )
        });
        it("should not be able to claim twice", async () => {
            await eglContractInstance.claimSupporterEgls(7000000, 2, { from: _genesisSupporter1 });
            await expectRevert(
                eglContractInstance.claimSupporterEgls(7000000, 2, { from: _genesisSupporter1 }),
                "EGL:ALREADY_CLAIMED"
            )
        });
        it("should not be able to claim if not contributed in genesis", async () => {
            await expectRevert(
                eglContractInstance.claimSupporterEgls(7000000, 2, { from: _voter1 }),
                "EGL:NOT_CONTRIBUTED"
            )
        });
        it("should call tally votes if epoch has expired", async () => {
            await time.increase(DefaultEpochLengthSeconds + 60);
            let txReceipt = await eglContractInstance.claimSupporterEgls(7200000, 1, { from: _genesisSupporter1 });
            let events = populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED);
            assert.equal(events.length, "1", "Tally votes not called");
        });
        it("should be able to claim bonus EGL's", async () => {
            // See CLAIM BONUS EGLS in 'files/calculations.txt' for formulas to calculate expected values
            let txReceipt = await eglContractInstance.claimSupporterEgls(7000000, 2, { from: _genesisSupporter1 });

            let events = populateAllEventDataFromLogs(txReceipt, EventType.SUPPORTER_TOKENS_CLAIMED);
            let actualBonusEgls = parseFloat(web3.utils.fromWei(events[0].bonusEglsReceived.toString())).toFixed(2)            
            assert.equal(actualBonusEgls, "5331.11", "Incorrect bonus EGLs calculated");
            let actualBpts = parseFloat(web3.utils.fromWei(events[0].poolTokensReceived.toString())).toFixed(9)
            assert.equal(actualBpts, "4285714.285714285", "Incorrect BPT's calculated");

            let supporter = await eglContractInstance.supporters(_genesisSupporter1);
            assert.equal(supporter.claimed, "1", "Should have 1 match after claim");            
        });
        it("should lock claimed tokens in a vote", async () => {
            // See CLAIM BONUS EGLS in 'files/calculations.txt' for formulas to calculate expected values
            let txReceipt = await eglContractInstance.claimSupporterEgls(7000000, 2, { from: _genesisSupporter1 });

            events = populateAllEventDataFromLogs(txReceipt, EventType.VOTE);
            assert.equal(events.length, "1", "No vote entered for genesis supporter");
        });
        it("should not be able to claim Bonus EGL's if contract paused", async () => {
            await eglContractInstance.pauseEgl({ from: _deployer });

            await expectRevert(
                eglContractInstance.claimSupporterEgls(7000000, 2, { from: _genesisSupporter1 }),
                "Pausable: paused"
            )
        });
    });
    describe("Claim Seeder EGLs", function () {
        it("should not be able to claim seeder tokens if not seeder", async () => {
            await expectRevert(
                eglContractInstance.claimSeederEgls(7200000, 1, { from: _voter1 }),
                "EGL:NOT_SEEDER"
            );
        });
        it("should call tally votes if epoch has expired", async () => {
            await time.increase(DefaultEpochLengthSeconds + 60);
            let txReceipt = await eglContractInstance.claimSeederEgls(7200000, 1, { from: _seedAccount1 });
            let events = populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED);
            assert.equal(events.length, "1", "Tally votes not called");
        });
        it("should remove as seeder once claimed", async () => {
            let seedAmount = await eglContractInstance.seeders(_seedAccount1);
            assert.isAbove(parseFloat(web3.utils.fromWei(seedAmount.toString())), 0, "Incorrect seed amount");
            
            await eglContractInstance.claimSeederEgls(7200000, 1, { from: _seedAccount1 });
            seedAmount = await eglContractInstance.seeders(_seedAccount1);
            assert.equal(web3.utils.fromWei(seedAmount.toString()), "0", "Seed amount should be 0");
        });
        it("should not allow seeder to claim twice", async () => {
            await eglContractInstance.claimSeederEgls(7200000, 1, { from: _seedAccount1 });
            await expectRevert(
                eglContractInstance.claimSeederEgls(7200000, 1, { from: _seedAccount1 }),
                "EGL:NOT_SEEDER"
            )
        });
        it("should add seed amount to tokens in circulation once claimed", async () => {
            let tokensInCirculationPre = await eglContractInstance.tokensInCirculation();

            await eglContractInstance.claimSeederEgls(7200000, 1, { from: _seedAccount1 });
            
            let tokensInCirculationPost = await eglContractInstance.tokensInCirculation();
            let expectedTic = 10000000 + parseFloat(web3.utils.fromWei(tokensInCirculationPre.toString()))
            assert.equal(web3.utils.fromWei(tokensInCirculationPost.toString()), expectedTic.toString(), "Incorrect tokens in circulation") 
        });
        it("should lock claimed tokens in a vote", async () => {
            let txReceipt = await eglContractInstance.claimSeederEgls(7200000, 1, { from: _seedAccount1 });
            
            events = populateAllEventDataFromLogs(txReceipt, EventType.VOTE);
            assert.equal(events.length, "1", "No vote entered for seeder");
        });
        it("should not be able to claim seeder EGL's if contract paused", async () => {
            await eglContractInstance.pauseEgl({ from: _deployer });

            await expectRevert(
                eglContractInstance.claimSeederEgls(7200000, 1, { from: _seedAccount1 }),
                "Pausable: paused"
            )
        });
    });    
    describe("EGL Vote", function () {
        it("should not allow voting with no tokens available", async () => {
            await expectRevert(
                eglContractInstance.vote(
                    ValidGasTarget,
                    web3.utils.toWei("1"),
                    1,
                    {from: _proxyAdmin}
                ),
                "EGL:INSUFFICIENT_EGL_BALANCE"
            );
        });
        it("should not allow voting without first giving an allowance to the EGL contract", async () => {
            await eglTokenInstance.transfer(_proxyAdmin, web3.utils.toWei("25000"), { from: accounts[1] })
            await expectRevert(
                eglContractInstance.vote(
                    ValidGasTarget,
                    web3.utils.toWei("1"),
                    1,
                    {from: _proxyAdmin}
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
            let txReceipt = await eglContractInstance.vote(
                ValidGasTarget,
                web3.utils.toWei("1000"),
                2,
                {from: _voter1}
            )
            let events = populateAllEventDataFromLogs(txReceipt, EventType.VOTE)
            assert.equal(events.length, "1", "No vote recorded");
        });
        it("should increase egl balance of contract after vote", async () => {
            let initialContractEglBalance = web3.utils.fromWei(await eglTokenInstance.balanceOf(eglContractInstance.address));
            let voteAmount = 10;

            await eglContractInstance.vote(
                ValidGasTarget,
                web3.utils.toWei(voteAmount.toString()),
                2,
                {from: _voter1}
            );            

            assert.equal(
                web3.utils.fromWei(await eglTokenInstance.balanceOf(eglContractInstance.address)),
                parseFloat(initialContractEglBalance) + voteAmount,
                "Incorrect EglContract token balance after vote()"
            );
        });
        it("should call tally votes if epoch has expired", async () => {
            await time.increase(DefaultEpochLengthSeconds + 60);
            let txReceipt = await eglContractInstance.vote(
                ValidGasTarget,
                web3.utils.toWei("1000"),
                2,
                {from: _voter1}
            );            

            let events = populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED);
            assert.equal(events.length, "1", "Tally votes not called");
        });
        it("should not be able to vote if contract paused", async () => {
            await eglContractInstance.pauseEgl({ from: _deployer });

            await expectRevert(
                eglContractInstance.vote(7000000, web3.utils.toWei("1000"), 2, { from: _voter1 }),
                "Pausable: paused"
            )
        });
    });
    describe("ReVote", function () {
        it("should not change release date of voter after re-vote if lockup period is shorter than original vote", async () => {
            await castSimpleVotes(
                [7000000, "10", 8, _voter1]
            );            

            let voter = await eglContractInstance.voters(_voter1);
            let originalReleaseDate = voter.releaseDate;

            await time.increase(DefaultEpochLengthSeconds * 2 + 60);
            await eglContractInstance.tallyVotes();

            await eglContractInstance.reVote(
                ValidGasTarget,
                "0",
                2,
                {from: _voter1}
            );
            voter = await eglContractInstance.voters(_voter1);
            assert.equal(voter.releaseDate.toString(), originalReleaseDate.toString(), "Incorrect release date after re-vote()");
        });
        it("should add to existing locked EGL's on re-vote if EGL amount > 0", async () => {
            await eglContractInstance.vote(
                ValidGasTarget,
                web3.utils.toWei("2"),
                4,
                {from: _voter1}
            );

            let voter = await eglContractInstance.voters(_voter1);
            assert.equal(
                web3.utils.fromWei(voter.tokensLocked.toString()),
                "2",
                "Incorrect locked tokens after re-vote()"
            );

            let initialContractEglBalance = web3.utils.fromWei(await eglTokenInstance.balanceOf(eglContractInstance.address))

            await eglContractInstance.reVote(
                ValidGasTarget,
                web3.utils.toWei("1"),
                3,
                {from: _voter1}
            );

            voter = await eglContractInstance.voters(_voter1);
            assert.equal(
                web3.utils.fromWei(voter.tokensLocked.toString()),
                "3",
                "Incorrect locked tokens after re-vote()"
            );

            let expectedValue = parseFloat(initialContractEglBalance) + 1
            assert.equal(
                web3.utils.fromWei(await eglTokenInstance.balanceOf(eglContractInstance.address)),
                expectedValue.toString(),
                "Incorrect EglContract token balance after re-vote()"
            );
        });
        it("should allow changing of lockup duration on re-vote", async () => {
            await castSimpleVotes(
                [7000000, "10", 8, _voter1]
            );            

            await eglContractInstance.reVote(
                7000000,
                "0",
                "4",
                {from: _voter1}
            );

            let voter = await eglContractInstance.voters(_voter1);
            assert.equal(
                voter.lockupDuration,
                "4",
                "Incorrect lockup period after re-vote()"
            );
        });
        it("should allow changing of gas target amount on re-vote in same epoch", async () => {
            await castSimpleVotes(
                [7000000, "10", 8, _voter1]
            );            

            await eglContractInstance.reVote(
                7500000,
                "0",
                "8",
                {from: _voter1}
            );

            let voter = await eglContractInstance.voters(_voter1);
            assert.equal(
                voter.gasTarget,
                "7500000",
                "Incorrect gas target after re-vote()"
            );
        });
        it("should not allow re-vote for account that hasn't voted yet", async () => {
            await expectRevert(
                eglContractInstance.reVote(
                    ValidGasTarget,
                    web3.utils.toWei("1"),
                    1,
                    {from: _voter1}
                ),
                "EGL:NOT_VOTED"
            );
        });
        it("should not allow re-vote with amount greater than 0 but less than 1", async () => {
            await castSimpleVotes(
                [7000000, "10", 8, _voter1]
            );            

            await expectRevert(
                eglContractInstance.reVote(
                    ValidGasTarget,
                    web3.utils.toWei("0.1"),
                    1,
                    {from: _voter1}
                ),
                "EGL:AMNT_TOO_LOW"
            );
        });
        it("should not allow re-vote if amount is greater than 0 but has an insufficient EGL balance", async () => {
            await castSimpleVotes(
                [7000000, "10", 8, _voter1]
            );

            await expectRevert(
                eglContractInstance.reVote(
                    ValidGasTarget,
                    web3.utils.toWei("10000000000"),
                    1,
                    {from: _voter1}
                ),
                "EGL:INSUFFICIENT_EGL_BALANCE"
            );
        });
        it("should not allow re-vote if amount is greater than 0 but has an insufficient allowance", async () => {
            await eglTokenInstance.transfer(_proxyAdmin, web3.utils.toWei("2500"), { from: accounts[1] })
            await eglTokenInstance.increaseAllowance(eglContractInstance.address, web3.utils.toWei("2000"), { from: _proxyAdmin });
            await castSimpleVotes(
                [7000000, "2000", 8, _proxyAdmin]
            );

            await expectRevert(
                eglContractInstance.reVote(
                    ValidGasTarget,
                    web3.utils.toWei("250"),
                    1,
                    {from: _proxyAdmin}
                ),
                "EGL:INSUFFICIENT_ALLOWANCE"
            );
        });
        it("should call tally votes if epoch has expired", async () => {
            await castSimpleVotes(
                [7000000, "10", 8, _voter1]
            );

            await time.increase(DefaultEpochLengthSeconds + 60);
            let txReceipt = await eglContractInstance.reVote(
                ValidGasTarget,
                web3.utils.toWei("1000"),
                2,
                {from: _voter1}
            );            

            let events = populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED);
            assert.equal(events.length, "1", "Tally votes not called");
        });
        it("should not be able to re-vote if contract paused", async () => {
            await castSimpleVotes(
                [7000000, "10", 8, _voter1]
            );
            await eglContractInstance.pauseEgl({ from: _deployer });

            await expectRevert(
                eglContractInstance.reVote(7000000, web3.utils.toWei("1000"), 2, { from: _voter1 }),
                "Pausable: paused"
            )
        });
    });
    describe("Withdraw", function () {
        it("should not be able to withdraw if not voted", async () => {
            await expectRevert(
                eglContractInstance.withdraw({from: _voter1}),
                "EGL:NOT_VOTED"
            );
        });
        it("should not be able to withdraw before lockup period elapsed", async () => {
            await castSimpleVotes(
                [7000000, "10", 8, _voter1]
            );
            await time.increase(DefaultEpochLengthSeconds + 60);
            await eglContractInstance.tallyVotes();

            await expectRevert(
                eglContractInstance.withdraw({from: _voter1}),
                "EGL:NOT_RELEASE_DATE"
            );
        });
        it("should be able to withdraw after lockup period", async () => {
            await castSimpleVotes(
                [7000000, "10", 4, _voter1]
            );

            for (let i = 0; i < 4; i++) {
                await time.increase(DefaultEpochLengthSeconds + 60);
                await eglContractInstance.tallyVotes();
            }
            let initialContractEglBalance = web3.utils.fromWei((await eglTokenInstance.balanceOf(eglContractInstance.address)).toString());
            let initialVoterBalance = web3.utils.fromWei((await eglTokenInstance.balanceOf(_voter1)).toString());

            let txReceipt = await eglContractInstance.withdraw({from: _voter1})

            let events = populateAllEventDataFromLogs(txReceipt, EventType.WITHDRAW);
            let tokensLocked = parseFloat(web3.utils.fromWei(events[0].tokensLocked.toString()));
            let rewardTokens = parseFloat(web3.utils.fromWei(events[0].rewardTokens.toString()));
            let withdrawAmount = tokensLocked + rewardTokens;
            let voterBalance = parseFloat(initialVoterBalance) + withdrawAmount;
            let expectedContractBalance = parseFloat(initialContractEglBalance) - withdrawAmount;
            
            assert.equal(
                web3.utils.fromWei((await eglTokenInstance.balanceOf(_voter1)).toString()), 
                voterBalance.toString(), 
                "Incorrect voter amount after withdraw"
            );
            assert.equal(
                web3.utils.fromWei((await eglTokenInstance.balanceOf(eglContractInstance.address)).toString()), 
                expectedContractBalance.toString(), 
                "Incorrect contract balance after withdraw"
            );
        });
        it("should not be able to withdraw if contract paused", async () => {
            await castSimpleVotes(
                [7000000, "10", 2, _voter1]
            );
            for (let i = 0; i < 3; i++) {
                await time.increase(DefaultEpochLengthSeconds + 60);
                await eglContractInstance.tallyVotes();
            }

            await eglContractInstance.pauseEgl({ from: _deployer });

            await expectRevert(
                eglContractInstance.withdraw({from: _voter1}),
                "Pausable: paused"
            )
        });
    });
    describe("Sweep Pool Rewards", function () {
        /** 
         * *******************************************************************************************************************
         * Ganache sets the coinbase account to 0x0 so the token transfer fails. Can only enable these test once that is fixed
         * *******************************************************************************************************************
         * */ 
        it.skip("should send block reward to coinbase account", async () => {
            let initialCoinbaseBalance = web3.utils.fromWei((await eglTokenInstance.balanceOf(eglContractDeploymentBlock.miner)).toString());
            let txReceipt = await eglContractInstance.sweepPoolRewards();

            let eventData = populateEventDataFromLogs(txReceipt, EventType.POOL_REWARD_SWEPT);
            let expectedCoinbaseBalance = parseFloat(initialCoinbaseBalance) + parseFloat(web3.utils.fromWei(eventData[0].blockReward.toString()))
            assert.equal(
                web3.utils.fromWei((await eglTokenInstance.balanceOf(eglContractDeploymentBlock.miner)).toString()),
                expectedCoinbaseBalance.toString(),
                "Incorrect reward amount sent to coinbase account"
            )
        });
        it.skip("should add miner reward to tokens in circulation once claimed", async () => {
            let tokensInCirculationPre = await eglContractInstance.tokensInCirculation();

            let txReceipt = await eglContractInstance.sweepPoolRewards();
            
            let eventData = populateEventDataFromLogs(txReceipt, EventType.POOL_REWARD_SWEPT);
            let tokensInCirculationPost = await eglContractInstance.tokensInCirculation();
            let blockReward = parseFloat(web3.utils.fromWei(eventData[0].blockReward.toString()))
            let expectedTic = blockReward + parseFloat(web3.utils.fromWei(tokensInCirculationPre.toString()))
            assert.equal(web3.utils.fromWei(tokensInCirculationPost.toString()), expectedTic.toString(), "Incorrect tokens in circulation after pool sweep") 
        });
        it.skip("should decrease remaining pool reward balance after pool sweep", async () => {
            let initialPoolBalance = 1500000000;

            let txReceipt = await eglContractInstance.sweepPoolRewards();
            
            let eventData = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            let blockReward = parseFloat(web3.utils.fromWei(eventData[0].blockReward.toString()))

            assert.equal(
                web3.utils.fromWei(eventData[0].remainingPoolReward.toString()), 
                initialPoolBalance - blockReward, 
                "Incorrect remaining pool reward balance"
            ) 
        });
        it("should not be able to sweep pool rewards if contract paused", async () => {
            await eglContractInstance.pauseEgl({ from: _deployer });

            await expectRevert(
                eglContractInstance.sweepPoolRewards(),
                "Pausable: paused"
            )
        });
    });
    describe("Withdraw Pool Tokens", function () {      
        it("should not allow withdraw if not participated in Genesis or has not pool tokens due", async () => {
            await expectRevert(
                eglContractInstance.withdrawPoolTokens({ from: _proxyAdmin }),
                "EGL:NO_POOL_TOKENS"
            )
        });  
        it("should not allow withdraw before the minimum pool token lockup period has elapsed", async () => {
            await eglContractInstance.claimSupporterEgls(7500000, 8, { from: _genesisSupporter1 });
            await time.increase((DefaultEpochLengthSeconds * 4) + 60);

            await expectRevert(
                eglContractInstance.withdrawPoolTokens({ from: _genesisSupporter1 }),
                "EGL:ALL_TOKENS_LOCKED"
            )
        });  
        it("should not allow withdraw before participants serialized EGL's have started to unlock", async () => {
            await eglContractInstance.claimSupporterEgls(7500000, 8, { from: _genesisSupporter2 });

            // After minimum lockup but before release date
            await time.increase((DefaultEpochLengthSeconds * 12) + 60);
            await expectRevert(
                eglContractInstance.withdrawPoolTokens({ from: _genesisSupporter2 }),
                "EGL:ADDR_TOKENS_LOCKED"
            )
        });  
        it("should allow participants to withdraw pool tokens after all pool tokens are due", async () => {
            await eglContractInstance.claimSupporterEgls(7500000, 8, { from: _genesisSupporter1 });

            let bptBalancePre = parseFloat(web3.utils.fromWei((await mockBalancerPoolTokenInstance.balanceOf(_genesisSupporter1)).toString()));

            await time.increase((DefaultEpochLengthSeconds * 52) + 60);            
            let txReceipt = await eglContractInstance.withdrawPoolTokens({ from: _genesisSupporter1 })
            let bptBalancePost = parseFloat(web3.utils.fromWei((await mockBalancerPoolTokenInstance.balanceOf(_genesisSupporter1)).toString()));
            let events = populateAllEventDataFromLogs(txReceipt, EventType.POOL_TOKENS_WITHDRAWN)
            assert.equal(events.length, "1", "Expected withdraw event")
            assert.equal(bptBalancePost, bptBalancePre + parseFloat(web3.utils.fromWei(events[0].poolTokensDue.toString())), "Incorrect BPT balance")
        });  
        it("should allow participants to withdraw pool tokens as they become available (current EGL < last EGL)", async () => {
            await eglContractInstance.claimSupporterEgls(7500000, 8, { from: _genesisSupporter2 });

            let supporter = await eglContractInstance.supporters(_genesisSupporter2)
            let totalPoolTokensDue = parseFloat(web3.utils.fromWei(supporter.poolTokens.toString()))
            let firstEgl = parseFloat(web3.utils.fromWei(supporter.firstEgl.toString()))
            let secondsFromOrigin = (Math.pow(firstEgl / 750000000, 1/4) * (DefaultEpochLengthSeconds * 42)) + DefaultEpochLengthSeconds * 10;
            let epochsPassed = Math.trunc(secondsFromOrigin / DefaultEpochLengthSeconds);
            
            for (let i = 0; i < epochsPassed; i++) {
                await time.increase(DefaultEpochLengthSeconds + 60);                
                await eglContractInstance.tallyVotes();
                if (i >= 9) {
                    await expectRevert(
                        eglContractInstance.withdrawPoolTokens({ from: _genesisSupporter2 }),
                        "EGL:ADDR_TOKENS_LOCKED"
                    )
                }
            }

            let bptBalancePre = parseFloat(web3.utils.fromWei((await mockBalancerPoolTokenInstance.balanceOf(_genesisSupporter2)).toString()));
            //Make sure we're passed the release date by at least 10 seconds
            await time.increase(10 + secondsFromOrigin - (DefaultEpochLengthSeconds * epochsPassed));
            let txReceipt = await eglContractInstance.withdrawPoolTokens({ from: _genesisSupporter2 })

            supporter = await eglContractInstance.supporters(_genesisSupporter2)
            let remainingPoolTokensDue = parseFloat(web3.utils.fromWei(supporter.poolTokens.toString()))

            let bptBalancePost = parseFloat(web3.utils.fromWei((await mockBalancerPoolTokenInstance.balanceOf(_genesisSupporter2)).toString()));
            let events = populateAllEventDataFromLogs(txReceipt, EventType.POOL_TOKENS_WITHDRAWN)[0];
            assert.equal(bptBalancePost, bptBalancePre + parseFloat(web3.utils.fromWei(events.poolTokensDue.toString())), "Incorrect BPT balance")
            assert.equal(remainingPoolTokensDue.toFixed(7), parseFloat(totalPoolTokensDue - bptBalancePost).toFixed(7), "Incorrect remaining BPT balance")
        });
        it("should adjust Bonus EGL's release date to 'now' if there is no current vote exists and all pool tokens have been released", async () => {
            await eglContractInstance.claimSupporterEgls(7500000, 8, { from: _genesisSupporter1 });            

            let supporter = await eglContractInstance.supporters(_genesisSupporter1)
            let lastEgl = parseFloat(web3.utils.fromWei(supporter.lastEgl.toString()))
            let secondsFromOrigin = (Math.pow(lastEgl / 750000000, 1/4) * (DefaultEpochLengthSeconds * 42)) + DefaultEpochLengthSeconds * 10;
            let epochsPassed = Math.trunc(secondsFromOrigin / DefaultEpochLengthSeconds);

            for (let i = 0; i < epochsPassed; i++) {
                await time.increase(DefaultEpochLengthSeconds + 60);                
                await eglContractInstance.tallyVotes();
            }

            //Make sure we're passed the release date by at least 10 seconds
            await time.increase(10 + secondsFromOrigin - (DefaultEpochLengthSeconds * epochsPassed));
            let txReceipt = await eglContractInstance.withdrawPoolTokens({ from: _genesisSupporter1 })
            
            let vote = await eglContractInstance.voters(_genesisSupporter1)
            assert.equal(
                parseInt(vote.releaseDate), 
                (await web3.eth.getBlock(txReceipt.receipt.blockNumber)).timestamp, 
                "Incorrect release date set after all BPT's withdrawn"
            );
        });
        it("should adjust Bonus EGL's release date to the release date of the current vote if all pool tokens have been released", async () => {
            await eglContractInstance.claimSupporterEgls(7500000, 8, { from: _genesisSupporter1 });

            let supporter = await eglContractInstance.supporters(_genesisSupporter1)
            let lastEgl = parseFloat(web3.utils.fromWei(supporter.lastEgl.toString()))
            let secondsFromOrigin = (Math.pow(lastEgl / 750000000, 1/4) * (DefaultEpochLengthSeconds * 42)) + DefaultEpochLengthSeconds * 10;
            let epochsPassed = Math.trunc(secondsFromOrigin / DefaultEpochLengthSeconds);
            for (let i = 0; i < epochsPassed - 1; i++) {
                await time.increase(DefaultEpochLengthSeconds + 60);                
                await eglContractInstance.tallyVotes();
            }

            let revoteLockupPeriod = 4
            //Re-vote the epoch before all pool tokens are due and lockup for 4 epochs
            await eglContractInstance.reVote(7800000, 0, revoteLockupPeriod, { from: _genesisSupporter1 })
            await time.increase(DefaultEpochLengthSeconds + 60);                
            await eglContractInstance.tallyVotes();

            //Make sure we're passed the release date by at least 10 seconds
            await time.increase(10 + secondsFromOrigin - (DefaultEpochLengthSeconds * epochsPassed));

            // Withdraw Pool tokens
            let txReceipt = await eglContractInstance.withdrawPoolTokens({ from: _genesisSupporter1 })
            
            let remainingVoteEpochs = parseInt((await eglContractInstance.voters(_genesisSupporter1)).voteEpoch.toString()) 
                + revoteLockupPeriod 
                - parseInt((await eglContractInstance.currentEpoch()).toString())
            let expectedNewReleaseDate = parseInt((await web3.eth.getBlock(txReceipt.receipt.blockNumber)).timestamp.toString())
                + (DefaultEpochLengthSeconds * remainingVoteEpochs);

            assert.equal(
                ((await eglContractInstance.voters(_genesisSupporter1)).releaseDate).toString(), 
                expectedNewReleaseDate.toString(), 
                "Incorrect release date set for EGL release"
            );
        });
        it("should not allow supporter to claim bonus EGL's again after withdrawing all pool tokens", async () => {
            // Claim bonus EGL's for the first time
            await eglContractInstance.claimSupporterEgls(7500000, 8, { from: _genesisSupporter1 });

            let supporter = await eglContractInstance.supporters(_genesisSupporter1)
            let lastEgl = parseFloat(web3.utils.fromWei(supporter.lastEgl.toString()))
            let secondsFromOrigin = (Math.pow(lastEgl / 750000000, 1/4) * (DefaultEpochLengthSeconds * 42)) + DefaultEpochLengthSeconds * 10;
            let epochsPassed = Math.trunc(secondsFromOrigin / DefaultEpochLengthSeconds);

            // Wait until all pool tokens are due
            for (let i = 0; i < epochsPassed; i++) {
                await time.increase(DefaultEpochLengthSeconds + 60);                
                await eglContractInstance.tallyVotes();
            }

            //Make sure we're passed the release date by at least 10 seconds so that we can withdraw all pool tokens
            await time.increase(10 + secondsFromOrigin - (DefaultEpochLengthSeconds * epochsPassed));            
            // With draw all pool tokens
            await eglContractInstance.withdrawPoolTokens({ from: _genesisSupporter1 })

            await time.increase(60);
            // Withdraw all EGL's
            await eglContractInstance.withdraw({ from: _genesisSupporter1 });

            // Try to claim again
            await expectRevert(
                eglContractInstance.claimSupporterEgls(7500000, 8, { from: _genesisSupporter1 }),
                "EGL:ALREADY_CLAIMED"
            )
        });  
        it("should not allow supporter to withdraw pool tokens again after withdrawing all pool tokens", async () => {
            // Claim bonus EGL's for the first time
            await eglContractInstance.claimSupporterEgls(7500000, 8, { from: _genesisSupporter1 });

            let supporter = await eglContractInstance.supporters(_genesisSupporter1)
            let lastEgl = parseFloat(web3.utils.fromWei(supporter.lastEgl.toString()))
            let secondsFromOrigin = (Math.pow(lastEgl / 750000000, 1/4) * (DefaultEpochLengthSeconds * 42)) + DefaultEpochLengthSeconds * 10;
            let epochsPassed = Math.trunc(secondsFromOrigin / DefaultEpochLengthSeconds);

            // Wait until all pool tokens are due
            for (let i = 0; i < epochsPassed; i++) {
                await time.increase(DefaultEpochLengthSeconds + 60);                
                await eglContractInstance.tallyVotes();
            }

            //Make sure we're passed the release date by at least 10 seconds so that we can withdraw all pool tokens
            await time.increase(10 + secondsFromOrigin - (DefaultEpochLengthSeconds * epochsPassed));            
            // With draw all pool tokens
            await eglContractInstance.withdrawPoolTokens({ from: _genesisSupporter1 })

            await time.increase(60);

            // Try to withdraw again
            await expectRevert(
                eglContractInstance.withdrawPoolTokens({ from: _genesisSupporter1 }),
                "EGL:NO_POOL_TOKENS"
            )
        });  
        it("should not be able to withdraw pool tokens if contract paused", async () => {
            await eglContractInstance.claimSupporterEgls(7500000, 8, { from: _genesisSupporter1 });
            await time.increase((DefaultEpochLengthSeconds * 52) + 60);
            await eglContractInstance.pauseEgl({ from: _deployer });

            await expectRevert(
                eglContractInstance.withdrawPoolTokens({ from: _genesisSupporter1 }),
                "Pausable: paused"
            )
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
        it("should have a voting threshold of 10% for the first 7 epochs", async () => {
            for (let i = 0; i < 8; i++) {                
                await time.increase(DefaultEpochLengthSeconds + 60);
                let txReceipt = await eglContractInstance.tallyVotes();
                let tallyVotesEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED)[0];
                assert.equal(web3.utils.fromWei(tallyVotesEvent.votingThreshold.toString()), "10", "Vote threshold should be 10%")
            }
        });
        it("should increment current epoch on tally votes call", async () => {
            let currentEpoch = await eglContractInstance.currentEpoch();
            assert.equal(currentEpoch.toString(), "0", "Incorrect epoch number")
            for (let i = 1; i < 5; i++) {                
                await time.increase(DefaultEpochLengthSeconds + 60);
                await eglContractInstance.tallyVotes();
                
                currentEpoch = await eglContractInstance.currentEpoch();
                assert.equal(currentEpoch.toString(), i.toString(), "Incorrect epoch number")
            }
        });
        it("should set new epoch start date on tally votes call", async () => {
            let currentEpochStartDate = await eglContractInstance.currentEpochStartDate();
            assert.equal(currentEpochStartDate.toString(), initEvent.firstEpochStartDate.toString(), "Incorrect epoch start date")
            for (let i = 1; i < 5; i++) {                
                await time.increase(DefaultEpochLengthSeconds + 60);
                await eglContractInstance.tallyVotes();
                
                currentEpochStartDate = await eglContractInstance.currentEpochStartDate();
                assert.equal(
                    currentEpochStartDate.toString(), 
                    (parseInt(initEvent.firstEpochStartDate) + (DefaultEpochLengthSeconds * i)).toString(), 
                    "Incorrect epoch start date"
                );
            }
        });
        it("should have a voting threshold to 30% from the remainder of the year (epochs 8 to 52)", async () => {
            for (let i = 0; i < 8; i++) {
                await time.increase(DefaultEpochLengthSeconds + 60);
                await eglContractInstance.tallyVotes();
            }

            for (let i = 8; i <= 51; i++) {                
                await time.increase(DefaultEpochLengthSeconds + 60);
                let txReceipt = await eglContractInstance.tallyVotes()
                let tallyVotesEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED)[0];
                assert.equal(web3.utils.fromWei(tallyVotesEvent.votingThreshold.toString()), "30", "Vote threshold should be 30%")
            }
        });
        it("should increase vote threshold from 30% to a max of 50% over 3 years (runs long)", async () => {
            let txReceipt;
            for (let i = 0; i <= 51; i++) {                
                await time.increase(DefaultEpochLengthSeconds + 60);
                txReceipt = await eglContractInstance.tallyVotes();
            }
            let lastTallyVotesEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED)[0];
            let voteThreshold = parseFloat(web3.utils.fromWei(lastTallyVotesEvent.votingThreshold.toString()))

            for (let i = 51; i <= 51 * 3; i++) {
                await time.increase(DefaultEpochLengthSeconds + 60);
                txReceipt = await eglContractInstance.tallyVotes();
                
                let currentEpoch = parseInt((await eglContractInstance.currentEpoch()).toString());
                let tallyVotesEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED)[0];
                let expectedVoteThreshold = voteThreshold + (20 / (52 * 2)) * (currentEpoch - 1 - 51);
                assert.equal(
                    parseFloat(web3.utils.fromWei(tallyVotesEvent.votingThreshold.toString())).toFixed(13),
                    expectedVoteThreshold.toFixed(13),
                    "Incorrect vote threshold calculated for epoch"
                )
            }
            await time.increase(DefaultEpochLengthSeconds + 60);
            txReceipt = await eglContractInstance.tallyVotes();
            let finalTallyVotesEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED)[0];
            assert.approximately(
                parseFloat(web3.utils.fromWei(finalTallyVotesEvent.votingThreshold.toString())),
                50,
                0.0000000000001,
                "Incorrect vote threshold calculated for epoch"
            )
        });
        it("should not exceed a vote threshold of 50% (runs long)", async () => {
            let txReceipt;
            for (let i = 0; i <= (52 * 3) + 1; i++) {                
                await time.increase(DefaultEpochLengthSeconds + 60);
                txReceipt = await eglContractInstance.tallyVotes();
            }

            for (let i = 153; i <= 52 * 4; i++) {
                await time.increase(DefaultEpochLengthSeconds + 60);
                txReceipt = await eglContractInstance.tallyVotes();
                
                let tallyVotesEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED)[0];
                assert.equal(
                    web3.utils.fromWei(tallyVotesEvent.votingThreshold.toString()),
                    "50",
                    "Vote threshold should not exceed 50%"
                )
            }
        });
        it("should pass vote if vote percentage greater than the vote threshold during the grace period", async () => {
            await castSimpleVotes(
                [7000000, "75000000", 4, _voter1]
            );
            await time.increase(DefaultEpochLengthSeconds + 60);
            let txReceipt = await eglContractInstance.tallyVotes();

            let tallyVotesEvent = populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED)[0];
            assert.equal(web3.utils.fromWei(tallyVotesEvent.actualVotePercentage.toString()), "10", "Incorrect actual vote percentage")
            assert.equal(web3.utils.fromWei(tallyVotesEvent.votingThreshold.toString()), "10", "Incorrect threshold")

            let thresholdMetEvent = populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_MET);            
            assert.equal(thresholdMetEvent.length, "1", "Expected threshold met event");

            let thresholdFailedEvent = populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_FAILED);
            assert.equal(thresholdFailedEvent.length, "0", "Did not expect threshold failed event");
        });
        it("should fail vote if vote percentage less than the vote threshold during the grace period", async () => {
            await castSimpleVotes(
                [7000000, "74999999", 4, _voter1]
            );
            await time.increase(DefaultEpochLengthSeconds + 60);
            let txReceipt = await eglContractInstance.tallyVotes();

            let tallyVotesEvent = populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED)[0];
            assert.isBelow(
                parseFloat(web3.utils.fromWei(tallyVotesEvent.actualVotePercentage.toString())), 
                10, 
                "Should be below vote threshold"
            )
            assert.equal(web3.utils.fromWei(tallyVotesEvent.votingThreshold.toString()), "10", "Incorrect threshold")

            let thresholdMetEvent = populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_MET);            
            assert.equal(thresholdMetEvent.length, "0", "Did not expect threshold met event");

            let thresholdFailedEvent = populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_FAILED);
            assert.equal(thresholdFailedEvent.length, "1", "Expected threshold failed event");
        });
        it("should pass vote if vote percentage greater than the vote threshold after the grace period", async () => {            
            for (let i = 0; i < 10; i++) {
                await time.increase(DefaultEpochLengthSeconds + 60);
                await eglContractInstance.tallyVotes();
            }
            await castSimpleVotes(
                [7000000, "225000000", 4, _voter1]
            );
            await time.increase(DefaultEpochLengthSeconds + 60);
            let txReceipt = await eglContractInstance.tallyVotes();

            let tallyVotesEvent = populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED)[0];
            assert.equal(web3.utils.fromWei(tallyVotesEvent.actualVotePercentage.toString()), "30", "Incorrect actual vote percentage")
            assert.equal(web3.utils.fromWei(tallyVotesEvent.votingThreshold.toString()), "30", "Incorrect threshold")

            let thresholdMetEvent = populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_MET);            
            assert.equal(thresholdMetEvent.length, "1", "Expected threshold met event");

            let thresholdFailedEvent = populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_FAILED);
            assert.equal(thresholdFailedEvent.length, "0", "Did not expect threshold failed event");
        });
        it("should fail vote if vote percentage less than the vote threshold after the grace period", async () => {
            for (let i = 0; i < 10; i++) {
                await time.increase(DefaultEpochLengthSeconds + 60);
                await eglContractInstance.tallyVotes();
            }
            await castSimpleVotes(
                [7000000, "217500000", 4, _voter1]
            );
            await time.increase(DefaultEpochLengthSeconds + 60);
            let txReceipt = await eglContractInstance.tallyVotes();

            let tallyVotesEvent = populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED)[0];
            assert.equal(web3.utils.fromWei(tallyVotesEvent.actualVotePercentage.toString()), "29", "Should be below vote threshold")
            assert.equal(web3.utils.fromWei(tallyVotesEvent.votingThreshold.toString()), "30", "Incorrect threshold")

            let thresholdMetEvent = populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_MET);            
            assert.equal(thresholdMetEvent.length, "0", "Did not expect threshold met event");

            let thresholdFailedEvent = populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_FAILED);
            assert.equal(thresholdFailedEvent.length, "1", "Expected threshold failed event");
        });
        it("should adjust EGL to average gas target value if vote passes and vote weights are the same", async () => {
            await castSimpleVotes(
                [7000000, "37500000", 4, _voter1],
                [8000000, "37500000", 4, _voter2],
            );
            await time.increase(DefaultEpochLengthSeconds + 60);
            let txReceipt = await eglContractInstance.tallyVotes();

            let votesThresholdMetEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_MET)[0];
            assert.equal(votesThresholdMetEvent.desiredEgl.toString(), "7500000", "Incorrect desired EGL amount calculated")
        });
        it("should adjust EGL to average gas target value if vote passes and vote weights are different", async () => {
            await castSimpleVotes(
                [7000000, "37500000", 3, _voter1],
                [8000000, "37500000", 6, _voter2],
            );
            await time.increase(DefaultEpochLengthSeconds + 60);
            let txReceipt = await eglContractInstance.tallyVotes();

            let votesThresholdMetEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_MET)[0];
            let baselineEgl = parseFloat(votesThresholdMetEvent.baselineEgl.toString());
            let gasTargetSum = parseFloat((await eglContractInstance.gasTargetSum(0)).toString());
            let voteWeightSum = parseFloat((await eglContractInstance.voteWeightsSum(0)).toString());
            let averageGasTarget = gasTargetSum / voteWeightSum;

            let expectedDesiredEgl = baselineEgl + Math.min(averageGasTarget - baselineEgl, 1000000);
            assert.equal(
                votesThresholdMetEvent.desiredEgl.toString(), 
                Math.trunc(expectedDesiredEgl).toString(), 
                "Incorrect desired EGL amount calculated"
            )
        });
        it("should not adjust EGL if vote fails and still within grace period", async () => {
            let originalDesiredEgl = (await eglContractInstance.desiredEgl()).toString();
            await castSimpleVotes(
                [7000000, "10000000", 3, _voter1],
                [8000000, "37500000", 6, _voter2],
            );
            await time.increase(DefaultEpochLengthSeconds + 60);
            let txReceipt = await eglContractInstance.tallyVotes();

            let votesThresholdFailedEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_FAILED)[0];
            assert.equal(votesThresholdFailedEvent.desiredEgl.toString(), originalDesiredEgl, "Failed vote during grace period should not change desired EGL");
        });
        it("should adjust EGL if vote fails and grace period is over", async () => {
            for (let i = 0; i < 6; i++) {
                await time.increase(DefaultEpochLengthSeconds + 60);
                await eglContractInstance.tallyVotes();
            }

            await castSimpleVotes(
                [7000000, "10000000", 3, _voter1],
                [8000000, "37500000", 6, _voter2],
            );

            await time.increase(DefaultEpochLengthSeconds + 60);
            let txReceipt = await eglContractInstance.tallyVotes();
            let tallyVotesBlock = await web3.eth.getBlock(txReceipt.receipt.blockNumber);
            let expectedDesiredEgl = Math.trunc(tallyVotesBlock.gasLimit * 0.95)

            let votesThresholdFailedEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_FAILED)[0];
            assert.equal(votesThresholdFailedEvent.desiredEgl.toString(), expectedDesiredEgl.toString(), "Failed vote during grace period should not change desired EGL");
        });
        it("should issue creator rewards starting from epoch 10", async () => {
            let txReceipt;
            for (let i = 0; i < 10; i++) {
                await time.increase(DefaultEpochLengthSeconds + 60);
                txReceipt = await eglContractInstance.tallyVotes();
            }

            let creatorRewardsClaimedEvent = populateAllEventDataFromLogs(txReceipt, EventType.CREATOR_REWARDS_CLAIMED);
            assert.equal(creatorRewardsClaimedEvent.length, "0", "Should not have any creator reward events yet");

            await time.increase(DefaultEpochLengthSeconds + 60);
            txReceipt = await eglContractInstance.tallyVotes()
            creatorRewardsClaimedEvent = populateAllEventDataFromLogs(txReceipt, EventType.CREATOR_REWARDS_CLAIMED)
            assert.equal(creatorRewardsClaimedEvent.length, "1", "Should have claimed creator reward");
        });
        it("should process current epochs vote totals and sums and then discard/advance data structures to the next epoch", async () => {
            await castSimpleVotes(
                [7000000, "10000000", 3, _voter1],
                [8000000, "37500000", 6, _voter2],
            );

            let expectedVoteWeightsSum = ["255000000", "255000000", "255000000", "225000000", "225000000", "225000000", "0", "0"];
            let expectedGasTargetSum = ["2010000000000000", "2010000000000000", "2010000000000000", "1800000000000000", "1800000000000000", "1800000000000000", "0", "0"];
            let expectedVotesTotal = ["47500000", "47500000", "47500000", "37500000", "37500000", "37500000", "0", "0"];
            for (let i = 0; i < 8; i++) {
                assert.equal(
                    web3.utils.fromWei((await eglContractInstance.voteWeightsSum(i)).toString()), 
                    expectedVoteWeightsSum[i], 
                    "Incorrect vote weights sum at epoch " + i
                );
                assert.equal(
                    web3.utils.fromWei((await eglContractInstance.gasTargetSum(i)).toString()), 
                    expectedGasTargetSum[i], 
                    "Incorrect gas target sum at epoch " + i
                );
                assert.equal(
                    web3.utils.fromWei((await eglContractInstance.votesTotal(i)).toString()), 
                    expectedVotesTotal[i], 
                    "Incorrect votes total at epoch " + i
                );
            }

            await time.increase(DefaultEpochLengthSeconds + 60);
            await eglContractInstance.tallyVotes();

            expectedVoteWeightsSum = ["255000000", "255000000", "225000000", "225000000", "225000000", "0", "0", "0"];
            expectedGasTargetSum = ["2010000000000000", "2010000000000000", "1800000000000000", "1800000000000000", "1800000000000000", "0", "0", "0"];
            expectedVotesTotal = ["47500000", "47500000", "37500000", "37500000", "37500000", "0", "0", "0"];
            for (let i = 0; i < 8; i++) {
                assert.equal(
                    web3.utils.fromWei((await eglContractInstance.voteWeightsSum(i)).toString()), 
                    expectedVoteWeightsSum[i], 
                    "Incorrect vote weights sum at epoch " + i
                );
                assert.equal(
                    web3.utils.fromWei((await eglContractInstance.gasTargetSum(i)).toString()), 
                    expectedGasTargetSum[i], 
                    "Incorrect gas target sum at epoch " + i
                );
                assert.equal(
                    web3.utils.fromWei((await eglContractInstance.votesTotal(i)).toString()), 
                    expectedVotesTotal[i], 
                    "Incorrect votes total at epoch " + i
                );
            }
        });
        it("should not be able to tally votes if contract paused", async () => {            
            await time.increase(DefaultEpochLengthSeconds + 60);
            await eglContractInstance.pauseEgl({ from: _deployer });

            await expectRevert(
                eglContractInstance.tallyVotes(),
                "Pausable: paused"
            )
        });
    });
    describe("Add Seeder Accounts", function () {
        it("should not allow none owner accounts to add seeders", async () => {
            await expectRevert(
                eglContractInstance.addSeedAccount(_voter1, web3.utils.toWei("1000"), {from: _creatorRewardsAccount}),
                "Ownable: caller is not the owner"
            )
        });
        it("should not allow a seed amount that is larger than the remaining seeder balance", async () => {
            await expectRevert(
                eglContractInstance.addSeedAccount(_voter1, web3.utils.toWei("51000000"), { from: _deployer }),
                "EGL:INSUFFICIENT_SEED_BALANCE"
            )
        });
        it("should not allow a seed account to be added if it is already a seeder account", async () => {
            await expectRevert(
                eglContractInstance.addSeedAccount(_seedAccount1, web3.utils.toWei("5000"), { from: _deployer }),
                "EGL:ALREADY_SEEDER"
            )
        });
        it("should not allow a seed account to be added if the account already has a vote locked", async () => {
            await castSimpleVotes(
                [7000000, "10", 2, _voter1]
            );

            await expectRevert(
                eglContractInstance.addSeedAccount(_voter1, web3.utils.toWei("5000"), { from: _deployer }),
                "EGL:ALREADY_HAS_VOTE"
            )
        });
        it("should not allow a seed account to be added if the account already has EGL's", async () => {
            await expectRevert(
                eglContractInstance.addSeedAccount(_voter1, web3.utils.toWei("5000"), { from: _deployer }),
                "EGL:ALREADY_HAS_EGLS"
            )
        });
        it("should not allow a seed account to be added after the first 10 epochs", async () => {
            await time.increase(DefaultEpochLengthSeconds * 10 + 60);
            await expectRevert(
                eglContractInstance.addSeedAccount(_proxyAdmin, web3.utils.toWei("5000"), { from: _deployer }),
                "EGL:SEED_PERIOD_PASSED"
            )
        });
        it("should not allow a seed account to be added if it participated in Genesis", async () => {            
            await expectRevert(
                eglContractInstance.addSeedAccount(_genesisSupporter1, web3.utils.toWei("5000"), { from: _deployer }),
                "EGL:IS_CONTRIBUTOR"
            )
        });
        it("should add seed account with specified amount", async () => {         
            let seedAmount = await eglContractInstance.seeders(_proxyAdmin);
            assert.equal(seedAmount.toString(), "0", "Seed amount for account should be 0");

            await eglContractInstance.addSeedAccount(_proxyAdmin, web3.utils.toWei("5000"), { from: _deployer })
            seedAmount = await eglContractInstance.seeders(_proxyAdmin);
            assert.equal(web3.utils.fromWei(seedAmount.toString()), "5000", "Account should have a seed value");
        });
        it("should reduce remaining seed balance when seed account added", async () => {         
            let txReceipt = await eglContractInstance.addSeedAccount(_proxyAdmin, web3.utils.toWei("5000"), { from: _deployer })
            let events = populateAllEventDataFromLogs(txReceipt, EventType.SEED_ACCOUNT_ADDED);
            let remainingBalance = parseFloat(web3.utils.fromWei(events[0].remainingSeederBalance.toString()));

            txReceipt = await eglContractInstance.addSeedAccount(_creatorRewardsAccount, web3.utils.toWei("5000"), { from: _deployer })
            events = populateAllEventDataFromLogs(txReceipt, EventType.SEED_ACCOUNT_ADDED);
            let remainingBalanceAfter = parseFloat(web3.utils.fromWei(events[0].remainingSeederBalance.toString()));
            assert.equal(remainingBalanceAfter, remainingBalance - 5000, "Incorrect remaining seeder balance");
        });
    });
    describe("Ownership", function () {
        it("should revert if owner attempts to renounce ownership", async () => {
            await expectRevert(
                eglContractInstance.renounceOwnership(),
                "EGL:NO_RENOUNCE_OWNERSHIP"
            )
        });
    });
    describe("Payments", function () {
        it("should revert if any eth payment received", async () => {
            await expectRevert(
                eglContractInstance.sendTransaction({from: _genesisSupporter1, value: web3.utils.toWei("1")}),
                "EGL:NO_PAYMENTS"
            )
        });
    });
    describe("Pause & Unpause", function () {
        it("should only allow contract owner to pause", async () => {
            assert.equal(await eglContractInstance.paused(), false, "Contract should be paused");
            await eglContractInstance.pauseEgl({ from: _deployer });
            assert.equal(await eglContractInstance.paused(), true, "Contract should be paused")
        });
        it("should only allow contract owner to unpause", async () => {            
            await eglContractInstance.pauseEgl({ from: _deployer });
            assert.equal(await eglContractInstance.paused(), true, "Contract should be paused");
            await eglContractInstance.unpauseEgl({ from: _deployer });
            assert.equal(await eglContractInstance.paused(), false, "Contract should not be paused")
        });
        it("should not allow non contract owner to pause", async () => {
            await expectRevert(
                eglContractInstance.pauseEgl({ from: _creatorRewardsAccount }),
                "Ownable: caller is not the owner"
            )
        });
        it("should not allow non contract owner to unpause", async () => {
            await eglContractInstance.pauseEgl({ from: _deployer });
            assert.equal(await eglContractInstance.paused(), true, "Contract should be paused");

            await expectRevert(
                eglContractInstance.unpauseEgl({ from: _creatorRewardsAccount }),
                "Ownable: caller is not the owner"
            )
        });
    });
});