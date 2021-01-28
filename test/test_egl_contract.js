const { expectRevert } = require("@openzeppelin/test-helpers");
const BN = require("bn.js");

const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");

contract("EglTests", (accounts) => {
    const [_deployer, _voter1, _voter2, _voter3, _voter4NoAllowance, _creator, _seed1, _seed2] = accounts;
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
    const EventType = {
        VOTE: "Vote",
        REVOTE: "ReVote",
        WITHDRAW: "Withdraw",
        VOTES_TALLIED: "VotesTallied",
        CREATOR_REWARDS_CLAIMED: "CreatorRewardsClaimed",
        VOTE_THRESHOLD_MET: "VoteThresholdMet",
        VOTE_THRESHOLD_FAILED: "VoteThresholdFailed",
    };

    const EPOCH_LENGTH_S = 3;
    const VOTE_PAUSE_S = 0;
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const SEED_ACCOUNTS = [_seed1, _seed2];
    const CREATOR_REWARDS_ACCOUNT = _creator;
    const WEEKLY_CREATOR_REWARD = new BN(web3.utils.toWei("500000000")).div(new BN("43"));

    let eglTokenInstance;
    let eglContractInstance;
    let eglContractStartDate;
    let eglContractDeployBlockNumber;
    let eglContractDeployGasLimit;

    /***************************************************************/
    /**** Assumes default block gas limit in ganache of 6721975 ****/
    /***************************************************************/
    let validGasTarget = 7000000;
    let invalidGasTargetHigh = 13000000;
    let invalidGasTargetLow = 1000000;

    async function castSimpleVotes(...voteValues) {
        return await Promise.all(
            voteValues.map(async (voteValues) => {
                return await eglContractInstance.vote(
                    voteValues[0],
                    web3.utils.toWei(voteValues[1]),
                    voteValues[2],
                    ZERO_ADDRESS,
                    0,
                    ZERO_ADDRESS,
                    { from: voteValues[3] }
                );
            })
        );
    }

    async function sleep(seconds) {
        return new Promise((resolve) => {
            setTimeout(resolve, seconds * 1000);
        });
    }

    function populateEventDataFromLogs(txReceipt) {
        let contractEvents = {};
        txReceipt.logs.map((event) => {
            contractEvents[event.event] = event.args;
        });
        return contractEvents;
    }

    async function getBlockTimestamp(txReceipt) {
        let timestamp = (await web3.eth.getBlock(txReceipt.receipt.blockNumber))
            .timestamp;
        console.log("Block timestamp: ", timestamp);
        return timestamp;
    }

    beforeEach(async () => {
        const TOTAL_SUPPLY = web3.utils.toWei("4000000000");
        eglTokenInstance = await EglToken.new();
        await eglTokenInstance.initialize("EthereumGasLimit", "EGL", TOTAL_SUPPLY);

        eglContractInstance = await EglContract.new();

        let txReceipt = await eglContractInstance.initialize(
            eglTokenInstance.address,
            "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
            Math.round(new Date().getTime() / 1000),
            VOTE_PAUSE_S,
            EPOCH_LENGTH_S,
            SEED_ACCOUNTS,
            CREATOR_REWARDS_ACCOUNT
        );
        eglContractDeployBlockNumber = txReceipt.receipt.blockNumber;
        eglContractDeployGasLimit = (await web3.eth.getBlock(eglContractDeployBlockNumber)).gasLimit

        eglContractStartDate = (await eglContractInstance.currentEpochStartDate()).toString();
        // eglTokenInstance.transfer(_voter1, web3.utils.toWei("1000"), {from: _deployer})
        // eglTokenInstance.transfer(_voter2, web3.utils.toWei("1000"), {from: _deployer})
        // eglTokenInstance.transfer(_voter3, web3.utils.toWei("1000"), {from: _deployer})
        // eglTokenInstance.transfer(_voter4NoAllowance, web3.utils.toWei("1000"), {from: _deployer})
        //
        // let remainingTokens = web3.utils.fromWei(TOTAL_SUPPLY) -  4000;
        eglTokenInstance.transfer(eglContractInstance.address, TOTAL_SUPPLY, { from: _deployer });
        eglContractInstance.giveTokens(_voter1, {from: _voter1});
        // eglTokenInstance.increaseAllowance(eglContractInstance.address, web3.utils.toWei("50000000"), {from: _voter1});
        //
        // eglTokenInstance.increaseAllowance(eglContractInstance.address, web3.utils.toWei("1000"), {from: _voter1})
        // eglTokenInstance.increaseAllowance(eglContractInstance.address, web3.utils.toWei("1000"), {from: _voter2})
        // eglTokenInstance.increaseAllowance(eglContractInstance.address, web3.utils.toWei("1000"), {from: _voter3})
    });

    describe.skip("Debug", function () {
        it("", async () => {
            console.log(
                "Egl Contract address: ",
                web3.utils.fromWei(
                    (
                        await eglTokenInstance.balanceOf(eglContractInstance.address)
                    ).toString()
                )
            );
            for (let i = 0; i < 9; i++) {
                await sleep(4);
                console.log("Epoch Ended, tallying votes: ", i);
                await eglContractInstance.tallyVotes();
            }

            await sleep(1);
            console.log(
                "Current Epoch: ",
                (await eglContractInstance.currentEpoch()).toString()
            );
            let [txReceipt] = await castSimpleVotes([
                VoteDirection.DOWN,
                "10",
                2,
                _voter1,
            ]);
        });
    });

    describe.skip("Token", function () {
        it("Max supply of 4,000,000,000 tokens", async () => {
            let supplyLimit = await eglTokenInstance.totalSupply();
            assert.equal(
                supplyLimit.toString(),
                web3.utils.toWei("4000000000"),
                "Incorrect total token supply limit"
            );
        });
    });

    describe.skip("Initial Totals", function () {
        it("Seed accounts should have tokens locked in voting", async () => {
            let voter1 = await eglContractInstance.voters(_voter1);
            let voter2 = await eglContractInstance.voters(_voter2);
            let voter3 = await eglContractInstance.voters(_voter3);
            let voter4 = await eglContractInstance.voters(_voter4NoAllowance);
            let creator = await eglContractInstance.voters(_creator);
            let uninitializedAccounts = [voter1, voter2, voter3, voter4, creator];

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
                assert.equal(
                    uninitializedAccount[VoterAttributes.DAO_RECIPIENT],
                    ZERO_ADDRESS,
                    "Uninitialized account should not have an initial DAO recipient address"
                );
                assert.equal(
                    uninitializedAccount[VoterAttributes.DAO_AMOUNT],
                    "0",
                    "Uninitialized account should not have an initial DAO amount"
                );
                assert.equal(
                    uninitializedAccount[VoterAttributes.UPGRADE_ADDRESS],
                    ZERO_ADDRESS,
                    "Uninitialized account should not have an initial upgrade address"
                );
            });

            let seed1 = await eglContractInstance.voters(_seed1);
            let seed2 = await eglContractInstance.voters(_seed2);
            let seeders = [seed1, seed2];
            let seedAccountReleaseDate = parseInt(eglContractStartDate) + 31536000;

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
                    seedAccountReleaseDate,
                    "Incorrect seed account release date"
                );
                assert.equal(
                    seedAccount[VoterAttributes.TOKENS_LOCKED],
                    web3.utils.toWei("12500000"),
                    "Incorrect seed account tokens locked"
                );
                assert.equal(
                    seedAccount[VoterAttributes.GAS_TARGET],
                    eglContractDeployGasLimit,
                    "Incorrect seed account gas target"
                );
                assert.equal(
                    seedAccount[VoterAttributes.DAO_RECIPIENT],
                    ZERO_ADDRESS,
                    "Incorrect seed account DAO recipient address"
                );
                assert.equal(
                    seedAccount[VoterAttributes.DAO_AMOUNT],
                    "0",
                    "Incorrect seed account DAO amount"
                );
                assert.equal(
                    seedAccount[VoterAttributes.UPGRADE_ADDRESS],
                    ZERO_ADDRESS,
                    "Incorrect seed account upgrade address"
                );
            });
            assert.equal(
                await eglTokenInstance.balanceOf(_seed1),
                "0",
                "Seed account tokens should still be locked"
            );
            assert.equal(
                await eglTokenInstance.balanceOf(_seed2),
                "0",
                "Seed account tokens should still be locked"
            );

            for (let i = 0; i < 8; i++) {
                // Vote weight total for epoch
                assert.equal(
                    (await eglContractInstance.voteWeightsSum(i)).toString(),
                    web3.utils.toWei("200000000"),
                    "Incorrect initial vote weight sum - week " + i
                );

                // TODO: Test gasTargetSum
                // Gas target total for epoch
                // gasTargetSum = gasTarget *
                // assert.equal(
                //     (await eglContractInstance.gasTargetSum(i)).toString(),
                //     web3.utils.toWei("200000000"),
                //     "Incorrect initial vote weight sum - week " + i
                // );

                // Votes total for epoch
                assert.equal(
                    (await eglContractInstance.votesTotal(i)).toString(),
                    web3.utils.toWei("25000000"),
                    "Incorrect initial votes total - week " + i
                );

                // Voter reward total for epoch
                assert.equal(
                    (await eglContractInstance.voterRewardSums(i)).toString(),
                    web3.utils.toWei("200000000"),
                    "Incorrect initial voter reward sum - week " + i
                );
            }

            assert.equal(
                (await eglContractInstance.voterRewardSums(8)).toString(),
                "0",
                "Initial vote reward sums should be '0' - week 9"
            );
        });
    });

    describe.skip("Vote", function () {
        it("account with tokens can vote", async () => {
            const VOTE_AMOUNT = web3.utils.toWei("10");
            const VOTE_LOCKUP_DURATION = 2;
            let initialContractEglBalance = new BN(
                await eglTokenInstance.balanceOf(eglContractInstance.address)
            );
            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                web3.utils.toWei("50000000"),
                {from: _voter1}
            );

            let txReceipt = await eglContractInstance.vote(
                validGasTarget,
                VOTE_AMOUNT,
                VOTE_LOCKUP_DURATION,
                ZERO_ADDRESS,
                0,
                ZERO_ADDRESS,
                {from: _voter1}
            );

            let voter = await eglContractInstance.voters(_voter1);
            let voteCallBlockTimestamp = (
                await web3.eth.getBlock(txReceipt.receipt.blockNumber)
            ).timestamp;
            let expectedReleaseDate =
                voteCallBlockTimestamp + VOTE_LOCKUP_DURATION * EPOCH_LENGTH_S;

            assert.equal(
                voter[VoterAttributes.LOCKUP_DURATION],
                VOTE_LOCKUP_DURATION.toString(),
                "Incorrect lockup duration after vote()"
            );
            assert.equal(
                voter[VoterAttributes.VOTE_EPOCH],
                "0",
                "Incorrect starting epoch after vote()"
            );
            assert.equal(
                voter[VoterAttributes.RELEASE_DATE],
                expectedReleaseDate,
                "Incorrect release date after vote()"
            );
            assert.equal(
                voter[VoterAttributes.TOKENS_LOCKED],
                VOTE_AMOUNT,
                "Incorrect tokens locked for voter"
            );
            assert.equal(
                voter[VoterAttributes.GAS_TARGET],
                validGasTarget,
                "Incorrect vote direction after vote()"
            );
            assert.equal(
                voter[VoterAttributes.DAO_RECIPIENT],
                ZERO_ADDRESS,
                "Incorrect DAO recipient address after vote()"
            );
            assert.equal(
                voter[VoterAttributes.DAO_AMOUNT],
                "0",
                "Incorrect DAO amount after vote()"
            );
            assert.equal(
                voter[VoterAttributes.UPGRADE_ADDRESS],
                ZERO_ADDRESS,
                "Incorrect upgrade address after vote()"
            );

            //Token transfer
            assert.equal(
                (
                    await eglTokenInstance.balanceOf(eglContractInstance.address)
                ).toString(),
                initialContractEglBalance.add(new BN(VOTE_AMOUNT)).toString(),
                "Incorrect EglContract token balance after vote()"
            );

            // Totals
            for (let i = 0; i < 2; i++) {
                // Vote weight total for epoch
                assert.equal(
                    (await eglContractInstance.voteWeightsSum(i)).toString(),
                    web3.utils.toWei("200000020"),
                    "Incorrect vote weight sum after vote - week " + i
                );

                // TODO: Test gasTargetSum

                // Votes total
                assert.equal(
                    (await eglContractInstance.votesTotal(i)).toString(),
                    web3.utils.toWei("25000010"),
                    "Incorrect votes total after vote() - week " + i
                );

                // Voter reward sums
                assert.equal(
                    (await eglContractInstance.voterRewardSums(i)).toString(),
                    web3.utils.toWei("200000020"),
                    "Incorrect voter reward sums after vote() - week " + i
                );
            }

            for (let i = 2; i < 8; i++) {
                // Vote weight total for epoch
                assert.equal(
                    (await eglContractInstance.voteWeightsSum(i)).toString(),
                    web3.utils.toWei("200000000"),
                    "Incorrect vote weight sum after vote - week " + i
                );

                // TODO: Test gasTargetSum

                // Votes total
                assert.equal(
                    (await eglContractInstance.votesTotal(i)).toString(),
                    web3.utils.toWei("25000000"),
                    "Incorrect votes total after vote() - week " + i
                );

                // Voter reward sums
                assert.equal(
                    (await eglContractInstance.voterRewardSums(i)).toString(),
                    web3.utils.toWei("200000000"),
                    "Incorrect voter reward sums after vote() - week " + i
                );
            }
        });
        it("should not be able to vote if a vote already exists for user", async () => {
            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                web3.utils.toWei("50000000"),
                {from: _voter1}
            );
            await eglContractInstance.vote(
                validGasTarget,
                web3.utils.toWei("1"),
                1,
                ZERO_ADDRESS,
                0,
                ZERO_ADDRESS,
                {from: _voter1}
            );
            await expectRevert(
                eglContractInstance.vote(
                    7000000,
                    web3.utils.toWei("1"),
                    1,
                    ZERO_ADDRESS,
                    0,
                    ZERO_ADDRESS,
                    {from: _voter1}
                ),
                "EGL: Address has already voted"
            );
        });
        it("should fail all vote validations", async () => {
            await expectRevert(
                eglContractInstance.vote(
                    validGasTarget,
                    web3.utils.toWei("1"),
                    1,
                    ZERO_ADDRESS,
                    0,
                    ZERO_ADDRESS,
                    {from: _voter1}
                ),
                "EGL: EGL contract has insufficient token allowance"
            );

            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                web3.utils.toWei("50000000"),
                {from: _voter1}
            );
            await expectRevert(
                eglContractInstance.vote(
                    invalidGasTargetHigh,
                    web3.utils.toWei("1"),
                    1,
                    ZERO_ADDRESS,
                    0,
                    ZERO_ADDRESS,
                    {from: _voter1}
                ),
                "EGL: GasTarget must be within 4M gas of current gas limit"
            );

            await expectRevert(
                eglContractInstance.vote(
                    invalidGasTargetLow,
                    web3.utils.toWei("1"),
                    1,
                    ZERO_ADDRESS,
                    0,
                    ZERO_ADDRESS,
                    {from: _voter1}
                ),
                "EGL: GasTarget must be within 4M gas of current gas limit"
            );

            await expectRevert(
                eglContractInstance.vote(
                    validGasTarget,
                    web3.utils.toWei("1"),
                    10,
                    ZERO_ADDRESS,
                    0,
                    ZERO_ADDRESS,
                    {from: _voter1}
                ),
                "EGL: Invalid lockup duration. Should be between 1 and 8"
            );

            await expectRevert(
                eglContractInstance.vote(
                    validGasTarget,
                    web3.utils.toWei("1"),
                    1,
                    ZERO_ADDRESS,
                    0,
                    ZERO_ADDRESS,
                    {from: accounts[9]}
                ),
                "EGL: Address has an insufficient EGL balance"
            );
        });
    });

    describe.skip("ReVote", function () {
        it("seed account can re-vote but release date doesn't change", async () => {
            let initialContractEglBalance = new BN(
                await eglTokenInstance.balanceOf(eglContractInstance.address)
            );

            let seed = await eglContractInstance.voters(_seed1);
            let originalReleaseDate = seed[VoterAttributes.RELEASE_DATE];

            await eglContractInstance.reVote(
                7250000,
                "0",
                4,
                ZERO_ADDRESS,
                0,
                ZERO_ADDRESS,
                {from: _seed1}
            );

            seed = await eglContractInstance.voters(_seed1);
            assert.equal(
                seed[VoterAttributes.RELEASE_DATE],
                originalReleaseDate.toNumber(),
                "Incorrect release date after re-vote()"
            );
            assert.equal(
                seed[VoterAttributes.GAS_TARGET],
                7250000,
                "Incorrect gas target after re-vote()"
            );

            // Check token balances
            assert.equal(
                await eglTokenInstance.balanceOf(_seed1),
                "0",
                "Account tokens should still be locked after re-vote"
            );
            assert.equal(
                new BN(
                    await eglTokenInstance.balanceOf(eglContractInstance.address)
                ).toString(),
                initialContractEglBalance.toString(),
                "Incorrect token balance after seeder re-vote()"
            );
        });
        it("seed account can re-vote to change their gas target amount (same epoch)", async () => {
            const VOTE_LOCKUP_DURATION = 4;
            let initialContractEglBalance = new BN(
                await eglTokenInstance.balanceOf(eglContractInstance.address)
            );

            let seed = await eglContractInstance.voters(_seed1);
            let originalReleaseDate = seed[VoterAttributes.RELEASE_DATE];

            await eglContractInstance.reVote(
                7250000,
                "0",
                VOTE_LOCKUP_DURATION,
                ZERO_ADDRESS,
                0,
                ZERO_ADDRESS,
                {from: _seed1}
            );

            seed = await eglContractInstance.voters(_seed1);
            assert.equal(
                seed[VoterAttributes.LOCKUP_DURATION],
                VOTE_LOCKUP_DURATION,
                "Incorrect lockup duration after re-vote()"
            );
            assert.equal(
                seed[VoterAttributes.VOTE_EPOCH],
                "0",
                "Incorrect vote epoch after re-vote()"
            );
            assert.equal(
                seed[VoterAttributes.RELEASE_DATE],
                originalReleaseDate.toNumber(),
                "Incorrect release date after re-vote()"
            );
            assert.equal(
                seed[VoterAttributes.TOKENS_LOCKED],
                web3.utils.toWei("12500000"),
                "Incorrect tokens locked after re-vote()"
            );
            assert.equal(
                seed[VoterAttributes.GAS_TARGET],
                7250000,
                "Incorrect vote direction after re-vote()"
            );
            assert.equal(
                seed[VoterAttributes.DAO_RECIPIENT],
                ZERO_ADDRESS,
                "Incorrect DAO recipient address after re-vote()"
            );
            assert.equal(
                seed[VoterAttributes.DAO_AMOUNT],
                "0",
                "Incorrect DAO amount after re-vote()"
            );
            assert.equal(
                seed[VoterAttributes.UPGRADE_ADDRESS],
                ZERO_ADDRESS,
                "Incorrect upgrade address after re-vote()"
            );

            // Token balances
            assert.equal(
                await eglTokenInstance.balanceOf(_seed1),
                "0",
                "Account tokens should still be locked after re-vote"
            );
            assert.equal(
                new BN(
                    await eglTokenInstance.balanceOf(eglContractInstance.address)
                ).toString(),
                initialContractEglBalance.toString(),
                "Incorrect token balance after seeder re-vote()"
            );

            // Totals
            for (let i = 0; i < 4; i++) {
                // Vote weight total for epoch
                assert.equal(
                    (await eglContractInstance.voteWeightsSum(i)).toString(),
                    web3.utils.toWei("150000000"),
                    "Incorrect vote weight sum after re-vote - week " + i
                );

                // TODO: Test gasTargetSum

                // Votes total
                assert.equal(
                    (await eglContractInstance.votesTotal(i)).toString(),
                    web3.utils.toWei("25000000"),
                    "Incorrect votes total after re-vote() - week " + i
                );

                // Voter reward sums
                assert.equal(
                    (await eglContractInstance.voterRewardSums(i)).toString(),
                    web3.utils.toWei("150000000"),
                    "Incorrect voter reward sums after re-vote() - week " + i
                );
            }

            for (let i = 4; i < 8; i++) {
                // Vote weight total for epoch
                assert.equal(
                    (await eglContractInstance.voteWeightsSum(i)).toString(),
                    web3.utils.toWei("100000000"),
                    "Incorrect vote weight sum after re-vote - week " + i
                );

                // Votes total
                assert.equal(
                    (await eglContractInstance.votesTotal(i)).toString(),
                    web3.utils.toWei("12500000"),
                    "Incorrect votes total after vote() - week " + i
                );

                // Voter reward sums
                assert.equal(
                    (await eglContractInstance.voterRewardSums(i)).toString(),
                    web3.utils.toWei("100000000"),
                    "Incorrect voter reward sums after vote() - week " + i
                );
            }
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
                validGasTarget,
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
                voteBlockTimestamp + REVOTE_LOCKUP_DURATION * EPOCH_LENGTH_S
            );

            await eglContractInstance.reVote(
                validGasTarget,
                REVOTE_AMOUNT,
                REVOTE_LOCKUP_DURATION,
                ZERO_ADDRESS,
                0,
                ZERO_ADDRESS,
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
                    web3.utils.toWei("200000280"),
                    "Incorrect vote weight sum after re-vote - week " + i
                );

                // Votes total
                assert.equal(
                    (await eglContractInstance.votesTotal(i)).toString(),
                    web3.utils.toWei("25000070"),
                    "Incorrect votes total after re-vote() - week " + i
                );

                // Voter reward sums
                assert.equal(
                    (await eglContractInstance.voterRewardSums(i)).toString(),
                    web3.utils.toWei("200000280"),
                    "Incorrect voter reward sums after re-vote() - week " + i
                );
            }

            for (let i = 4; i < 8; i++) {
                // Vote weight total for epoch
                assert.equal(
                    (await eglContractInstance.voteWeightsSum(i)).toString(),
                    web3.utils.toWei("200000000"),
                    "Incorrect vote weight sum after re-vote - week " + i
                );

                // Votes total
                assert.equal(
                    (await eglContractInstance.votesTotal(i)).toString(),
                    web3.utils.toWei("25000000"),
                    "Incorrect votes total after vote() - week " + i
                );

                // Voter reward sums
                assert.equal(
                    (await eglContractInstance.voterRewardSums(i)).toString(),
                    web3.utils.toWei("200000000"),
                    "Incorrect voter reward sums after vote() - week " + i
                );
            }
        });
        it("should fail re-vote validations", async () => {
            await expectRevert(
                eglContractInstance.reVote(
                    validGasTarget,
                    web3.utils.toWei("1"),
                    1,
                    ZERO_ADDRESS,
                    0,
                    ZERO_ADDRESS,
                    {from: _voter1}
                ),
                "EGL: Address has not yet voted"
            );

            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                web3.utils.toWei("50000000"),
                {from: _voter1}
            );
            await castSimpleVotes([validGasTarget, "10", 2, _voter1]);

            await expectRevert(
                eglContractInstance.reVote(
                    validGasTarget,
                    web3.utils.toWei("0.1"),
                    1,
                    ZERO_ADDRESS,
                    0,
                    ZERO_ADDRESS,
                    {from: _voter1}
                ),
                "EGL: Amount of EGL's used to vote must be more than 1"
            );

            await expectRevert(
                eglContractInstance.reVote(
                    validGasTarget,
                    web3.utils.toWei("100000000"),
                    1,
                    ZERO_ADDRESS,
                    0,
                    ZERO_ADDRESS,
                    {from: _voter1}
                ),
                "EGL: Address has an insufficient EGL balance"
            );

            eglContractInstance.giveTokens(_voter1, {from: _voter1});
            await expectRevert(
                eglContractInstance.reVote(
                    validGasTarget,
                    web3.utils.toWei("60000000"),
                    1,
                    ZERO_ADDRESS,
                    0,
                    ZERO_ADDRESS,
                    {from: _voter1}
                ),
                "EGL: EGL contract has insufficient token allowance"
            );
        });
    });

    describe.skip("Tally Votes", function () {
        it("should pass voting threshold", async () => {
            let epochStart = await eglContractInstance.currentEpochStartDate();
            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                web3.utils.toWei("50000000"),
                {from: _voter1}
            );

            await castSimpleVotes([validGasTarget, "10", 2, _voter1]);

            // Sleep to end the epoch
            await sleep(EPOCH_LENGTH_S + 1);

            let tallyVotesTxReceipt = await eglContractInstance.tallyVotes({
                from: accounts[9],
            });

            let tallyVoteEvents = {};
            tallyVotesTxReceipt.logs.map((event) => {
                tallyVoteEvents[event.event] = event.args;
            });

            // console.log(tallyVoteEvents[EventType.VOTE_THRESHOLD_MET])
            assert.exists(
                tallyVoteEvents[EventType.VOTE_THRESHOLD_MET],
                "Expected VoteThresholdMet event"
            );
            assert.notExists(
                tallyVoteEvents[EventType.CREATOR_REWARDS_CLAIMED],
                "Unexpect CreatorRewardsClaimed event"
            );

            let gasLimitSum = new BN(
                tallyVoteEvents[EventType.VOTE_THRESHOLD_MET].gasLimitSum
            );
            let voteCount = new BN(
                tallyVoteEvents[EventType.VOTE_THRESHOLD_MET].voteCount
            );
            let expectedEgl = gasLimitSum.div(voteCount);
            assert.equal(
                tallyVoteEvents[EventType.VOTES_TALLIED].desiredEgl.toString(),
                expectedEgl.toString(),
                "Incorrect desired EGL amount after tally votes"
            );
            assert.equal(
                tallyVoteEvents[EventType.VOTES_TALLIED].currentEpoch.toString(),
                "0",
                "Incorrect next epoch"
            );
            assert.equal(
                tallyVoteEvents[EventType.VOTES_TALLIED].votingThreshold.toString(),
                web3.utils.toWei("10"),
                "Incorrect voting threshold"
            );

            assert.equal(
                (await eglContractInstance.currentEpochStartDate()).toString(),
                parseInt(epochStart) + EPOCH_LENGTH_S,
                "Incorrect start date for next epoch"
            );

            let expectedVoteWeightsSum = [
                web3.utils.toWei("200000020"),
                web3.utils.toWei("200000000"),
                web3.utils.toWei("200000000"),
                web3.utils.toWei("200000000"),
                web3.utils.toWei("200000000"),
                web3.utils.toWei("200000000"),
                web3.utils.toWei("200000000"),
                "0",
            ];

            let expectedVoteTotals = [
                web3.utils.toWei("25000010"),
                web3.utils.toWei("25000000"),
                web3.utils.toWei("25000000"),
                web3.utils.toWei("25000000"),
                web3.utils.toWei("25000000"),
                web3.utils.toWei("25000000"),
                web3.utils.toWei("25000000"),
                "0",
            ];

            let expectedVoteRewardSums = [
                web3.utils.toWei("200000020"),
                web3.utils.toWei("200000020"),
                web3.utils.toWei("200000000"),
                web3.utils.toWei("200000000"),
                web3.utils.toWei("200000000"),
                web3.utils.toWei("200000000"),
                web3.utils.toWei("200000000"),
                web3.utils.toWei("200000000"),
            ];

            for (let i = 0; i < 8; i++) {
                // Vote weight total for epoch
                assert.equal(
                    (await eglContractInstance.voteWeightsSum(i)).toString(),
                    expectedVoteWeightsSum[i],
                    "Incorrect vote weight sum after tally votes - week " + i
                );

                // TODO: Test gasTargetSum

                // Votes total
                assert.equal(
                    (await eglContractInstance.votesTotal(i)).toString(),
                    expectedVoteTotals[i],
                    "Incorrect votes totals after 1st tally votes- week " + i
                );

                // Voter reward sums
                assert.equal(
                    (await eglContractInstance.voterRewardSums(i)).toString(),
                    expectedVoteRewardSums[i],
                    "Incorrect initial voter reward sums after 1st tally votes - week " +
                    i
                );
            }
        });
        it.skip("should trigger creator reward - (long running)", async () => {
            for (let i = 0; i < 9; i++) {
                await sleep(EPOCH_LENGTH_S + 1);
                console.log("Epoch " + i + " to done, tallying votes...");
                let tallyVotesTxReceipt = await eglContractInstance.tallyVotes({
                    from: accounts[i],
                });
                let tallyVoteEvents = populateEventDataFromLogs(tallyVotesTxReceipt);
                assert.exists(
                    tallyVoteEvents[EventType.VOTES_TALLIED],
                    "Expected 'VotesTallied' event"
                );
                assert.notExists(
                    tallyVoteEvents[EventType.CREATOR_REWARDS_CLAIMED],
                    "Unexpected 'CreatorRewardsClaimed' event"
                );
            }
            await sleep(EPOCH_LENGTH_S + 1);
            let tallyVotesTxReceipt = await eglContractInstance.tallyVotes({
                from: accounts[9],
            });
            let tallyVoteEvents = populateEventDataFromLogs(tallyVotesTxReceipt);

            assert.exists(
                tallyVoteEvents[EventType.CREATOR_REWARDS_CLAIMED],
                "Expected 'CreatorRewardsClaimed' event"
            );
            assert.equal(
                tallyVoteEvents[EventType.CREATOR_REWARDS_CLAIMED].creatorRewardAddress,
                CREATOR_REWARDS_ACCOUNT,
                "Incorrect creator reward address"
            );
            assert.equal(
                tallyVoteEvents[
                    EventType.CREATOR_REWARDS_CLAIMED
                    ].amountClaimed.toString(),
                WEEKLY_CREATOR_REWARD,
                "Incorrect creator reward amount"
            );
        });
        it("should fail if epoch has not ended", async () => {
            let currentEpoch = await eglContractInstance.currentEpoch();
            assert.equal(currentEpoch, "0", "Incorrect epoch before votes tallied");
            await expectRevert(
                eglContractInstance.tallyVotes({from: _voter1}),
                "EGL: Current voting period has not yet ended"
            );
        });
    });

    describe.skip("Withdraw", function () {
        it("account can withdraw tokens after lockup period has expired", async () => {
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
                validGasTarget,
                "10",
                1,
                _voter1,
            ]);

            let voter = await eglContractInstance.voters(_voter1);
            let expectedReleaseDate =
                (await getBlockTimestamp(voteTxReceipt)) + 2 * EPOCH_LENGTH_S;
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

            await sleep(EPOCH_LENGTH_S + 1);
            await eglContractInstance.tallyVotes({from: _voter2});

            let withdrawTxReceipt = await eglContractInstance.withdraw({
                from: _voter1,
            });
            let withdrawEvents = populateEventDataFromLogs(withdrawTxReceipt);

            assert.equal(
                withdrawEvents[EventType.WITHDRAW].tokensLocked.toString(),
                web3.utils.toWei("10"),
                "Incorrect original voter amount"
            );

            console.log(
                "Voter reward: ",
                withdrawEvents[EventType.WITHDRAW].rewardTokens.toString()
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
        it("should fail withdraw validations", async () => {
            await expectRevert(
                eglContractInstance.withdraw({from: _voter1}),
                "EGL: Address has not voted"
            );

            await castSimpleVotes([VoteDirection.UP, "10", 2, _voter1]);

            await expectRevert(
                eglContractInstance.withdraw({from: _voter1}),
                "EGL: Tokens can only be withdrawn after the release date"
            );
        });
    });

    describe.skip("Sweep Pool Rewards", function () {
        it.skip("sends token to coinbase account", async () => {
        });
    });
});
