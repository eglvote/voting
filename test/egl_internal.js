const expectRevert = require("@openzeppelin/test-helpers/src/expectRevert");
const { time } = require("@openzeppelin/test-helpers");

const EglToken = artifacts.require("./EglToken.sol");
const TestableEglContract = artifacts.require("./helpers/TestableEglContract.sol");
const MockEglGenesis = artifacts.require("./helpers/MockEglGenesis.sol");
const MockBalancerPoolToken = artifacts.require("./helpers/MockBalancerPoolToken.sol");
const {
    EventType,
    DefaultVotePauseSeconds,
    DefaultEpochLengthSeconds,
} = require("./helpers/constants");

const {
    populateAllEventDataFromLogs,
    populateEventDataFromLogs
} = require("./helpers/helper-functions");
const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");

contract("EglInternalFunctionsTests", (accounts) => {
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
    let minLiquidityTokensLockup;
    let epochLength;
    let firstEpochStartDate;

    async function castVotes(...voteValues) {
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

    beforeEach(async () => {
        let totalTokenSupply = web3.utils.toWei("4000000000");
        eglTokenInstance = await EglToken.new();
        await eglTokenInstance.initialize(_genesisOwner, "EthereumGasLimit", "EGL", totalTokenSupply);

        mockEglGenesisInstance = await MockEglGenesis.new(_genesisOwner);
        await mockEglGenesisInstance.sendTransaction({from: _genesisSupporter1, value: web3.utils.toWei("0.1")});
        await mockEglGenesisInstance.sendTransaction({from: _genesisSupporter2, value: web3.utils.toWei("0.2")});

        mockBalancerPoolTokenInstance = await MockBalancerPoolToken.new();
        await mockBalancerPoolTokenInstance.initialize("BalancerPoolToken", "BPT", web3.utils.toWei("75000000"));
        await mockBalancerPoolTokenInstance.transfer(
            _genesisOwner,
            web3.utils.toWei("75000000"),
            { from: _deployer }
        )

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

    describe("Internal Vote", function () {
        it("should not allow vote if voter has already voted", async () => {
            await castVotes(
                [7000000, "5000", 8, _voter1],
            );

            await expectRevert(
                eglContractInstance.internalVote(
                    _voter1,
                    7000000,
                    web3.utils.toWei("100"),
                    5,
                    Math.round(new Date().getTime() / 1000)
                ),
                "EGL:ALREADY_VOTED"
            )
        });
        it("should not allow gas target that is more or less than 4,000,000 from the current gas limit", async () => {
            // Assume actual gas limit is 6721975
            await expectRevert(
                eglContractInstance.internalVote(
                    _voter1,
                    10721975,
                    web3.utils.toWei("100"),
                    5,
                    Math.round(new Date().getTime() / 1000)
                ),
                "EGL:INVALID_GAS_TARGET"
            )
            await expectRevert(
                eglContractInstance.internalVote(
                    _voter1,
                    2721975,
                    web3.utils.toWei("100"),
                    5,
                    Math.round(new Date().getTime() / 1000)
                ),
                "EGL:INVALID_GAS_TARGET"
            )
            await expectRevert(
                eglContractInstance.internalVote(
                    _voter1,
                    1000000,
                    web3.utils.toWei("100"),
                    5,
                    Math.round(new Date().getTime() / 1000)
                ),
                "EGL:INVALID_GAS_TARGET"
            )
            await expectRevert(
                eglContractInstance.internalVote(
                    _voter1,
                    1500000,
                    web3.utils.toWei("100"),
                    5,
                    Math.round(new Date().getTime() / 1000)
                ),
                "EGL:INVALID_GAS_TARGET"
            )
        });
        it("should not allow lockup duration shorter than 1 or longer than 8", async () => {
            await expectRevert(
                eglContractInstance.internalVote(
                    _voter1,
                    6721975,
                    web3.utils.toWei("100"),
                    0,
                    Math.round(new Date().getTime() / 1000)
                ),
                "EGL:INVALID_LOCKUP"
            )
            await expectRevert(
                eglContractInstance.internalVote(
                    _voter1,
                    6721975,
                    web3.utils.toWei("100"),
                    9,
                    Math.round(new Date().getTime() / 1000)
                ),
                "EGL:INVALID_LOCKUP"
            )
            await expectRevert(
                eglContractInstance.internalVote(
                    _voter1,
                    6721975,
                    web3.utils.toWei("100"),
                    30,
                    Math.round(new Date().getTime() / 1000)
                ),
                "EGL:INVALID_LOCKUP"
            )
        });
        it("should not allow votes when the contract is more that 1 epoch behind", async () => {
            await time.increase(DefaultEpochLengthSeconds * 2);
            await expectRevert(
                eglContractInstance.internalVote(
                    _voter1,
                    6721975,
                    web3.utils.toWei("100"),
                    4,
                    Math.round(new Date().getTime() / 1000)
                ),
                "EGL:VOTE_TOO_FAR"
            )
        });
        it("should not allow votes 5 minutes before the vote is scheduled to end", async () => {
            await time.increase(DefaultEpochLengthSeconds - DefaultVotePauseSeconds);
            await expectRevert(
                eglContractInstance.internalVote(
                    _voter1,
                    6721975,
                    web3.utils.toWei("100"),
                    4,
                    Math.round(new Date().getTime() / 1000)
                ),
                "EGL:VOTE_TOO_CLOSE"
            )
        });
        it("should not allow votes before the first epoch has started", async () => {
            let eglTokenInstance = await EglToken.new();
            await eglTokenInstance.initialize(_genesisOwner, "EthereumGasLimit", "EGL", web3.utils.toWei("4000000000"));
    
            let customMockEglGenesisInstance = await MockEglGenesis.new(_genesisOwner);
            await customMockEglGenesisInstance.sendTransaction({from: _genesisSupporter1, value: web3.utils.toWei("0.1")});
    
            let customBalancerPoolTokenInstance = await MockBalancerPoolToken.new();
            await customBalancerPoolTokenInstance.initialize("BalancerPoolToken", "BPT", web3.utils.toWei("75000000"));
            await customBalancerPoolTokenInstance.transfer(
                _genesisOwner,
                web3.utils.toWei("75000000"),
                { from: _deployer }
            )
        
            let customEglContractInstance = await TestableEglContract.new();        
    
            let eglContractDeploymentHash = customEglContractInstance.transactionHash;
            let eglContractDeploymentTransaction = await web3.eth.getTransaction(eglContractDeploymentHash);
            eglContractDeployBlockNumber = eglContractDeploymentTransaction.blockNumber;
            let eglContractDeploymentBlock = await web3.eth.getBlock(eglContractDeployBlockNumber);
            let eglContractDeploymentTimestamp = parseInt(eglContractDeploymentBlock.timestamp) + 86400;

            await customEglContractInstance.initialize(
                eglTokenInstance.address,
                customBalancerPoolTokenInstance.address,
                customMockEglGenesisInstance.address,
                eglContractDeploymentTimestamp,
                DefaultVotePauseSeconds,
                DefaultEpochLengthSeconds,
                seedAccounts,
                seedAmounts,
                _creatorRewardsAccount
            );        
    
            await eglTokenInstance.transfer(_voter1, web3.utils.toWei("250000000"), { from: _genesisOwner })
            await eglTokenInstance.increaseAllowance(customEglContractInstance.address, web3.utils.toWei("250000000"), { from: _voter1 });

            await eglTokenInstance.transfer(customEglContractInstance.address, web3.utils.toWei("3250000000"), { from: _genesisOwner });
            await customBalancerPoolTokenInstance.transfer(customEglContractInstance.address, web3.utils.toWei("75000000"), { from: _genesisOwner });
    
            await expectRevert(
                customEglContractInstance.internalVote(
                    _voter1,
                    6721975,
                    web3.utils.toWei("100"),
                    4,
                    Math.round(new Date().getTime() / 1000)
                ),
                "EGL:VOTING_NOT_STARTED"
            )
        });
        it("should add single (and only) vote for a lockup duration of 4 weeks", async () => {
            let currentEpoch = parseInt(await eglContractInstance.currentEpoch());
            await eglContractInstance.internalVote(
                _voter1, 
                7000000, 
                web3.utils.toWei("5000"), 
                4, 
                Math.round(new Date().getTime() / 1000)
            );

            let voter = await eglContractInstance.voters(_voter1);
            assert.equal(voter.voteEpoch, "0", "Incorrect vote epoch stored for voter");
            assert.equal(voter.lockupDuration, "4", "Incorrect lockup duration stored for voter");
            assert.equal(web3.utils.fromWei(voter.tokensLocked.toString()), "5000", "Incorrect tokens locked stored for voter");
            assert.equal(voter.gasTarget, "7000000", "Incorrect gas target stored for voter");

            for (let i = 0; i < 4; i++) {                
                let voteWeightSum = await eglContractInstance.voteWeightsSum(i);
                let votesTotal = await eglContractInstance.votesTotal(i);    
                let voterRewardSums = await eglContractInstance.voterRewardSums(currentEpoch + i);
                assert.equal(web3.utils.fromWei(voteWeightSum.toString()), "20000", "Incorrect vote weight sum stored for epoch " + i);
                assert.equal(web3.utils.fromWei(votesTotal.toString()), "5000", "Incorrect votes total added")
                assert.equal(web3.utils.fromWei(voterRewardSums.toString()), "20000", "Incorrect voter reward sums total")
            }
        });
        it("should add vote to existing votes for a lockup duration of 7 weeks", async () => {            
            await eglContractInstance.internalVote(
                _voter1, 
                7000000, 
                web3.utils.toWei("5000"), 
                4, 
                Math.round(new Date().getTime() / 1000)
            );
            await time.increase(DefaultEpochLengthSeconds + 300);
            await eglContractInstance.tallyVotes();
            let currentEpoch = parseInt(await eglContractInstance.currentEpoch());
            assert.equal(currentEpoch, 1, "Incorrect epoch");
            
            await eglContractInstance.internalVote(
                _voter2, 
                7500000, 
                web3.utils.toWei("7500"), 
                7, 
                Math.round(new Date().getTime() / 1000)
            );

            let voter = await eglContractInstance.voters(_voter2);
            assert.equal(voter.voteEpoch.toString(), "1", "Incorrect vote epoch stored for voter");
            assert.equal(voter.lockupDuration, "7", "Incorrect lockup duration stored for voter");
            assert.equal(web3.utils.fromWei(voter.tokensLocked.toString()), "7500", "Incorrect tokens locked stored for voter");
            assert.equal(voter.gasTarget, "7500000", "Incorrect gas target stored for voter");

            // Votes overlap for 3 epochs
            for (let i = 0; i < 3; i++) {                
                let voteWeightSum = await eglContractInstance.voteWeightsSum(i);
                let votesTotal = await eglContractInstance.votesTotal(i);    
                assert.equal(web3.utils.fromWei(voteWeightSum.toString()), "72500", "Incorrect vote weight sum stored for epoch " + i);
                assert.equal(web3.utils.fromWei(votesTotal.toString()), "12500", "Incorrect votes total added")
            }

            // Only 1 votes remains for the remaining 4 epochs
            for (let i = 3; i < 7; i++) {                
                let voteWeightSum = await eglContractInstance.voteWeightsSum(i);
                let votesTotal = await eglContractInstance.votesTotal(i);    
                assert.equal(web3.utils.fromWei(voteWeightSum.toString()), "52500", "Incorrect vote weight sum stored for epoch " + i);
                assert.equal(web3.utils.fromWei(votesTotal.toString()), "7500", "Incorrect votes total added")
            }

            // Total votes weights per epoch - used to calculate rewards due for any given epoch
            let expectedVoterRewardSums = ["20000", "72500", "72500", "72500", "52500", "52500", "52500", "52500"]
            for (let i = 0; i < 8; i++) {                
                let voterRewardSums = await eglContractInstance.voterRewardSums(i);
                assert.equal(web3.utils.fromWei(voterRewardSums.toString()), expectedVoterRewardSums[i], "Incorrect voter reward sums total")
            }
        });
        it("should emit vote event with details of vote", async () => {            
            let txReceipt = await eglContractInstance.internalVote(
                _voter1, 
                7000000, 
                web3.utils.toWei("5000"), 
                4, 
                Math.round(new Date().getTime() / 1000)
            );

            let events = populateAllEventDataFromLogs(txReceipt, EventType.VOTE);
            assert.equal(events.length, 1, "No Vote event emitted");
            assert.equal(events[0].caller, _voter1, "Incorrect voter");
            assert.equal(events[0].currentEpoch, "0", "Incorrect voter epoch");
            assert.equal(events[0].gasTarget, "7000000", "Incorrect gas target");            
            assert.equal(web3.utils.fromWei(events[0].eglAmount.toString()), "5000", "Incorrect EGL amount");
            assert.equal(events[0].lockupDuration, "4", "Incorrect gas target");
            assert.equal(web3.utils.fromWei(events[0].epochVoteWeightSum.toString()), "20000", "Incorrect epoch vote weight sum");
            assert.equal(web3.utils.fromWei(events[0].epochVoterRewardSum.toString()), "20000", "Incorrect epoch voter reward sum");
            assert.equal(web3.utils.fromWei(events[0].epochTotalVotes.toString()), "5000", "Incorrect total votes");
        });
    });
    describe("Internal Withdraw", function () {
        it("should withdraw vote and update current and future votes totals if withdraw in same epoch as vote", async () => {
            let currentEpoch = parseInt(await eglContractInstance.currentEpoch());
            await castVotes(
                [7000000, "5000", 8, _voter1],
                [7000000, "9000", 8, _voter2],
            );

            let voter = await eglContractInstance.voters(_voter1);
            assert.equal(web3.utils.fromWei(voter.tokensLocked.toString()), "5000", "Incorrect tokens locked")
            assert.equal(voter.lockupDuration.toString(), "8", "Incorrect lockup duration")
            for (let i = 0; i < 8; i++) {                
                let voteWeightSum = await eglContractInstance.voteWeightsSum(i);
                assert.equal(web3.utils.fromWei(voteWeightSum.toString()), "112000", "Incorrect vote weight sum stored for epoch " + i);
                let votesTotal = await eglContractInstance.votesTotal(i);    
                assert.equal(web3.utils.fromWei(votesTotal.toString()), "14000", "Incorrect votes total added")
                let voterRewardSums = await eglContractInstance.voterRewardSums(currentEpoch + i);
                assert.equal(web3.utils.fromWei(voterRewardSums.toString()), "112000", "Incorrect voter reward sums total")
            }

            await eglContractInstance.internalWithdraw(_voter1);

            voter = await eglContractInstance.voters(_voter1);
            assert.equal(web3.utils.fromWei(voter.tokensLocked.toString()), "0", "Voter should have been deleted")
            assert.equal(voter.lockupDuration.toString(), "0", "Voter should have been deleted")
            for (let i = 0; i < 8; i++) {                
                let voteWeightSum = await eglContractInstance.voteWeightsSum(i);
                assert.equal(web3.utils.fromWei(voteWeightSum.toString()), "72000", "Incorrect vote weight sum stored for epoch " + i);
                let votesTotal = await eglContractInstance.votesTotal(i);    
                assert.equal(web3.utils.fromWei(votesTotal.toString()), "9000", "Incorrect votes total added")
                let voterRewardSums = await eglContractInstance.voterRewardSums(currentEpoch + i);
                assert.equal(web3.utils.fromWei(voterRewardSums.toString()), "72000", "Incorrect voter reward sums total")
            }
        });
        it("should withdraw vote and update current and future votes totals if withdrawn in future epoch", async () => {
            await castVotes(
                [7000000, "5000", 6, _voter1],
                [7000000, "9000", 6, _voter2],
            );

            for (let i = 0; i < 2; i++) {
                await time.increase(DefaultEpochLengthSeconds + 60);
                await eglContractInstance.tallyVotes();
            }

            await eglContractInstance.internalWithdraw(_voter1);

            voter = await eglContractInstance.voters(_voter1);
            assert.equal(web3.utils.fromWei(voter.tokensLocked.toString()), "0", "Voter should have been deleted")
            assert.equal(voter.lockupDuration.toString(), "0", "Voter should have been deleted")
            for (let i = 0; i < 4; i++) {                
                let voteWeightSum = await eglContractInstance.voteWeightsSum(i);
                assert.equal(web3.utils.fromWei(voteWeightSum.toString()), "54000", "Incorrect vote weight sum stored for epoch " + i);
                let votesTotal = await eglContractInstance.votesTotal(i);    
                assert.equal(web3.utils.fromWei(votesTotal.toString()), "9000", "Incorrect votes total added")
            }

            let expectedValues = ["84000", "84000","54000","54000", "54000", "54000"]
            for (let i = 0; i < 6; i++) {                
                let voterRewardSums = await eglContractInstance.voterRewardSums(i);
                assert.equal(web3.utils.fromWei(voterRewardSums.toString()), expectedValues[i], "Incorrect voter reward sums total")
            }
        });
        it("should withdraw vote but not adjust voter reward sums if current epoch past the vote interval", async () => {            
            await castVotes(
                [7000000, "5000", 4, _voter1],
                [7000000, "9000", 4, _voter2],
            );

            for (let i = 0; i < 5; i++) {
                await time.increase(DefaultEpochLengthSeconds + 300);
                await eglContractInstance.tallyVotes();
            }
            let currentEpoch = parseInt(await eglContractInstance.currentEpoch());
            assert.equal(currentEpoch.toString(), "5", "Incorrect epoch");

            let expectedValues = ["56000", "56000","56000","56000", "0"]
            for (let i = 0; i < 5; i++) {                
                let voterRewardSums = await eglContractInstance.voterRewardSums(i);
                assert.equal(web3.utils.fromWei(voterRewardSums.toString()), expectedValues[i], "Incorrect voter reward sums total")
            }

            await eglContractInstance.internalWithdraw(_voter1);

            for (let i = 0; i < currentEpoch; i++) {                
                let voterRewardSums = await eglContractInstance.voterRewardSums(i);
                assert.equal(web3.utils.fromWei(voterRewardSums.toString()), expectedValues[i], "Reward sums should not have been affected")
            }

            let voter = await eglContractInstance.voters(_voter1);
            assert.equal(web3.utils.fromWei(voter.tokensLocked.toString()), "0", "Voter should have been deleted")
            assert.equal(voter.lockupDuration.toString(), "0", "Voter should have been deleted")
        });
        it("should add voter rewards to tokens in circulation after withdraw", async () => {            
            await castVotes(
                [7000000, "5000", 4, _voter1],
                [7000000, "9000", 4, _voter2],
            );
            let tokensInCirculationPre = await eglContractInstance.tokensInCirculation();

            let txReceipt = await eglContractInstance.internalWithdraw(_voter1);
            
            let tokensInCirculationPost = await eglContractInstance.tokensInCirculation();
            let events = populateAllEventDataFromLogs(txReceipt, EventType.WITHDRAW);
            let expectedTic = 
                parseFloat(web3.utils.fromWei(events[0].rewardTokens.toString())) + 
                parseFloat(web3.utils.fromWei(tokensInCirculationPre.toString()))
            assert.equal(web3.utils.fromWei(tokensInCirculationPost.toString()), expectedTic.toString(), "Incorrect tokens in circulation") 

        });
        it("should revert if voter address is 0", async () => {
            await expectRevert(
                eglContractInstance.internalWithdraw(ZERO_ADDRESS),
                "EGL:VOTER_ADDRESS_0"
            )
        });
    });
    describe("Issue Creator Rewards", function () {
        it("should transfer creator reward EGL's to creator reward account", async () => {
            let currentEpoch = 11;
            let creatorAddressBalancePre = await eglTokenInstance.balanceOf(_creatorRewardsAccount);
            assert.equal(creatorAddressBalancePre, "0", "Creator reward account balance should be 0");

            let txReceipt = await eglContractInstance.issueCreatorRewards(currentEpoch);
            
            let creatorRewardEvents = populateEventDataFromLogs(txReceipt, EventType.CREATOR_REWARDS_CLAIMED);
            let creatorAddressBalancePost = await eglTokenInstance.balanceOf(_creatorRewardsAccount);            

            assert.equal(creatorRewardEvents.creatorRewardAddress, _creatorRewardsAccount, "Creator reward sent to the wrong address");
            assert.equal(creatorRewardEvents.amountClaimed.toString(), creatorAddressBalancePost.toString(), "Incorrect creator reward amount");
        });
        it("should calculate correct reward for each epoch", async () => {
            // See CREATOR REWARDS in 'files/calculations.txt' for formulas to calculate expected values
            let expectedRewardAmounts = [
                0.000000000000, 241.026115661684, 3615.391734925260, 15666.697518009500, 42179.570240794700,
                88938.636679161500, 161728.523608990000, 266333.857806161000, 408539.266046555000, 
                594129.375106051000, 828888.811760532000, 1118602.202785880000, 1469054.174957960000,
                1886029.355052680000, 2375312.369845890000, 2942687.846113510000, 3593940.410631370000,
                4334854.690175400000, 5171215.311521430000, 6108806.901445400000, 7153414.086723120000,
                8310821.494130540000, 9586813.750443500000, 10987175.482437900000, 12517691.316889500000,
                14184145.880574500000, 15992323.800268400000, 17948009.702747300000, 20056988.214787000000,
                22325043.963163500000, 24757961.574652600000, 27361525.676030100000, 30141520.894071800000,
                33103731.855554000000, 36253943.187252300000, 39597939.515942500000, 43141505.468400400000,
                46890425.671402400000, 50850484.751723900000, 55027467.336140800000, 59427158.051429000000,
                64055341.524364800000, 68917802.381723800000,
            ]
            for (let i = 0; i < 43; i++) {
                let txReceipt = await eglContractInstance.issueCreatorRewards(i + 10);
                let creatorRewardEvents = populateEventDataFromLogs(txReceipt, EventType.CREATOR_REWARDS_CLAIMED);

                let actualRewardAmount = parseFloat(web3.utils.fromWei(creatorRewardEvents.amountClaimed.toString())).toFixed(6);
                assert.approximately(
                    parseFloat(actualRewardAmount), 
                    parseFloat(expectedRewardAmounts[i].toFixed(6)), 
                    0.3, 
                    "Incorrect reward calculated for epoch " + (i + 10)
                );                
            }            
        });
        it("should decrease remaining reward when the weekly reward is claimed", async () => {
            // See REMAINING CREATOR REWARDS BALANCE in 'files/calculations.txt' for formulas to calculate expected values
            let expectedRemainingBalance = [
                750000000.0000000000, 749999758.9738840000, 749996143.5821490000, 749980476.8846310000,
                749938297.3143910000, 749849358.6777120000, 749687630.1541030000, 749421296.2962960000,
                749012757.0302500000, 748418627.6551440000, 747589738.8433830000, 746471136.6405970000,
                745002082.4656390000, 743116053.1105870000, 740740740.7407410000, 737798052.8946270000,
                734204112.4839960000, 729869257.7938200000, 724698042.4822990000, 718589235.5808540000,
                711435821.4941300000, 703125000.0000000000, 693538186.2495560000, 682551010.7671190000,
                670033319.4502290000, 655849173.5696550000, 639856849.7693860000, 621908840.0666390000,
                601851851.8518520000, 579526807.8886880000, 554768846.3140360000, 527407320.6380060000,
                497265799.7439340000, 464162067.8883800000, 427908124.7011280000, 388310185.1851850000,
                345168679.7167850000, 298278254.0453820000, 247427769.2936580000, 192400301.9575180000,
                132973143.9060890000, 68917802.3817238000, 0.0000000000,                
            ]
            for (let i = 0; i < 43; i++) {
                let txReceipt = await eglContractInstance.issueCreatorRewards(i + 10);
                let creatorRewardEvents = populateEventDataFromLogs(txReceipt, EventType.CREATOR_REWARDS_CLAIMED);

                let actualRemainingBalance = parseFloat(web3.utils.fromWei(creatorRewardEvents.remainingCreatorReward.toString())).toFixed(6);
                assert.approximately(
                    parseFloat(actualRemainingBalance), 
                    parseFloat(expectedRemainingBalance[i].toFixed(6)), 
                    0.3, 
                    "Incorrect reward calculated for epoch " + (i + 10)
                );                
            }
        });
        it("should increase total number of tokens in circulation when the weekly reward is claimed", async () => {
            let tokensInCirculationPre = await eglContractInstance.tokensInCirculation();
            assert.equal(tokensInCirculationPre.toString(), web3.utils.toWei("750000000"), "Incorrect initial number of tokens in circulation");
            for (let i = 0; i < 43; i++) {
                await eglContractInstance.issueCreatorRewards(i + 10);
            }            
            let tokensInCirculationPost = await eglContractInstance.tokensInCirculation();
            assert.equal(tokensInCirculationPost.toString(), web3.utils.toWei("1500000000"), "Incorrect number of tokens in circulation");
        });
    });
    describe("Calculate Block Reward", function () {
        it("should calculate 100% reward if block gas limit within 10k of desired EGL", async () => {
            let desiredEgl = 15000000;            
            let blockGasLimit = 15010000;

            let txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, 0);
            let blockRewardEvent = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvent.totalRewardPercent.toString()), "100", "Block reward percentage should be 100%")
            
            blockGasLimit = 15000750;
            txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, 0);
            blockRewardEvent = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvent.totalRewardPercent.toString()), "100", "Block reward percentage should be 100%")

            blockGasLimit = 14991125;
            txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, 0);
            blockRewardEvent = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvent.totalRewardPercent.toString()), "100", "Block reward percentage should be 100%")

            blockGasLimit = 14999000;
            txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, 0);
            blockRewardEvent = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvent.totalRewardPercent.toString()), "100", "Block reward percentage should be 100%")
        });
        it("should give 0% reward if direction is UP but block gas limit is same as previous vote or in the wrong direction", async () => {
            let tallyVoteGasLimit = 15000000;           
            let desiredEgl = 15100000;   

            let blockGasLimit = 14999999;
            let txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, tallyVoteGasLimit);
            let blockRewardEvent = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvent.totalRewardPercent.toString()), "0", "Block reward percentage should be 0%")

            blockGasLimit = 15000000;
            txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, tallyVoteGasLimit);
            blockRewardEvent = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvent.totalRewardPercent.toString()), "0", "Block reward percentage should be 0%")
        });
        it("should give 0% reward if direction is DOWN but block gas limit is same as previous vote or in the wrong direction", async () => {
            let tallyVoteGasLimit = 12000000;           
            let desiredEgl = 11900000;   

            let blockGasLimit = 12000001;
            let txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, tallyVoteGasLimit);
            let blockRewardEvent = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvent.totalRewardPercent.toString()), "0", "Block reward percentage should be 0%")

            blockGasLimit = 12000000;
            txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, tallyVoteGasLimit);
            blockRewardEvent = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvent.totalRewardPercent.toString()), "0", "Block reward percentage should be 0%")
        });
        it("should calculate the correct proximity percentage reward in block gas limit in the correct direction", async () => {
            // See PROXIMITY BLOCK REWARD in 'files/calculations.txt' for formulas to calculate expected values
            let tallyVoteGasLimit = 15000000;           
            let desiredEgl = 15100000;   

            let blockGasLimit = 15050000;
            let txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, tallyVoteGasLimit);
            let blockRewardEvent = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvent.proximityRewardPercent.toString()), "37.5", "Incorrect proximity % calculated")

            blockGasLimit = 15089999;
            txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, tallyVoteGasLimit);
            blockRewardEvent = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvent.proximityRewardPercent.toString()), "67.49925", "Incorrect proximity % calculated")

            blockGasLimit = 15000001;
            txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, tallyVoteGasLimit);
            blockRewardEvent = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvent.proximityRewardPercent.toString()), "0.00075", "Incorrect proximity % calculated")
        });
        it("should add an additional 25% reward to the proximity award if block gas limit in the correct direction", async () => {
            // See TOTAL BLOCK REWARD in 'files/calculations.txt' for formulas to calculate expected values
            let tallyVoteGasLimit = 15000000;           
            let desiredEgl = 15100000;   

            let blockGasLimit = 15050000;
            let txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, tallyVoteGasLimit);
            let blockRewardEvent = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvent.totalRewardPercent.toString()), "62.5", "Incorrect total % calculated")

            blockGasLimit = 15089999;
            txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, tallyVoteGasLimit);
            blockRewardEvent = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvent.totalRewardPercent.toString()), "92.49925", "Incorrect total % calculated")

            blockGasLimit = 15000001;
            txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, tallyVoteGasLimit);
            blockRewardEvent = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            assert.equal(web3.utils.fromWei(blockRewardEvent.totalRewardPercent.toString()), "25.00075", "Incorrect total % calculated")
        });
        it("should calculate the correct reward amount based on a 62.5% reward percentage", async () => {
            // See BLOCK REWARD in 'files/calculations.txt' for formulas to calculate expected values
            let tallyVoteGasLimit = 15000000;           
            let desiredEgl = 15100000;   
            let blockGasLimit = 15050000;
            
            let txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, tallyVoteGasLimit);
            let blockRewardEvent = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            
            assert.equal(web3.utils.fromWei(blockRewardEvent.totalRewardPercent.toString()), "62.5", "Incorrect total reward %")
            assert.approximately(
                parseFloat(web3.utils.fromWei(blockRewardEvent.blockReward.toString())), 
                312.5, 
                0.001, 
                "Incorrect total % calculated"
            );
        });
        it("should calculate the correct reward amount based on a 92.499% reward percentage", async () => {
            // See BLOCK REWARD in 'files/calculations.txt' for formulas to calculate expected values
            let tallyVoteGasLimit = 15000000;           
            let desiredEgl = 15100000;   
            let blockGasLimit = 15089999;

            let txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, tallyVoteGasLimit);
            let blockRewardEvent = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);
            
            assert.equal(web3.utils.fromWei(blockRewardEvent.totalRewardPercent.toString()), "92.49925", "Incorrect total reward %")
            assert.approximately(
                parseFloat(web3.utils.fromWei(blockRewardEvent.blockReward.toString())), 
                462.496, 
                0.001, 
                "Incorrect total % calculated"
            );                
        });
        it("should calculate the correct reward amount based on a 25.0006% reward percentage", async () => {
            // See BLOCK REWARD in 'files/calculations.txt' for formulas to calculate expected values
            let tallyVoteGasLimit = 15000000;           
            let desiredEgl = 15100000;   
            let blockGasLimit = 15000001;

            let txReceipt = await eglContractInstance.calculateBlockReward(blockGasLimit, desiredEgl, tallyVoteGasLimit);
            let blockRewardEvent = populateEventDataFromLogs(txReceipt, EventType.BLOCK_REWARD_CALCULATED);

            assert.equal(web3.utils.fromWei(blockRewardEvent.totalRewardPercent.toString()), "25.00075", "Incorrect total reward %")
            assert.approximately(
                parseFloat(web3.utils.fromWei(blockRewardEvent.blockReward.toString())), 
                125.004, 
                0.001, 
                "Incorrect total % calculated"
            );                
        });
    });
    describe("Calculate Serialized EGL", function () {
        it("should calculate serialized EGL after 1 hour passed lockup end date", async () => {                        
            // See RELEASE EGL in 'files/calculations.txt' for formulas to calculate expected values
            let timeSinceOrigin = 6051600            
            let txReceipt = await eglContractInstance.calculateSerializedEgl(
                timeSinceOrigin, 
                web3.utils.toWei("750000000"),
                DefaultEpochLengthSeconds * 10
            )
            let event = populateAllEventDataFromLogs(txReceipt, EventType.SERIALIZED_EGL_CALCULATED);

            assert.approximately(
                parseFloat(web3.utils.fromWei(event[0].serializedEgl.toString())),
                0.000000302570773,                
                1/10**12,
                "Incorrect current EGL calculated"
            );
        });
        it("should calculate current EGL after 100 days passed", async () => {
            // See RELEASE EGL in 'files/calculations.txt' for formulas to calculate expected values
            let timeSinceOrigin = 8640000
            let txReceipt = await eglContractInstance.calculateSerializedEgl(
                timeSinceOrigin,
                web3.utils.toWei("750000000"),
                DefaultEpochLengthSeconds * 10
            )
            let event = populateAllEventDataFromLogs(txReceipt, EventType.SERIALIZED_EGL_CALCULATED);
            assert.approximately(
                parseFloat(web3.utils.fromWei(event[0].serializedEgl.toString())),
                81312.4338550455,                 
                0.001,
                "Incorrect current EGL calculated"
            );
        });
        it("should calculate current EGL after 200 days passed", async () => {
            // See RELEASE EGL in 'files/calculations.txt' for formulas to calculate expected values  
            let timeSinceOrigin = 17280000
            let txReceipt = await eglContractInstance.calculateSerializedEgl(
                timeSinceOrigin,
                web3.utils.toWei("750000000"),
                DefaultEpochLengthSeconds * 10
            )
            let event = populateAllEventDataFromLogs(txReceipt, EventType.SERIALIZED_EGL_CALCULATED);

            assert.approximately(
                parseFloat(web3.utils.fromWei(event[0].serializedEgl.toString())),
                28671165.720172267, 
                0.1,
                "Incorrect current EGL calculated"
            );
        });
        it("should calculate current EGL after 364 days passed", async () => {
            // See RELEASE EGL in 'files/calculations.txt' for formulas to calculate expected values              
            let timeSinceOrigin = 31449600
            let txReceipt = await eglContractInstance.calculateSerializedEgl(
                timeSinceOrigin,
                web3.utils.toWei("750000000"),
                DefaultEpochLengthSeconds * 10
            )
            let event = populateAllEventDataFromLogs(txReceipt, EventType.SERIALIZED_EGL_CALCULATED);

            assert.equal(web3.utils.fromWei(event[0].serializedEgl.toString()), "750000000", "Incorrect current EGL calculated");
        });
        it("should calculate current EGL after 1 second before 52 epochs passed", async () => {
            // See RELEASE EGL in 'files/calculations.txt' for formulas to calculate expected values
            let timeSinceOrigin = 31449599
            let txReceipt = await eglContractInstance.calculateSerializedEgl(
                timeSinceOrigin,
                web3.utils.toWei("750000000"),
                DefaultEpochLengthSeconds * 10
            )
            let event = populateAllEventDataFromLogs(txReceipt, EventType.SERIALIZED_EGL_CALCULATED);

            assert.approximately(
                parseFloat(web3.utils.fromWei(event[0].serializedEgl.toString())),
                749999881.8972102, 
                0.1,
                "Incorrect current EGL calculated"
            );
        });
        it("should always return launch EGL amount after the first year", async () => {     
            let maxRewardEpochs = DefaultEpochLengthSeconds * 52
            let valuesOver52Epochs = [ maxRewardEpochs + 5, maxRewardEpochs + 2500, maxRewardEpochs + 12743]       
            for (let i = 0; i < valuesOver52Epochs.length; i++) {
                let txReceipt = await eglContractInstance.calculateSerializedEgl(
                    valuesOver52Epochs[i],
                    web3.utils.toWei("750000000"),
                    DefaultEpochLengthSeconds * 10
                )                
                let event = populateAllEventDataFromLogs(txReceipt, EventType.SERIALIZED_EGL_CALCULATED);
                assert.equal(web3.utils.fromWei(event[0].serializedEgl.toString()), "750000000", "Incorrect current EGL calculated");
            }
        });
        it("should revert if time passed still within lockup period", async () => {
            let beforeLockupEnds = initEvent.minLiquidityTokensLockup - 10;
            await expectRevert(
                eglContractInstance.calculateSerializedEgl(
                    beforeLockupEnds,
                    web3.utils.toWei("750000000"),
                    DefaultEpochLengthSeconds * 10
                ),
                "SafeMath: subtraction overflow"
            )
        });
    });
    describe("Calculate Current Pool Tokens Due", function () {
        it("should return 0 pool tokens due if first EGL is after current EGL", async () => {
            // See POOL TOKENS DUE in 'files/calculations.txt' for formulas to calculate expected values
            let currentEgl = 100;
            let supporterFirstEgl = 110;
            let supporterLastEgl = 200;
            let totalSupporterPoolTokens = 1000;
            let txReceipt = await eglContractInstance.calculateCurrentPoolTokensDue(
                currentEgl,
                supporterFirstEgl,
                supporterLastEgl,
                totalSupporterPoolTokens
            )
            
            let event = populateAllEventDataFromLogs(txReceipt, "PoolTokensDueCalculated");
            assert.equal(event[0].poolTokensDue, "0", "Incorrect pool tokens due calculated")    
        });
        it("should return correct pool tokens due for pool tokens between 0 and 100 when current serialized EGL is 20", async () => {
            // See POOL TOKENS DUE in 'files/calculations.txt' for formulas to calculate expected values
            let currentEgl = 20;
            let supporterFirstEgl = 0;
            let supporterLastEgl = 100;
            let totalSupporterPoolTokens = 100;
            let txReceipt = await eglContractInstance.calculateCurrentPoolTokensDue(
                currentEgl,
                supporterFirstEgl,
                supporterLastEgl,
                totalSupporterPoolTokens
            )
            
            let event = populateAllEventDataFromLogs(txReceipt, "PoolTokensDueCalculated");
            assert.equal(event[0].poolTokensDue, "20", "Incorrect pool tokens due calculated")    
        });
        it("should return correct pool tokens due for pool tokens between 103,384,112 and 423,884,914 when current serialized EGL is 285,689,000", async () => {
            // See POOL TOKENS DUE in 'files/calculations.txt' for formulas to calculate expected values
            let currentEgl = 285689000;
            let supporterFirstEgl = 103384112;
            let supporterLastEgl = 423884914;
            let totalSupporterPoolTokens = 320500802;
            let txReceipt = await eglContractInstance.calculateCurrentPoolTokensDue(
                currentEgl,
                supporterFirstEgl,
                supporterLastEgl,
                totalSupporterPoolTokens
            )
            
            let event = populateAllEventDataFromLogs(txReceipt, "PoolTokensDueCalculated");
            assert.equal(event[0].poolTokensDue, "182304888", "Incorrect pool tokens due calculated")    
        });
        it("should return all pool tokens when the currently serialized EGL is the supporters last pool token", async () => {
            // See POOL TOKENS DUE in 'files/calculations.txt' for formulas to calculate expected values
            let currentEgl = 812114;
            let supporterFirstEgl = 94024;
            let supporterLastEgl = 812114;
            let totalSupporterPoolTokens = 718090;
            let txReceipt = await eglContractInstance.calculateCurrentPoolTokensDue(
                currentEgl,
                supporterFirstEgl,
                supporterLastEgl,
                totalSupporterPoolTokens
            )
            
            let event = populateAllEventDataFromLogs(txReceipt, "PoolTokensDueCalculated");
            assert.equal(event[0].poolTokensDue, "718090", "Incorrect pool tokens due calculated")    
        });
        it("should return all pool tokens when the currently serialized EGL is after the supporters last pool token", async () => {
            // See POOL TOKENS DUE in 'files/calculations.txt' for formulas to calculate expected values
            let currentEgl = 20123334;
            let supporterFirstEgl = 10000;
            let supporterLastEgl = 500000;
            let totalSupporterPoolTokens = 490000;
            let txReceipt = await eglContractInstance.calculateCurrentPoolTokensDue(
                currentEgl,
                supporterFirstEgl,
                supporterLastEgl,
                totalSupporterPoolTokens
            )
            
            let event = populateAllEventDataFromLogs(txReceipt, "PoolTokensDueCalculated");
            assert.equal(event[0].poolTokensDue, "490000", "Incorrect pool tokens due calculated")    
        });
        it("should revert if last EGL is less than first EGL", async () => {
            let currentEgl = 50;
            let supporterFirstEgl = 100;
            let supporterLastEgl = 80;
            let totalSupporterPoolTokens = 20;
            await expectRevert(
                eglContractInstance.calculateCurrentPoolTokensDue(
                    currentEgl,
                    supporterFirstEgl,
                    supporterLastEgl,
                    totalSupporterPoolTokens
                ),
                "EGL:INVALID_SERIALIZED_EGLS"
            )
        });
    });
    describe("Calculate Bonus EGLs Due", function () {
        it("should return correct bonus EGL amount if first serialized EGL is 0 and last serialized EGL is 100", async () => {
            // See BONUS EGLS DUE in 'files/calculations.txt' for formulas to calculate expected values
            let supporterFirstEgl = web3.utils.toWei("0");
            let supporterLastEgl = web3.utils.toWei("175");
            let txReceipt = await eglContractInstance.calculateBonusEglsDue(
                supporterFirstEgl,
                supporterLastEgl
            )

            let events = populateAllEventDataFromLogs(txReceipt, "BonusEglsDueCalculated");
            assert.equal(web3.utils.fromWei(events[0].bonusEglsDue.toString()), "0.000000000000000001", "Incorrect bonus EGLs calculated")
        });
        it("should return correct bonus EGL amount if first serialized EGL is 103,384,112 and last serialized EGL is 423,884,914", async () => {
            // See BONUS EGLS DUE in 'files/calculations.txt' for formulas to calculate expected values
            let supporterFirstEgl = web3.utils.toWei("103384112");
            let supporterLastEgl = web3.utils.toWei("423884914");

            let txReceipt = await eglContractInstance.calculateBonusEglsDue(
                supporterFirstEgl,
                supporterLastEgl
            )
            let events = populateAllEventDataFromLogs(txReceipt, "BonusEglsDueCalculated");
            assert.equal(
                parseFloat(web3.utils.fromWei(events[0].bonusEglsDue.toString())).toFixed(8), 
                "50836694.14449182", 
                "Incorrect bonus EGLs calculated"
            )
        });
        it("should return correct bonus EGL amount if first serialized EGL is 94,024 and last serialized EGL is 812,114", async () => {
            // See BONUS EGLS DUE in 'files/calculations.txt' for formulas to calculate expected values
            let supporterFirstEgl = web3.utils.toWei("94024");
            let supporterLastEgl = web3.utils.toWei("812114");

            let txReceipt = await eglContractInstance.calculateBonusEglsDue(
                supporterFirstEgl,
                supporterLastEgl
            )

            let events = populateAllEventDataFromLogs(txReceipt, "BonusEglsDueCalculated");
            assert.equal(
                parseFloat(web3.utils.fromWei(events[0].bonusEglsDue.toString())).toFixed(13),  
                "0.0006872502419", 
                "Incorrect bonus EGLs calculated"
            )
        });
        it("should revert if last EGL is less than first EGL", async () => {
            let supporterFirstEgl = web3.utils.toWei("100");
            let supporterLastEgl = web3.utils.toWei("80");
            await expectRevert(
                eglContractInstance.calculateBonusEglsDue(
                    supporterFirstEgl,
                    supporterLastEgl
                ),
                "EGL:INVALID_SERIALIZED_EGLS"
            )
        });
    });
    describe("Calculate Voter Reward", function () {
        it("should award voter with their share of rewards, based on the weighted vote, for the 1 epochs that have passed since their vote", async () => {
            // See VOTER REWARD in 'files/calculations.txt' for formulas to calculate expected values
            await castVotes(
                [7000000, "5000", 8, _voter1],
                [7000000, "9000", 8, _voter2],
            );

            let currentEpoch = 2;
            let voterEpoch = 1;
            let lockupDuration = 8;
            let voteWeight = web3.utils.toWei("40000"); // 5000 * 8

            let txReceipt = await eglContractInstance.calculateVoterReward(
                _voter1,
                currentEpoch,
                voterEpoch,
                lockupDuration,
                voteWeight
            )

            let events = populateAllEventDataFromLogs(txReceipt, "VoterRewardCalculated");
            assert.equal(
                parseFloat(web3.utils.fromWei(events[0].voterReward.toString())).toFixed(9),  
                "6608957.035714285", 
                "Incorrect voter reward calculated"
            )
        });
        it("should award voter with their share of rewards, based on the weighted vote, for the 8 epochs that have passed since their vote", async () => {
            // See VOTER REWARD in 'files/calculations.txt' for formulas to calculate expected values
            await castVotes(
                [7000000, "5000", 8, _voter1],
                [7000000, "9000", 8, _voter2],
            );

            let currentEpoch = 9;
            let voterEpoch = 0;
            let lockupDuration = 8;
            let voteWeight = web3.utils.toWei("40000"); // 5000 * 8

            let txReceipt = await eglContractInstance.calculateVoterReward(
                _voter1,
                currentEpoch,
                voterEpoch,
                lockupDuration,
                voteWeight
            )

            let events = populateAllEventDataFromLogs(txReceipt, "VoterRewardCalculated");
            assert.equal(
                parseFloat(web3.utils.fromWei(events[7].voterReward.toString())).toFixed(9),  
                "50279908.428571425", 
                "Incorrect voter reward calculated"
            )
        });
        it("should reduce the remaining voter reward balance by 8 epochs worth of rewards claimed by voter1", async () => {
            await castVotes(
                [7000000, "5000", 8, _voter1],
                [7000000, "9000", 8, _voter2],
            );

            let currentEpoch = 9;
            let voterEpoch = 0;
            let lockupDuration = 8;
            let voteWeight = web3.utils.toWei("40000"); // 5000 * 8

            let txReceipt = await eglContractInstance.calculateVoterReward(
                _voter1,
                currentEpoch,
                voterEpoch,
                lockupDuration,
                voteWeight
            )

            let events = populateAllEventDataFromLogs(txReceipt, "VoterRewardCalculated");
            let remainingBalance = 500000000 - 50279908.428571425
            assert.equal(
                parseFloat(web3.utils.fromWei(events[7].remainingVoterRewards.toString())).toFixed(7),  
                remainingBalance.toString(), 
                "Incorrect remaining reward balance"
            )
        });
        it("should calculate rewards for the 6 epochs based on voter epoch and current epoch", async () => {
            await castVotes(
                [7000000, "5000", 8, _voter1],
                [7000000, "9000", 8, _voter2],
            );

            let currentEpoch = 6;
            let voterEpoch = 0;
            let lockupDuration = 8;
            let voteWeight = web3.utils.toWei("40000"); // 5000 * 8

            let txReceipt = await eglContractInstance.calculateVoterReward(
                _voter1,
                currentEpoch,
                voterEpoch,
                lockupDuration,
                voteWeight
            )

            let events = populateAllEventDataFromLogs(txReceipt, "VoterRewardCalculated");
            assert.equal(events.length, 6, "Not all reward epochs were calculated")
        });
        it("should calculate rewards for all the locked up epochs if the current epoch is far in the future", async () => {
            await castVotes(
                [7000000, "5000", 8, _voter1],
                [7000000, "9000", 8, _voter2],
            );

            let currentEpoch = 20;
            let voterEpoch = 0;
            let lockupDuration = 8;
            let voteWeight = web3.utils.toWei("40000"); // 5000 * 8

            let txReceipt = await eglContractInstance.calculateVoterReward(
                _voter1,
                currentEpoch,
                voterEpoch,
                lockupDuration,
                voteWeight
            )

            let events = populateAllEventDataFromLogs(txReceipt, "VoterRewardCalculated");
            assert.equal(events.length, 8, "Not all reward epochs were calculated")
            let remainingBalance = 500000000 - 50279908.428571425
            assert.equal(
                parseFloat(web3.utils.fromWei(events[7].remainingVoterRewards.toString())).toFixed(7),  
                remainingBalance.toString(), 
                "Incorrect remaining reward balance"
            )            
            assert.equal(
                parseFloat(web3.utils.fromWei(events[7].voterReward.toString())).toFixed(9),  
                "50279908.428571425", 
                "Incorrect voter reward calculated"
            )
            assert.equal(
                parseFloat(web3.utils.fromWei(events[7].epochVoterReward.toString())).toFixed(9),  
                "5831432.678571428", 
                "Incorrect voter epoch reward calculated"
            )
        });
        it("should calculate epoch rewards based on multiple voters with different lockup durations", async () => {
            // See VOTER REWARD in 'files/calculations.txt' for formulas to calculate expected values
            await castVotes(
                [7000000, "5000", 8, _voter1],
                [7000000, "9000", 3, _voter2],
            );

            let currentEpoch = 20;
            let voterEpoch = 0;
            let lockupDuration = 8;
            let voteWeight = web3.utils.toWei("40000"); // 5000 * 8

            let txReceipt = await eglContractInstance.calculateVoterReward(
                _voter1,
                currentEpoch,
                voterEpoch,
                lockupDuration,
                voteWeight
            )

            let events = populateAllEventDataFromLogs(txReceipt, "VoterRewardCalculated");
            assert.equal(events.length, 8, "Not all reward epochs were calculated")
            let remainingBalance = 500000000 - 118411930.8283582
            assert.equal(
                parseFloat(web3.utils.fromWei(events[7].remainingVoterRewards.toString())).toFixed(7),  
                remainingBalance.toString(), 
                "Incorrect remaining reward balance"
            )            
            assert.equal(
                parseFloat(web3.utils.fromWei(events[7].voterReward.toString())).toFixed(7),  
                "118411930.8283582", 
                "Incorrect voter reward calculated"
            )
            assert.equal(
                parseFloat(web3.utils.fromWei(events[5].epochVoterReward.toString())).toFixed(1),  
                "17053700.9", 
                "Incorrect voter epoch reward calculated"
            )
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
});