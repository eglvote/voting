const expectRevert = require("@openzeppelin/test-helpers/src/expectRevert");

const EglToken = artifacts.require("./EglToken.sol");
const TestableEglContract = artifacts.require("./helpers/TestableEglContract.sol");
const MockEglGenesis = artifacts.require("./helpers/MockEglGenesis.sol");
const MockBalancerPoolToken = artifacts.require("./helpers/MockBalancerPoolToken.sol");
const {
    BN,
    EventType,
    DefaultVotePauseSeconds,
    DefaultEpochLengthSeconds,
    ConsoleColors,
} = require("./helpers/constants");

const {
    populateAllEventDataFromLogs,
    getAllEventsForType,
    getNewWalletAddress,
} = require("./helpers/helper-functions");

contract("EglInternalFunctions", (accounts) => {
    const [_deployer, _supporter1, _supporter2] = accounts;
    const SEED_ACCOUNTS = [accounts[6], accounts[7]];
    const SEED_AMOUNTS = [web3.utils.toWei("2500000"), web3.utils.toWei("2500000")];

    const CREATOR_REWARDS_ACCOUNT = accounts[5];

    beforeEach(async () => {
        let totalTokenSupply = new BN(web3.utils.toWei("4000000000"));
        eglTokenInstance = await EglToken.new();
        await eglTokenInstance.initialize("EthereumGasLimit", "EGL", totalTokenSupply);

        mockEglGenesisInstance = await MockEglGenesis.new(accounts[1]);
        await mockEglGenesisInstance.sendTransaction({from: _supporter1, value: web3.utils.toWei("0.1")});
        await mockEglGenesisInstance.sendTransaction({from: _supporter2, value: web3.utils.toWei("0.2")});
        await eglTokenInstance.transfer(
            accounts[1],
            web3.utils.toWei("750000000"),
            { from: _deployer }
        )

        mockBalancerPoolTokenInstance = await MockBalancerPoolToken.new();
        await mockBalancerPoolTokenInstance.initialize("BalancerPoolToken", "BPT", web3.utils.toWei("10000"));        

        eglContractInstance = await TestableEglContract.new();        

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
            "604800",
            SEED_ACCOUNTS,
            SEED_AMOUNTS,
            CREATOR_REWARDS_ACCOUNT
        );        

        let remainingTokenBalance = await eglTokenInstance.balanceOf(_deployer);
        await eglTokenInstance.transfer(eglContractInstance.address, remainingTokenBalance.toString(), { from: _deployer });
        await mockBalancerPoolTokenInstance.transfer(eglContractInstance.address, web3.utils.toWei("10000"), { from: _deployer });

        initEvent = populateAllEventDataFromLogs(txReceipt, EventType.INITIALIZED)[0];
    });    

    describe("Fund Seed Accounts", function () {
        it("should allocate all seed funds to 1 seed account", async () => {
            let seedAccounts = [accounts[1]];
            let seedAmounts = [web3.utils.toWei("2500000")];
            let txReceipt = await eglContractInstance.fundSeedAccounts(seedAccounts, seedAmounts);

            let seedEvents = populateAllEventDataFromLogs(txReceipt, EventType.SEED_ACCOUNT_FUNDED);
            assert.equal(seedEvents.length, 1, "Incorrect number of seed accounts");
            assert.equal(seedEvents[0].seedAddress, accounts[1], "Incorrect seed account funded");
            assert.equal(seedEvents[0].individualSeedAmount, web3.utils.toWei("2500000"), "Incorrect seed amount given to seed account");            
        });
        it("should allocate seed funds equally between all seed accounts", async () => {
            let seedAccounts = [accounts[1], accounts[2], accounts[3]];
            let seedAmounts = [web3.utils.toWei("2500000"), web3.utils.toWei("1000000"), web3.utils.toWei("72400")];
            let txReceipt = await eglContractInstance.fundSeedAccounts(seedAccounts, seedAmounts);

            let seedEvents = populateAllEventDataFromLogs(txReceipt, EventType.SEED_ACCOUNT_FUNDED);
            assert.equal(seedEvents.length, 3, "Incorrect number of seed accounts");
            for (let i = 0; i < seedEvents.length; i++) {
                assert.equal(seedEvents[i].seedAddress, seedAccounts[i], "Incorrect seed account funded");
                assert.equal(seedEvents[i].individualSeedAmount, seedAmounts[i].toString(), "Incorrect seed amount given to seed account");            
            }
        });
        it("should lock tokens for seed accounts in a vote for 52 epochs", async () => {
            let seedAccounts = [accounts[1], accounts[2], accounts[3]];
            let seedAmounts = [web3.utils.toWei("2500000"), web3.utils.toWei("1000000"), web3.utils.toWei("72400")];
            let txReceipt = await eglContractInstance.fundSeedAccounts(seedAccounts, seedAmounts);

            let seedEvents = populateAllEventDataFromLogs(txReceipt, EventType.SEED_ACCOUNT_FUNDED);
            let voteEvents = populateAllEventDataFromLogs(txReceipt, EventType.VOTE);
            let expectedReleaseDate = parseInt(initEvent.firstEpochStartDate) + (parseInt(initEvent.epochLength) * 52)
            for (let i = 0; i < seedEvents.length; i++) {
                assert.equal(voteEvents[i].releaseDate.toString(), expectedReleaseDate.toString(), "Incorrect release date for seed account " + i + " vote");
            }
        });
        it("should set initial vote lockup duration to 8 epochs", async () => {
            let seedAccounts = [accounts[1], accounts[2], accounts[3]];
            let seedAmounts = [web3.utils.toWei("2500000"), web3.utils.toWei("1000000"), web3.utils.toWei("72400")];
            let txReceipt = await eglContractInstance.fundSeedAccounts(seedAccounts, seedAmounts);

            let seedEvents = populateAllEventDataFromLogs(txReceipt, EventType.SEED_ACCOUNT_FUNDED);
            let voteEvents = populateAllEventDataFromLogs(txReceipt, EventType.VOTE);
            for (let i = 0; i < seedEvents.length; i++) {
                assert.equal(voteEvents[i].lockupDuration.toString(), "8", "Incorrect lockup duration for seed account " + i + " vote");
            }
        });
        it("should vote with current gas limit for initial seed vote", async () => {
            let seedAccounts = [accounts[1], accounts[2], accounts[3]];
            let seedAmounts = [web3.utils.toWei("2500000"), web3.utils.toWei("1000000"), web3.utils.toWei("72400")];
            let txReceipt = await eglContractInstance.fundSeedAccounts(seedAccounts, seedAmounts);
                        
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
            let expectedWeeklyCreatorReward = new BN(web3.utils.toWei("750000000")).div(new BN(52 - 9));
            assert.equal(creatorRewardEvents[0].creatorRewardAddress, CREATOR_REWARDS_ACCOUNT, "Creator reward sent to the wrong address");
            assert.equal(creatorRewardEvents[0].amountClaimed.toString(), expectedWeeklyCreatorReward.toString(), "Incorrect creator reward amount");
            assert.equal(creatorAddressBalancePost.toString(), creatorAddressBalancePre.add(expectedWeeklyCreatorReward).toString(), "Incorrect balance after creator rewards claimed");
        });
        it("should decrease remaining reward when the weekly reward is claimed", async () => {
            let txReceipt = await eglContractInstance.issueCreatorRewards();

            let creatorRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.CREATOR_REWARDS_CLAIMED);
            let expectedWeeklyCreatorReward = new BN(web3.utils.toWei("750000000")).div(new BN(52 - 9));
            let expectedRemainingBalance = new BN(web3.utils.toWei("750000000")).sub(expectedWeeklyCreatorReward);
            assert.equal(creatorRewardEvents[0].remainingCreatorReward.toString(), expectedRemainingBalance.toString(), "Incorrect remaining balance after 1 claim");
        });
        it("should increase total number of tokens in circulation when the weekly reward is claimed", async () => {
            let tokensInCirculationPre = await eglContractInstance.tokensInCirculation();
            await eglContractInstance.issueCreatorRewards();
            
            let tokensInCirculationPost = await eglContractInstance.tokensInCirculation();
            let expectedWeeklyCreatorReward = new BN(web3.utils.toWei("750000000")).div(new BN(52 - 9));
            let expectedTokensInCirculation = tokensInCirculationPre.add(expectedWeeklyCreatorReward);
            assert.equal(tokensInCirculationPost.toString(), expectedTokensInCirculation.toString(), "Incorrect number of tokens in circulation");
        });
        it("should have less than 1 remaining creator reward token after creator reward period ends (43 epochs)", async () => {
            let numberEpochs = 0;
            let remainingBalance = new BN(web3.utils.toWei("750000000"));
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
            let remainingBalance = new BN(web3.utils.toWei("750000000"));
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
        it.only("DEBUG", async () => {
            let tallyVoteGasLimit = 15000000;           
            let desiredEgl = 15100000;            
            let blockGasLimit = 15100000;

            let txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, tallyVoteGasLimit);

            let debugEvent = populateAllEventDataFromLogs(txReceipt, "BlockRewardCalculated");
            console.log("Event: ", debugEvent)
            // uint blockNumber, 
            // uint remainingPoolReward,
            // int blockGasLimit, 
            // int desiredEgl,
            // int tallyVotesGasLimit,
            // int buffer,
            // int proximityRewardPercent,
            // uint totalRewardPercent,
            // uint blockReward
            console.log("blockGasLimit: ", debugEvent[0].blockGasLimit.toString());
            console.log("desiredEgl: ", debugEvent[0].desiredEgl.toString());
            console.log("tallyVotesGasLimit: ", debugEvent[0].tallyVotesGasLimit.toString());
            console.log("proximityRewardPercent: ", web3.utils.fromWei(debugEvent[0].proximityRewardPercent.toString()));
            console.log("totalRewardPercent: ", web3.utils.fromWei(debugEvent[0].totalRewardPercent.toString()));
            console.log("blockReward: ", web3.utils.fromWei(debugEvent[0].blockReward.toString()));
            // assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "100", "Incorrect reward percentage calculated");
            console.log("********************************************************************************")

            tallyVoteGasLimit = 15000000;           
            desiredEgl = 15100000;            
            blockGasLimit = 15101000;

            txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, tallyVoteGasLimit);

            debugEvent = populateAllEventDataFromLogs(txReceipt, "BlockRewardCalculated");
            console.log("Event: ", debugEvent)
            // uint blockNumber, 
            // uint remainingPoolReward,
            // int blockGasLimit, 
            // int desiredEgl,
            // int tallyVotesGasLimit,
            // int buffer,
            // int proximityRewardPercent,
            // uint totalRewardPercent,
            // uint blockReward
            console.log("blockGasLimit: ", debugEvent[0].blockGasLimit.toString());
            console.log("desiredEgl: ", debugEvent[0].desiredEgl.toString());
            console.log("tallyVotesGasLimit: ", debugEvent[0].tallyVotesGasLimit.toString());
            console.log("proximityRewardPercent: ", web3.utils.fromWei(debugEvent[0].proximityRewardPercent.toString()));
            console.log("totalRewardPercent: ", web3.utils.fromWei(debugEvent[0].totalRewardPercent.toString()));
            console.log("blockReward: ", web3.utils.fromWei(debugEvent[0].blockReward.toString()));
            // assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "100", "Incorrect reward percentage calculated");
            console.log("********************************************************************************")

            tallyVoteGasLimit = 15000000;           
            desiredEgl = 15100000;            
            blockGasLimit = 15100000;

            txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, tallyVoteGasLimit);

            debugEvent = populateAllEventDataFromLogs(txReceipt, "BlockRewardCalculated");
            console.log("Event: ", debugEvent)
            // uint blockNumber, 
            // uint remainingPoolReward,
            // int blockGasLimit, 
            // int desiredEgl,
            // int tallyVotesGasLimit,
            // int buffer,
            // int proximityRewardPercent,
            // uint totalRewardPercent,
            // uint blockReward
            console.log("blockGasLimit: ", debugEvent[0].blockGasLimit.toString());
            console.log("desiredEgl: ", debugEvent[0].desiredEgl.toString());
            console.log("tallyVotesGasLimit: ", debugEvent[0].tallyVotesGasLimit.toString());
            console.log("proximityRewardPercent: ", web3.utils.fromWei(debugEvent[0].proximityRewardPercent.toString()));
            console.log("totalRewardPercent: ", web3.utils.fromWei(debugEvent[0].totalRewardPercent.toString()));
            console.log("blockReward: ", web3.utils.fromWei(debugEvent[0].blockReward.toString()));
            // assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "100", "Incorrect reward percentage calculated");
            console.log("********************************************************************************")
        });
        it("should give pool 100% of the block reward ", async () => {
            let gasLimit = 7200000;
            let desiredEgl = 7200000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit, desiredEgl);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "100", "Incorrect reward percentage calculated");
        });
        it("should give pool 92.5% of the block reward if actual gas limit less than EGL", async () => {
            let gasLimit = 7100000;
            let desiredEgl = 7200000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit, desiredEgl);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "92.5", "Incorrect reward percentage calculated");
        });
        it("should give pool 62.5% of the block reward if actual gas limit less than EGL", async () => {
            let gasLimit = 6700000;
            let desiredEgl = 7200000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit, desiredEgl);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "62.5", "Incorrect reward percentage calculated");
        });
        it("should give pool 32.5% of the block reward if actual gas limit less than EGL", async () => {
            let gasLimit = 6300000;
            let desiredEgl = 7200000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit, desiredEgl);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "32.5", "Incorrect reward percentage calculated");
        });
        it("should give pool 25% of the block reward if actual gas limit less than EGL", async () => {
            let gasLimit = 6200000;
            let desiredEgl = 7200000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit, desiredEgl);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "25", "Incorrect reward percentage calculated");
        });
        it("should give pool 0% of the block reward if actual gas limit less than EGL", async () => {
            let gasLimit = 6100000;
            let desiredEgl = 7200000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit, desiredEgl);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "0", "Incorrect reward percentage calculated");
        });
        it("should give pool 92.5% of the block reward if actual gas limit more than EGL", async () => {
            let gasLimit = 7300000;
            let desiredEgl = 7200000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit, desiredEgl);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "92.5", "Incorrect reward percentage calculated");
        });
        it("should give pool 62.5% of the block reward if actual gas limit more than EGL", async () => {
            let gasLimit = 7700000;
            let desiredEgl = 7200000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit, desiredEgl);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "62.5", "Incorrect reward percentage calculated");
        });
        it("should give pool 32.5% of the block reward if actual gas limit more than EGL", async () => {
            let gasLimit = 8100000;
            let desiredEgl = 7200000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit, desiredEgl);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "32.5", "Incorrect reward percentage calculated");
        });
        it("should give pool 25% of the block reward if actual gas limit more than EGL", async () => {
            let gasLimit = 8200000;
            let desiredEgl = 7200000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit, desiredEgl);

            let blockRewardEvents = populateAllEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvents[0].rewardPercent.toString()), "25", "Incorrect reward percentage calculated");
        });
        it("should give pool 0% of the block reward if actual gas limit more than EGL", async () => {
            let gasLimit = 8300000;
            let desiredEgl = 7200000;
            let txReceipt = await eglContractInstance.calculateBlockReward(gasLimit, desiredEgl);

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

    function getExpectedEgl(secondsPassed) {
        let lockUpPeriod = parseInt(initEvent.minLiquidityTokensLockup);
        let epochLength = parseInt(initEvent.epochLength);
        // let secondsPassed = lockUpPeriod + _secondsPassed;
        return ((secondsPassed - lockUpPeriod) / ((epochLength * 52) - lockUpPeriod))**4 * 750000000;

    }
    describe("Calculate Current EGL", function () {
        it("should calculate current EGL after 5 seconds passed lockup end date", async () => {                        
            let secondsPassed = 6048005
            let txReceipt = await eglContractInstance.calculateCurrentEgl(secondsPassed)
            let event = populateAllEventDataFromLogs(txReceipt, "CurrentEglCalculated");

            assert.approximately(
                parseFloat(web3.utils.fromWei(event[0].currentEgl.toString())),
                getExpectedEgl(secondsPassed), 
                1/10**18,
                "Incorrect current EGL calculated"
            );
        });
        it("should calculate current EGL after 100 days passed", async () => {                        
            let secondsPassed = 8640000
            let txReceipt = await eglContractInstance.calculateCurrentEgl(secondsPassed)
            let event = populateAllEventDataFromLogs(txReceipt, "CurrentEglCalculated");

            assert.approximately(
                parseFloat(web3.utils.fromWei(event[0].currentEgl.toString())),
                getExpectedEgl(secondsPassed), 
                0.001,
                "Incorrect current EGL calculated"
            );
        });
        it("should calculate current EGL after 200 days passed", async () => {                        
            let secondsPassed = 17280000
            let txReceipt = await eglContractInstance.calculateCurrentEgl(secondsPassed)
            let event = populateAllEventDataFromLogs(txReceipt, "CurrentEglCalculated");

            assert.approximately(
                parseFloat(web3.utils.fromWei(event[0].currentEgl.toString())),
                getExpectedEgl(secondsPassed), 
                0.1,
                "Incorrect current EGL calculated"
            );
        });
        it("should calculate current EGL after 364 days passed", async () => {                        
            let secondsPassed = 31449600
            let txReceipt = await eglContractInstance.calculateCurrentEgl(secondsPassed)
            let event = populateAllEventDataFromLogs(txReceipt, "CurrentEglCalculated");

            assert.approximately(
                parseFloat(web3.utils.fromWei(event[0].currentEgl.toString())),
                getExpectedEgl(secondsPassed), 
                1/10**18,
                "Incorrect current EGL calculated"
            );
        });
        it("should calculate current EGL after 1 second before 52 epochs passed", async () => {                        
            let secondsPassed = 31449599
            let txReceipt = await eglContractInstance.calculateCurrentEgl(secondsPassed)
            let event = populateAllEventDataFromLogs(txReceipt, "CurrentEglCalculated");

            assert.approximately(
                parseFloat(web3.utils.fromWei(event[0].currentEgl.toString())),
                getExpectedEgl(secondsPassed), 
                0.1,
                "Incorrect current EGL calculated"
            );
        });
        it("should always return launch EGL amount after the first year", async () => {     
            let maxRewardEpochs = 604800 * 52
            let valuesOver52Epochs = [ maxRewardEpochs + 5, maxRewardEpochs + 2500, maxRewardEpochs + 12743]       
            let txReceipt = "";
            let event = "";
            for (let i = 0; i < valuesOver52Epochs.length; i++) {
                txReceipt = await eglContractInstance.calculateCurrentEgl(valuesOver52Epochs[i])
                event = populateAllEventDataFromLogs(txReceipt, "CurrentEglCalculated");
                assert.equal(web3.utils.fromWei(event[0].currentEgl.toString()), "750000000", "Incorrect current EGL calculated");
            }
        });
        it("should revert if time passed still within lockup period", async () => {
            let beforeLockupEnds = initEvent.minLiquidityTokensLockup - 10;
            await expectRevert(
                eglContractInstance.calculateCurrentEgl(beforeLockupEnds),
                "SafeMath: subtraction overflow"
            )
        });
    });
    describe("Calculate Current Pool Tokens Due", function () {

    });
    describe("Calculate Bonus EGLs Due", function () {

    });
    describe("Calculate Voter Reward", function () {

    });
});