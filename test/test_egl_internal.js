const { BN } = require("bn.js");
const {
    TestableEglContract,
    EglToken,
    EglUpgrader,
    UniswapV2Router,
    EventType,
    DefaultEthToLaunch,
    DefaultVotePauseSeconds,
    DefaultEpochLengthSeconds,
} = require("./helpers/constants");
const {
    populateAllEventDataFromLogs,
    getAllEventsForType,
    getNewWalletAddress,
} = require("./helpers/helper-functions");

contract("EglInternalFunctions", (accounts) => {
    const [deployer] = accounts;
    const SEED_ACCOUNTS = [accounts[6], accounts[7]];
    const CREATOR_REWARDS_ACCOUNT = accounts[5];

    beforeEach(async () => {
        let totalTokenSupply = new BN(web3.utils.toWei("4000000000"));
        eglTokenInstance = await EglToken.new();
        await eglTokenInstance.initialize("EthereumGasLimit", "EGL", totalTokenSupply);

        // eglContractInstance = await TestableEglContract.new();        
        // let txReceipt = await eglContractInstance.initialize(
        //     eglUpgraderInstance.address,
        //     eglTokenInstance.address,
        //     routerContract.address,
        //     DefaultEthToLaunch,
        //     Math.round(new Date().getTime() / 1000),
        //     DefaultVotePauseSeconds,
        //     DefaultEpochLengthSeconds,
        //     "6700000",
        //     "7200000",
        //     SEED_ACCOUNTS,
        //     "0",
        //     CREATOR_REWARDS_ACCOUNT
        // );

        // await eglTokenInstance.transfer(eglContractInstance.address, totalTokenSupply, { from: deployer });

        // initEvent = populateAllEventDataFromLogs(txReceipt, EventType.INITIALIZED);
    });    

    describe("Fund Seed Accounts", function () {
        it("should allocate all seed funds to 1 seed account", async () => {
            let seedAccounts = [accounts[1]];
            let txReceipt = await eglContractInstance.fundSeedAccounts(seedAccounts);

            let seedEvents = populateAllEventDataFromLogs(txReceipt, EventType.SEED_ACCOUNT_FUNDED);
            assert.equal(seedEvents.length, 1, "Incorrect number of seed accounts");
            assert.equal(seedEvents[0].seedAddress, accounts[1], "Incorrect seed account funded");
            assert.equal(seedEvents[0].initialSeedAmount, web3.utils.toWei("5000000"), "Incorrect total seed amount");            
            assert.equal(seedEvents[0].individualSeedAmount, web3.utils.toWei("5000000"), "Incorrect seed amount given to seed account");            
        });
        it("should allocate seed funds equally between all seed accounts", async () => {
            let seedAccounts = [accounts[1], accounts[2], accounts[3]];
            let txReceipt = await eglContractInstance.fundSeedAccounts(seedAccounts);

            let seedEvents = populateAllEventDataFromLogs(txReceipt, EventType.SEED_ACCOUNT_FUNDED);
            assert.equal(seedEvents.length, 3, "Incorrect number of seed accounts");
            let expectedSeedAmount = new BN(web3.utils.toWei("5000000")).div(new BN(seedEvents.length))
            for (let i = 0; i < seedEvents.length; i++) {
                assert.equal(seedEvents[i].seedAddress, accounts[i + 1], "Incorrect seed account funded");
                assert.equal(seedEvents[i].initialSeedAmount, web3.utils.toWei("5000000"), "Incorrect total seed amount");            
                assert.equal(seedEvents[i].individualSeedAmount, expectedSeedAmount.toString(), "Incorrect seed amount given to seed account");            
            }
        });
        it("should lock tokens for seed accounts in a vote for 52 epochs", async () => {
            let seedAccounts = [accounts[1], accounts[2], accounts[3]];
            let txReceipt = await eglContractInstance.fundSeedAccounts(seedAccounts);

            let seedEvents = populateAllEventDataFromLogs(txReceipt, EventType.SEED_ACCOUNT_FUNDED);
            let voteEvents = populateAllEventDataFromLogs(txReceipt, EventType.VOTE);
            let expectedReleaseDate = parseInt(initEvent[0].firstEpochStartDate) + (parseInt(initEvent[0].epochLength) * 52)
            for (let i = 0; i < seedEvents.length; i++) {
                assert.equal(voteEvents[i].releaseDate.toString(), expectedReleaseDate.toString(), "Incorrect release date for seed account " + i + " vote");
            }
        });
        it("should set initial vote lockup duration to 8 epochs", async () => {
            let seedAccounts = [accounts[1], accounts[2], accounts[3]];
            let txReceipt = await eglContractInstance.fundSeedAccounts(seedAccounts);

            let seedEvents = populateAllEventDataFromLogs(txReceipt, EventType.SEED_ACCOUNT_FUNDED);
            let voteEvents = populateAllEventDataFromLogs(txReceipt, EventType.VOTE);
            for (let i = 0; i < seedEvents.length; i++) {
                assert.equal(voteEvents[i].lockupDuration.toString(), "8", "Incorrect lockup duration for seed account " + i + " vote");
            }
        });
        it("should vote with current gas limit for initial seed vote", async () => {
            let seedAccounts = [accounts[1], accounts[2], accounts[3]];
            let txReceipt = await eglContractInstance.fundSeedAccounts(seedAccounts);
                        
            let seedEvents = populateAllEventDataFromLogs(txReceipt, EventType.SEED_ACCOUNT_FUNDED);
            let voteEvents = populateAllEventDataFromLogs(txReceipt, EventType.VOTE);
            let expectedBlockGasLimit = (await web3.eth.getBlock(txReceipt.blockNumber)).gasLimit
            for (let i = 0; i < seedEvents.length; i++) {
                assert.equal(voteEvents[i].gasTarget.toString(), expectedBlockGasLimit.toString(), "Incorrect lockup duration for seed account " + i + " vote");
            }
        });
    });
    describe("Issue Creator Rewards", function () {
        it("should issue weekly creator reward to creator reward account", async () => {
            let creatorAddressBalancePre = await eglTokenInstance.balanceOf(CREATOR_REWARDS_ACCOUNT);
            let txReceipt = await eglContractInstance.issueCreatorRewards();
            
            let creatorAddressBalancePost = await eglTokenInstance.balanceOf(CREATOR_REWARDS_ACCOUNT);
            let creatorRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.CREATOR_REWARDS_CLAIMED);
            let expectedWeeklyCreatorReward = new BN(web3.utils.toWei("500000000")).div(new BN(52 - 9));
            assert.equal(creatorRewardEvents[0].creatorRewardAddress, CREATOR_REWARDS_ACCOUNT, "Creator reward sent to the wrong address");
            assert.equal(creatorRewardEvents[0].amountClaimed.toString(), expectedWeeklyCreatorReward.toString(), "Incorrect creator reward amount");
            assert.equal(creatorAddressBalancePost.toString(), creatorAddressBalancePre.add(expectedWeeklyCreatorReward).toString(), "Incorrect balance after creator rewards claimed");
        });
        it("should decrease remaining reward when the weekly reward is claimed", async () => {
            let txReceipt = await eglContractInstance.issueCreatorRewards();

            let creatorRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.CREATOR_REWARDS_CLAIMED);
            let expectedWeeklyCreatorReward = new BN(web3.utils.toWei("500000000")).div(new BN(52 - 9));
            let expectedRemainingBalance = new BN(web3.utils.toWei("500000000")).sub(expectedWeeklyCreatorReward);
            assert.equal(creatorRewardEvents[0].remainingCreatorReward.toString(), expectedRemainingBalance.toString(), "Incorrect remaining balance after 1 claim");
        });
        it("should increase total number of tokens in circulation when the weekly reward is claimed", async () => {
            let tokensInCirculationPre = await eglContractInstance.tokensInCirculation();
            await eglContractInstance.issueCreatorRewards();
            
            let tokensInCirculationPost = await eglContractInstance.tokensInCirculation();
            let expectedWeeklyCreatorReward = new BN(web3.utils.toWei("500000000")).div(new BN(52 - 9));
            let expectedTokensInCirculation = tokensInCirculationPre.add(expectedWeeklyCreatorReward);
            assert.equal(tokensInCirculationPost.toString(), expectedTokensInCirculation.toString(), "Incorrect number of tokens in circulation");
        });
        it("should have less than 1 remaining creator reward token after creator reward period ends (43 epochs)", async () => {
            let numberEpochs = 0;
            let remainingBalance = new BN(web3.utils.toWei("500000000"));
            while (remainingBalance.cmp(new BN(web3.utils.toWei("1"))) === 1) {
                let txReceipt = await eglContractInstance.issueCreatorRewards();
                let creatorRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.CREATOR_REWARDS_CLAIMED);
                remainingBalance = remainingBalance.sub(creatorRewardEvents[0].amountClaimed);
                numberEpochs++;
            }

            let allCreatorRewardEvents = await getAllEventsForType(EventType.CREATOR_REWARDS_CLAIMED, eglContractInstance);
            let latestCreatorEvent = allCreatorRewardEvents[allCreatorRewardEvents.length - 1]
            let actualRemainingTokens = web3.utils.fromWei(latestCreatorEvent.remainingCreatorReward);
            assert.equal(numberEpochs, 43, "Incorrect number of epochs to deplete creator rewards");
            assert.approximately(parseFloat(actualRemainingTokens), 0, 0.0000001, "Incorrect remaining balance after reward period ended");            
        });
        it("should transfer remaining creator reward balance if reward is less than reward per epoch", async () => {
            let remainingBalance = new BN(web3.utils.toWei("500000000"));
            while (remainingBalance.cmp(new BN(web3.utils.toWei("1"))) === 1) {
                let txReceipt = await eglContractInstance.issueCreatorRewards();
                let creatorRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.CREATOR_REWARDS_CLAIMED);
                remainingBalance = remainingBalance.sub(creatorRewardEvents[0].amountClaimed);
            }

            let allCreatorRewardEvents = await getAllEventsForType(EventType.CREATOR_REWARDS_CLAIMED, eglContractInstance);
            let latestCreatorEvent = allCreatorRewardEvents[allCreatorRewardEvents.length - 1]
            let actualRemainingTokens = latestCreatorEvent.remainingCreatorReward;
            assert.isAbove(actualRemainingTokens.toNumber(), 0, "Remaining tokens should be greater than 0");
            assert.isBelow(actualRemainingTokens.toNumber(), new BN(web3.utils.toWei("0.00001")).toNumber(), "Remaining tokens should be less than 1");
            let creatorAddressBalancePre = new BN(await eglTokenInstance.balanceOf(CREATOR_REWARDS_ACCOUNT));
            await eglContractInstance.issueCreatorRewards();

            let creatorAddressBalancePost = new BN(await eglTokenInstance.balanceOf(CREATOR_REWARDS_ACCOUNT));
            assert.equal(creatorAddressBalancePost.toString(), creatorAddressBalancePre.add(actualRemainingTokens).toString(), "Incorrect balance after creator rewards claimed");
        });
    });
    describe("Calculate Block Reward", function () {
        it("should give pool 100% of the block reward ", async () => {
            let gasLimit = 7200000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "100", "Incorrect reward percentage calculated");
        });
        it("should give pool 92.5% of the block reward if actual gas limit less than EGL", async () => {
            let gasLimit = 7100000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "92.5", "Incorrect reward percentage calculated");
        });
        it("should give pool 62.5% of the block reward if actual gas limit less than EGL", async () => {
            let gasLimit = 6700000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "62.5", "Incorrect reward percentage calculated");
        });
        it("should give pool 32.5% of the block reward if actual gas limit less than EGL", async () => {
            let gasLimit = 6300000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "32.5", "Incorrect reward percentage calculated");
        });
        it("should give pool 25% of the block reward if actual gas limit less than EGL", async () => {
            let gasLimit = 6200000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "25", "Incorrect reward percentage calculated");
        });
        it("should give pool 0% of the block reward if actual gas limit less than EGL", async () => {
            let gasLimit = 6100000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "0", "Incorrect reward percentage calculated");
        });
        it("should give pool 92.5% of the block reward if actual gas limit more than EGL", async () => {
            let gasLimit = 7300000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "92.5", "Incorrect reward percentage calculated");
        });
        it("should give pool 62.5% of the block reward if actual gas limit more than EGL", async () => {
            let gasLimit = 7700000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "62.5", "Incorrect reward percentage calculated");
        });
        it("should give pool 32.5% of the block reward if actual gas limit more than EGL", async () => {
            let gasLimit = 8100000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "32.5", "Incorrect reward percentage calculated");
        });
        it("should give pool 25% of the block reward if actual gas limit more than EGL", async () => {
            let gasLimit = 8200000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "25", "Incorrect reward percentage calculated");
        });
        it("should give pool 0% of the block reward if actual gas limit more than EGL", async () => {
            let gasLimit = 8300000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "0", "Incorrect reward percentage calculated");
        });
    });
    describe("Calculate Percentage of Tokens In Circulation", function () {
        it("should calculate that 1,000,000,000 out of 1,000,000,000 is 100%", async () => {
            let tokensInCirculation = web3.utils.toWei("1000000000");
            let itemTotal = web3.utils.toWei("1000000000");
            let txReceipt = await eglContractInstance.calculatePercentageOfTokensInCirculation(itemTotal, tokensInCirculation);
            
            let event = populateAllEventDataFromLogs(txReceipt, "PercentageCalculated");
            assert.equal(web3.utils.fromWei(event[0].percentage.toString()), "100", "Incorrect percentage calculated");
        });
        it("should calculate that 24,568,290 out of 49,136,580 is 50%", async () => {
            let tokensInCirculation = web3.utils.toWei("49136580");
            let itemTotal = web3.utils.toWei("24568290");
            let txReceipt = await eglContractInstance.calculatePercentageOfTokensInCirculation(itemTotal, tokensInCirculation);
            
            let event = populateAllEventDataFromLogs(txReceipt, "PercentageCalculated");
            assert.equal(web3.utils.fromWei(event[0].percentage.toString()), "50", "Incorrect percentage calculated");
        });
        it("should calculate that 5,000,000 out of 500,000,000 is 1%", async () => {
            let tokensInCirculation = web3.utils.toWei("500000000");
            let itemTotal = web3.utils.toWei("5000000");
            let txReceipt = await eglContractInstance.calculatePercentageOfTokensInCirculation(itemTotal, tokensInCirculation);
            
            let event = populateAllEventDataFromLogs(txReceipt, "PercentageCalculated");
            assert.equal(web3.utils.fromWei(event[0].percentage.toString()), "1", "Incorrect percentage calculated");
        });
        it("should calculate that 100.234235123413 out of 2300.1283719873791273 is 4.3577669988%", async () => {
            let tokensInCirculation = web3.utils.toWei("2300.1283719873791273");
            let itemTotal = web3.utils.toWei("100.234235123413");
            let txReceipt = await eglContractInstance.calculatePercentageOfTokensInCirculation(itemTotal, tokensInCirculation);
            
            let event = populateAllEventDataFromLogs(txReceipt, "PercentageCalculated");
            assert.equal(web3.utils.fromWei(event[0].percentage.toString()), "4.357766998752667367", "Incorrect percentage calculated");
        });
        it("should calculate the percentage as 0 if there are no tokens in circulation", async () => {
            let tokensInCirculation = 0;
            let itemTotal = web3.utils.toWei("101");
            let txReceipt = await eglContractInstance.calculatePercentageOfTokensInCirculation(itemTotal, tokensInCirculation);
            
            let event = populateAllEventDataFromLogs(txReceipt, "PercentageCalculated");
            assert.equal(web3.utils.fromWei(event[0].percentage.toString()), "0", "Incorrect percentage calculated");
        });
    });
    describe.skip("Tally DAO Votes", function () {
        it("", async () => {});
    });
    describe.skip("Tally Upgrade Votes", function () {
        it("", async () => {});
    });
    describe.skip("Add DAO Candidate Vote", function () {
        it("", async () => {});
    });
    describe("Add Upgrade Candidate Vote", function () {
        it("should allow multiple votes for the same upgrade candidate", async () => {
            let upgradeCountPre = await eglContractInstance.getUpgradeCandidateCount();
            await eglContractInstance.addUpgradeCandidateVote(
                accounts[4],
                web3.utils.toWei("1")
            );
            let txReceipt = await eglContractInstance.addUpgradeCandidateVote(
                accounts[4],
                web3.utils.toWei("2")
            );

            let eventData = populateAllEventDataFromLogs(txReceipt, EventType.CANDIDATE_VOTE_ADDED);
            let expectedVoteCount = web3.utils.toWei("3");
            let upgradeCountPost = await eglContractInstance.getUpgradeCandidateCount();
            assert.equal(eventData[0].candidate.toString(), accounts[4], "Incorrect candidate saved");
            assert.equal(eventData[0].candidateVoteCount.toString(), expectedVoteCount, "Vote amount not incremented correctly");
            assert.equal(eventData[0].numberOfCandidates.toString(), "1", "Incorrect number of candidates after vote");
            assert.equal(upgradeCountPre.toString(), "0", "Incorrect upgrade candidate count before vote");
            assert.equal(upgradeCountPost.toString(), "1", "Incorrect upgrade candidate count after vote");

        });
        it("should allow voting for multiple upgrade candidates", async () => {
            let upgradeCountPre = await eglContractInstance.getUpgradeCandidateCount();
            let txReceiptCandidate1 = await eglContractInstance.addUpgradeCandidateVote(
                accounts[4],
                web3.utils.toWei("1")
            );
            let txReceiptCandidate2 = await eglContractInstance.addUpgradeCandidateVote(
                accounts[3],
                web3.utils.toWei("2.5")
            );

            let candidate1EventData = populateAllEventDataFromLogs(txReceiptCandidate1, EventType.CANDIDATE_VOTE_ADDED);
            let candidate2EventData = populateAllEventDataFromLogs(txReceiptCandidate2, EventType.CANDIDATE_VOTE_ADDED);
            let upgradeCountPost = await eglContractInstance.getUpgradeCandidateCount();
            assert.equal(upgradeCountPre.toString(), "0", "Incorrect upgrade candidate count before vote");
            assert.equal(upgradeCountPost.toString(), "2", "Incorrect upgrade candidate count after vote");
            assert.equal(candidate1EventData[0].candidate, accounts[4], "Incorrect upgrade candidate saved");
            assert.equal(candidate1EventData[0].candidateVoteCount.toString(), web3.utils.toWei("1"), "Incorrect vote amount saved");
            assert.equal(candidate1EventData[0].numberOfCandidates.toString(), "1", "Incorrect number of candidates after vote");
            assert.equal(candidate2EventData[0].candidate, accounts[3], "Incorrect upgrade candidate saved");
            assert.equal(candidate2EventData[0].candidateVoteCount.toString(), web3.utils.toWei("2.5"), "Incorrect vote amount saved");
            assert.equal(candidate2EventData[0].numberOfCandidates.toString(), "2", "Incorrect number of candidates after vote");
        });
        it("should not increment DAO candidates if voting for upgrade candidate", async () => {
            let daoCountPre = await eglContractInstance.getDaoCandidateCount();    
            await eglContractInstance.addUpgradeCandidateVote(
                accounts[4],
                web3.utils.toWei("1")
            );

            let daoCountPost = await eglContractInstance.getDaoCandidateCount();    
            assert.equal(daoCountPre.toString(), "0", "There should be no DAO candidates before vote");
            assert.equal(daoCountPost.toString(), "0", "There should be no DAO candidates after vote");

        });
        it("should allow a max of 10 upgrade candidates to be stored", async () => {
            for (let i = 1; i <= 10; i++) {
                await eglContractInstance.addUpgradeCandidateVote(
                    getNewWalletAddress(web3).address,
                    web3.utils.toWei((i * 0.1).toString())
                );
            }            
            assert.equal((await eglContractInstance.getUpgradeCandidateCount()).toString(), "10", "Incorrect number of candidates");

            await eglContractInstance.addUpgradeCandidateVote(
                accounts[4],
                web3.utils.toWei("1")
            );
            assert.equal((await eglContractInstance.getUpgradeCandidateCount()).toString(), "10", "Incorrect number of candidates");
        });
        it("should remove candidate with the fewest votes if there are already 10 upgrade candidates", async () => {
            for (let i = 1; i <= 10; i++) {
                await eglContractInstance.addUpgradeCandidateVote(
                    getNewWalletAddress(web3).address,
                    web3.utils.toWei((i * 0.1).toString())
                );
            }

            let txReceipt = await eglContractInstance.addUpgradeCandidateVote(
                accounts[4],
                web3.utils.toWei("0.5")
            );
            let upgradeCount = await eglContractInstance.getUpgradeCandidateCount();
            let latestCandidateAddedEvent = populateAllEventDataFromLogs(txReceipt, EventType.CANDIDATE_VOTE_ADDED)[0];
            assert.notEqual(latestCandidateAddedEvent.losingCandidate.toString(), accounts[4], "New candidate should not be the losing candidate");
            assert.equal(latestCandidateAddedEvent.losingCandidateIdx.toString(), "0", "Losing candidate should be at idx 0");
            assert.equal(latestCandidateAddedEvent.candidateIdx.toString(), "0", "New candidate should replace losing candidate at same idx");
            assert.equal(upgradeCount.toString(), "10", "Incorrect upgrade candidate count");
        });
        it("should ignore new candidate if there are already 10 candidates and it has fewer votes than existing candidates", async () => {
            for (let i = 1; i <= 10; i++) {
                await eglContractInstance.addUpgradeCandidateVote(
                    getNewWalletAddress(web3).address,
                    web3.utils.toWei((i * 0.1).toString())
                );
            }

            let txReceipt = await eglContractInstance.addUpgradeCandidateVote(
                accounts[4],
                web3.utils.toWei("0.01")
            );
            latestCandidateAddedEvent = populateAllEventDataFromLogs(txReceipt, EventType.CANDIDATE_VOTE_ADDED)[0];
            assert.equal(latestCandidateAddedEvent.losingCandidate.toString(), accounts[4], "New candidate should be losing candidate");
            assert.equal(latestCandidateAddedEvent.losingCandidateEgls.toString(), web3.utils.toWei("0.01"), "Incorrect losing candidate EGL's");
        });
        it("should maintain separate lists for DAO and upgrade candidates", async () => {
            await eglContractInstance.addUpgradeCandidateVote(
                accounts[4],
                web3.utils.toWei("0.6")
            );
            await eglContractInstance.addDaoCandidateVote(
                accounts[5],
                web3.utils.toWei("0.2"),
                web3.utils.toWei("0.5")
            );

            let upgradeCandidate = await eglContractInstance.upgradeCandidateList(0);
            let daoCandidate = await eglContractInstance.daoCandidateList(0);
            let upgradeCandidateCount = await eglContractInstance.getUpgradeCandidateCount();
            let daoCandidateCount = await eglContractInstance.getDaoCandidateCount();
            assert.equal(upgradeCandidate, accounts[4], "Incorrect upgrade candidate address");
            assert.equal(daoCandidate, accounts[5], "Incorrect DAO candidate address");
            assert.equal(upgradeCandidateCount.toString(), "1", "Incorrect upgrade candidate count");
            assert.equal(daoCandidateCount.toString(), "1", "Incorrect DAO candidate count");
        });
    });
    describe.skip("Remove DAO Candidate Vote", function () {
        it("", async () => {});
    });
    describe("Remove Upgrade Candidate Vote", function () {
        it("should remove candidate completely if it no longer has any votes", async () => {
            await eglContractInstance.addUpgradeCandidateVote(
                accounts[4],
                web3.utils.toWei("0.6")
            );            
            let upgradeCount = await eglContractInstance.getUpgradeCandidateCount();
            assert.equal(upgradeCount.toString(), "1", "Incorrect upgrade candidate count");

            let txReceipt = await eglContractInstance.removeUpgradeCandidateVote(
                accounts[4],
                web3.utils.toWei("0.6")
            );            

            upgradeCount = await eglContractInstance.getUpgradeCandidateCount();
            assert.equal(upgradeCount.toString(), "0", "Incorrect upgrade candidate count after remove");

            let removedEvent = populateAllEventDataFromLogs(txReceipt, EventType.CANDIDATE_VOTE_REMOVED)[0];
            assert.equal(removedEvent.candidate, accounts[4], "Incorrect candidate removed");
            assert.equal(removedEvent.candidateVoteCount, "0", "Incorrect candidate EGL amount remaining");
            assert.equal(removedEvent.candidateIdx, "0", "Incorrect candidate idx");
        });
        it("should decrease candidate EGL amount when 1 of multiple votes removed", async () => {
            await eglContractInstance.addUpgradeCandidateVote(
                accounts[4],
                web3.utils.toWei("0.6")
            );            
            await eglContractInstance.addUpgradeCandidateVote(
                accounts[4],
                web3.utils.toWei("0.4")
            );            

            let candidateAddress = await eglContractInstance.upgradeCandidateList(0);
            let candidate = await eglContractInstance.voteCandidates(candidateAddress)
            assert.equal(candidate.voteCount, web3.utils.toWei("1"), "Incorrect vote amount for candidate");            

            let txReceipt = await eglContractInstance.removeUpgradeCandidateVote(
                accounts[4],
                web3.utils.toWei("0.6")
            );            
            upgradeCount = await eglContractInstance.getUpgradeCandidateCount();
            assert.equal(upgradeCount.toString(), "1", "Incorrect upgrade candidate count after remove");

            let removedEvent = populateAllEventDataFromLogs(txReceipt, EventType.CANDIDATE_VOTE_REMOVED)[0];
            assert.equal(removedEvent.candidate, accounts[4], "Incorrect candidate removed");
            assert.equal(removedEvent.candidateVoteCount, web3.utils.toWei("0.4"), "Incorrect candidate vote amount remaining");
            assert.equal(removedEvent.candidateIdx, "0", "Incorrect candidate idx");
        });

    });
    describe.skip("Evaluate DAO Candidate Vote", function () {
        it("", async () => {});
    });
    describe("Evaluate Upgrade Candidate Vote", function () {
        it("should pass upgrade vote threshold if candidate vote more than 50% of total votes", async () => {
            await eglContractInstance.addUpgradeCandidateVote(accounts[1], web3.utils.toWei("6"));
            await eglContractInstance.addUpgradeCandidateVote(accounts[3], web3.utils.toWei("11"));

            let txReceipt = await eglContractInstance.evaluateUpgradeVote();            
            let evalEvent = populateAllEventDataFromLogs(txReceipt, EventType.CANDIDATE_VOTE_EVALUATED)[0];
            assert.equal(evalEvent.thresholdPassed, true, "Should have passed threshold");
            assert.isAbove(parseFloat(web3.utils.fromWei(evalEvent.totalVotePercentage)), 50, "Vote percentage should be above 50%")
        });
        it("should pass upgrade vote threshold if candidate vote equal to 50% of total votes", async () => {
            await eglContractInstance.addUpgradeCandidateVote(accounts[1], web3.utils.toWei("6"));            
            await eglContractInstance.addUpgradeCandidateVote(accounts[2], web3.utils.toWei("4"));            
            await eglContractInstance.addUpgradeCandidateVote(accounts[3], web3.utils.toWei("10"));            

            let txReceipt = await eglContractInstance.evaluateUpgradeVote();            
            let evalEvent = populateAllEventDataFromLogs(txReceipt, EventType.CANDIDATE_VOTE_EVALUATED)[0];
            assert.equal(evalEvent.thresholdPassed, true, "Should have passed threshold");
            assert.equal(web3.utils.fromWei(evalEvent.totalVotePercentage), "50", "Vote percentage should be 50%");
        });
        it("should not pass upgrade vote threshold if candidate votes less than 50% of total votes", async () => {
            await eglContractInstance.addUpgradeCandidateVote(accounts[1], web3.utils.toWei("6"));            
            await eglContractInstance.addUpgradeCandidateVote(accounts[2], web3.utils.toWei("4"));            
            await eglContractInstance.addUpgradeCandidateVote(accounts[3], web3.utils.toWei("8"));            

            let txReceipt = await eglContractInstance.evaluateUpgradeVote();            
            let evalEvent = populateAllEventDataFromLogs(txReceipt, EventType.CANDIDATE_VOTE_EVALUATED)[0];
            assert.equal(evalEvent.thresholdPassed, false, "Should not have passed threshold");
            assert.isBelow(parseFloat(web3.utils.fromWei(evalEvent.totalVotePercentage)), 50, "Vote percentage should be below 50%")
        });
        it("should evaluate the first candidate entered as winner in case of tied vote", async () => {
            await eglContractInstance.addUpgradeCandidateVote(accounts[1], web3.utils.toWei("6"));            
            await eglContractInstance.addUpgradeCandidateVote(accounts[1], web3.utils.toWei("4"));            
            await eglContractInstance.addUpgradeCandidateVote(accounts[3], web3.utils.toWei("10"));            

            let txReceipt = await eglContractInstance.evaluateUpgradeVote();            
            let evalEvent = populateAllEventDataFromLogs(txReceipt, EventType.CANDIDATE_VOTE_EVALUATED)[0];

            assert.equal(evalEvent.leadingCandidate, accounts[1], "Incorrect winner");
            assert.equal(evalEvent.leadingCandidateVotes.toString(), web3.utils.toWei("10"), "Incorrect winning vote count");
        });
        it("should delete all vote candidates after evaluation", async () => {
            await eglContractInstance.addUpgradeCandidateVote(accounts[1], web3.utils.toWei("6"));            
            await eglContractInstance.addUpgradeCandidateVote(accounts[2], web3.utils.toWei("4"));            
            await eglContractInstance.addUpgradeCandidateVote(accounts[3], web3.utils.toWei("10"));            

            let candidate1 = await eglContractInstance.voteCandidates(accounts[1]);
            let candidate2 = await eglContractInstance.voteCandidates(accounts[2]);
            let candidate3 = await eglContractInstance.voteCandidates(accounts[3]);
            assert.equal(candidate1.voteCount.toString(), web3.utils.toWei("6"), "Incorrect vote count for candidate 1");
            assert.equal(candidate2.voteCount.toString(), web3.utils.toWei("4"), "Incorrect vote count for candidate 2");
            assert.equal(candidate3.voteCount.toString(), web3.utils.toWei("10"), "Incorrect vote count for candidate 3");
            
            await eglContractInstance.evaluateUpgradeVote();            

            candidate1 = await eglContractInstance.voteCandidates(accounts[1]);
            candidate2 = await eglContractInstance.voteCandidates(accounts[2]);
            candidate3 = await eglContractInstance.voteCandidates(accounts[3]);
            assert.equal(candidate1.voteCount.toString(), "0", "Candidate1 should have been deleted");
            assert.equal(candidate2.voteCount.toString(), "0", "Candidate2 should have been deleted");
            assert.equal(candidate3.voteCount.toString(), "0", "Candidate3 should have been deleted");
        });
        it("should evaluate candidate with most votes as winning address", async () => {
            await eglContractInstance.addUpgradeCandidateVote(accounts[1], web3.utils.toWei("6"));            
            await eglContractInstance.addUpgradeCandidateVote(accounts[2], web3.utils.toWei("4"));            
            await eglContractInstance.addUpgradeCandidateVote(accounts[3], web3.utils.toWei("10"));            

            let txReceipt = await eglContractInstance.evaluateUpgradeVote();            
            let evalEvent = populateAllEventDataFromLogs(txReceipt, EventType.CANDIDATE_VOTE_EVALUATED)[0];

            assert.equal(evalEvent.leadingCandidate, accounts[3], "Incorrect winner");
            assert.equal(evalEvent.leadingCandidateVotes.toString(), web3.utils.toWei("10"), "Incorrect winning vote count");
            assert.equal(evalEvent.leadingCandidateAmount.toString(), "0", "Vote amount should be 0 for upgrades");
        });

    });
});