const {
    expectRevert,
    time
} = require('@openzeppelin/test-helpers');

const EglToken = artifacts.require("./EglToken.sol");
const EglContract = artifacts.require("./EglContract.sol");

contract("EglTests", accounts => {
    const [_deployer, _voter1, _voter2, _voter3, _voter4] = accounts;
    const VoteDirection = {
        UP: 0,
        SAME: 1,
        DOWN: 2
    };
    const VoterAttributes = {
        LOCKUP_DURATION: 0,
        VOTE_EPOCH: 1,
        RELEASE_DATE: 2,
        TOKENS_LOCKED: 3,
        DESIRED_CHANGE: 4,
        DAO_RECIPIENT: 5,
        DAO_AMOUNT: 6,
        UPGRADE_ADDRESS: 7
    };
    const EPOCH_LENGTH_S = 5;
    const VOTE_PAUSE_S = 1;
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    let eglTokenInstance;
    let eglContractInstance;

    async function generateMultipleSimpleVotes(...voteValues) {
        return await Promise.all(voteValues.map(async (voteValues) => {
            return await eglContractInstance.vote(
                voteValues[0], web3.utils.toWei(voteValues[1]), voteValues[2], ZERO_ADDRESS, 0, ZERO_ADDRESS,
                {from: voteValues[3]}
            )
        }));
    }

    async function sleep(seconds) {
        return new Promise(resolve => {
            setTimeout(resolve, seconds * 1000);
        });
    }

    beforeEach(async () => {
        eglTokenInstance = await EglToken.new();
        await eglTokenInstance.initialize(
            "EthereumGasLimit", "EGL",
            web3.utils.toWei("4000000000")
        );

        eglContractInstance = await EglContract.new();
        await eglContractInstance.initialize(
            eglTokenInstance.address,
            "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
            "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
            Math.round(new Date().getTime() / 1000),
            VOTE_PAUSE_S,
            EPOCH_LENGTH_S,
            _voter1
        );

        // TODO: Deployer shouldn't be able to transfer toknes, only contract should
        eglTokenInstance.transfer(_voter1, web3.utils.toWei("1000"), {from: _deployer})
        eglTokenInstance.transfer(_voter2, web3.utils.toWei("1000"), {from: _deployer})
        eglTokenInstance.transfer(_voter3, web3.utils.toWei("1000"), {from: _deployer})
        eglTokenInstance.transfer(_voter4, web3.utils.toWei("1000"), {from: _deployer})

        eglTokenInstance.increaseAllowance(eglContractInstance.address, web3.utils.toWei("1000"), {from: _voter1})
        eglTokenInstance.increaseAllowance(eglContractInstance.address, web3.utils.toWei("1000"), {from: _voter2})
        eglTokenInstance.increaseAllowance(eglContractInstance.address, web3.utils.toWei("1000"), {from: _voter3})
        eglTokenInstance.increaseAllowance(eglContractInstance.address, web3.utils.toWei("1000"), {from: _voter4})
    });

    describe('Token', function () {
        it("Max supply of 4,000,000,000 tokens", async () => {
            let supplyLimit = await eglTokenInstance.totalSupply();
            assert.equal(supplyLimit.toString(), web3.utils.toWei("4000000000"), "Incorrect total token supply limit");
        });
    });

    describe('Vote', function () {
        it("one person with tokens can vote", async () => {
            let initialContractEglBalance = (await eglTokenInstance.balanceOf(eglContractInstance.address)).toString();
            let txReceipt = await eglContractInstance.vote(
                VoteDirection.UP,
                web3.utils.toWei("10"),
                2,
                "0x0000000000000000000000000000000000000000",
                0,
                "0x0000000000000000000000000000000000000000",
                {from: _voter1}
            );
            let voter = await eglContractInstance.voters(_voter1);
            let voteCallBlockTimestamp = (await web3.eth.getBlock(txReceipt.receipt.blockNumber)).timestamp;
            let expectedReleaseDate = voteCallBlockTimestamp + (2 * EPOCH_LENGTH_S);

            assert.equal(voter[VoterAttributes.LOCKUP_DURATION], "2", "Incorrect lockup duration saved for voter");
            assert.equal(voter[VoterAttributes.VOTE_EPOCH], "0", "Incorrect starting epoch saved for voter");
            assert.equal(voter[VoterAttributes.RELEASE_DATE], expectedReleaseDate, "Incorrect release date saved for voter");
            assert.equal(voter[VoterAttributes.TOKENS_LOCKED], web3.utils.toWei("10"), "Incorrect tokens locked for voter");
            assert.equal(voter[VoterAttributes.DESIRED_CHANGE], VoteDirection.UP, "Incorrect vote direction saved for voter");
            assert.equal(voter[VoterAttributes.DAO_RECIPIENT], ZERO_ADDRESS, "Incorrect DAO recipient address saved for voter");
            assert.equal(voter[VoterAttributes.DAO_AMOUNT], "0", "Incorrect DAO amount saved for voter");
            assert.equal(voter[VoterAttributes.UPGRADE_ADDRESS], ZERO_ADDRESS, "Incorrect upgrade address saved for voter");

            //Token transfer
            assert.equal(
                await eglTokenInstance.balanceOf(eglContractInstance.address),
                parseInt(initialContractEglBalance) + parseInt(web3.utils.toWei("10")),
                "Incorrect EglContract token balance"
            );

            // Direction vote totals
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.UP, 0)).toString(),
                web3.utils.toWei("20"),
                "Incorrect 'UP' vote count for vote period 0"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.UP, 2)).toString(),
                "0",
                "Incorrect 'UP' vote count for vote period 2"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.SAME, 0)).toString(),
                "0",
                "Incorrect 'SAME' vote count for vote period 0"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.DOWN, 0)).toString(),
                "0",
                "Incorrect 'DOWN' vote count for vote period 0"
            );

            // Voter reward sums
            assert.equal(
                (await eglContractInstance.voterRewardSums(0)).toString(), web3.utils.toWei("20"), "Incorrect reward sum for epoch 0"
            );
            assert.equal(
                (await eglContractInstance.voterRewardSums(1)).toString(), web3.utils.toWei("20"), "Incorrect reward sum for epoch 1"
            );
            assert.equal(
                (await eglContractInstance.voterRewardSums(2)).toString(), "0", "Incorrect reward sum for epoch 2"
            );

            // Vote totals
            assert.equal(
                (await eglContractInstance.votesTotal(0)).toString(), web3.utils.toWei("10"), "Incorrect reward sum for vote period 0"
            );
            assert.equal(
                (await eglContractInstance.votesTotal(1)).toString(), web3.utils.toWei("10"), "Incorrect reward sum for vote period 1"
            );
            assert.equal(
                (await eglContractInstance.votesTotal(2)).toString(), "0", "Incorrect reward sum for vote period 2"
            );
        });
        it("multiple persons with tokens can vote", async () => {
            let initialContractEglBalance = (await eglTokenInstance.balanceOf(eglContractInstance.address)).toString();
            let [txReceipt1, txReceipt2, txReceipt3] = await generateMultipleSimpleVotes(
                [VoteDirection.UP, "10", 2, _voter1],
                [VoteDirection.UP, "2", 8, _voter2],
                [VoteDirection.DOWN, "20", 4, _voter3]
            );

            let voter1 = await eglContractInstance.voters(_voter1);
            let expectedReleaseDate1 = ((await web3.eth.getBlock(txReceipt1.receipt.blockNumber)).timestamp) + (2 * EPOCH_LENGTH_S);
            assert.equal(voter1[VoterAttributes.LOCKUP_DURATION], "2", "Incorrect lockup duration saved for voter1");
            assert.equal(voter1[VoterAttributes.RELEASE_DATE], expectedReleaseDate1, "Incorrect release date saved for voter1");
            assert.equal(voter1[VoterAttributes.TOKENS_LOCKED], web3.utils.toWei("10"), "Incorrect tokens locked for voter1");
            assert.equal(voter1[VoterAttributes.DESIRED_CHANGE], VoteDirection.UP, "Incorrect vote direction saved for voter1");

            let voter2 = await eglContractInstance.voters(_voter2);
            let expectedReleaseDate2 = ((await web3.eth.getBlock(txReceipt2.receipt.blockNumber)).timestamp) + (8 * EPOCH_LENGTH_S);
            assert.equal(voter2[VoterAttributes.LOCKUP_DURATION], "8", "Incorrect lockup duration saved for voter2");
            assert.equal(voter2[VoterAttributes.RELEASE_DATE], expectedReleaseDate2, "Incorrect release date saved for voter2");
            assert.equal(voter2[VoterAttributes.TOKENS_LOCKED], web3.utils.toWei("2"), "Incorrect tokens locked for voter2");
            assert.equal(voter2[VoterAttributes.DESIRED_CHANGE], VoteDirection.UP, "Incorrect vote direction saved for voter2");

            let voter3 = await eglContractInstance.voters(_voter3);
            let expectedReleaseDate3 = ((await web3.eth.getBlock(txReceipt3.receipt.blockNumber)).timestamp) + (4 * EPOCH_LENGTH_S);
            assert.equal(voter3[VoterAttributes.LOCKUP_DURATION], "4", "Incorrect lockup duration saved for voter3");
            assert.equal(voter3[VoterAttributes.RELEASE_DATE], expectedReleaseDate3, "Incorrect release date saved for voter3");
            assert.equal(voter3[VoterAttributes.TOKENS_LOCKED], web3.utils.toWei("20"), "Incorrect tokens locked for voter3");
            assert.equal(voter3[VoterAttributes.DESIRED_CHANGE], VoteDirection.DOWN, "Incorrect vote direction saved for voter3");

            //Token transfer
            assert.equal(
                await eglTokenInstance.balanceOf(eglContractInstance.address),
                parseInt(initialContractEglBalance) + parseInt(web3.utils.toWei("32")),
                "Incorrect EglContract token balance"
            );

            // Direction vote totals
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.UP, 0)).toString(),
                web3.utils.toWei("36"),
                "Incorrect 'UP' vote count for vote period 0"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.UP, 2)).toString(),
                web3.utils.toWei("16"),
                "Incorrect 'UP' vote count for vote period 2"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.SAME, 0)).toString(),
                "0",
                "Incorrect 'SAME' vote count for vote period 0"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.DOWN, 0)).toString(),
                web3.utils.toWei("80"),
                "Incorrect 'DOWN' vote count for vote period 0"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.DOWN, 2)).toString(),
                web3.utils.toWei("80"),
                "Incorrect 'DOWN' vote count for vote period 0"
            );

            // Voter reward sums
            assert.equal(
                (await eglContractInstance.voterRewardSums(0)).toString(), web3.utils.toWei("116"), "Incorrect reward sum for epoch 0"
            );
            assert.equal(
                (await eglContractInstance.voterRewardSums(1)).toString(), web3.utils.toWei("116"), "Incorrect reward sum for epoch 1"
            );
            assert.equal(
                (await eglContractInstance.voterRewardSums(2)).toString(), web3.utils.toWei("96"), "Incorrect reward sum for epoch 2"
            );

            // Vote totals
            assert.equal(
                (await eglContractInstance.votesTotal(0)).toString(), web3.utils.toWei("32"), "Incorrect reward sum for vote period 0"
            );
            assert.equal(
                (await eglContractInstance.votesTotal(1)).toString(), web3.utils.toWei("32"), "Incorrect reward sum for vote period 1"
            );
            assert.equal(
                (await eglContractInstance.votesTotal(2)).toString(), web3.utils.toWei("22"), "Incorrect reward sum for vote period 2"
            );

        });
        it("should fail all vote validations", async () => {
            await eglContractInstance.vote(
                VoteDirection.UP, web3.utils.toWei("10"), 2, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000",
                {from: _voter1}
            );

            await expectRevert(
                eglContractInstance.vote(
                    VoteDirection.DOWN, web3.utils.toWei("1"), 1, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000",
                    {from: _voter1}
                ),
                "EGL: Address has already voted"
            );

            await expectRevert(
                eglContractInstance.vote(
                    5, web3.utils.toWei("1"), 1, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000",
                    {from: _voter2}
                ),
                "EGL: Invalid vote direction"
            );

            await expectRevert(
                eglContractInstance.vote(
                    VoteDirection.UP, web3.utils.toWei("1"), 10, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000",
                    {from: _voter2}
                ),
                "EGL: Invalid lockup duration. Should be between 1 and 8"
            );

            await expectRevert(
                eglContractInstance.vote(
                    VoteDirection.UP, web3.utils.toWei("1"), 1, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000",
                    {from: accounts[9]}
                ),
                "EGL: Address has an insufficient EGL balance"
            );

            await eglTokenInstance.transfer(accounts[9], web3.utils.toWei("10"), {from: _deployer})
            await expectRevert(
                eglContractInstance.vote(
                    VoteDirection.UP, web3.utils.toWei("1"), 1, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000",
                    {from: accounts[9]}
                ),
                "EGL: EGL contract has insufficient token allowance"
            );
        });
    });

    describe('ReVote', function () {
        it("person can revote with different lockup duration in the same epoch", async () => {
            let initialContractEglBalance = (await eglTokenInstance.balanceOf(eglContractInstance.address)).toString();
            let [_txReceipt1, txReceipt2, _txReceipt3] = await generateMultipleSimpleVotes(
                [VoteDirection.UP, "10", 2, _voter1],
                [VoteDirection.UP, "2", 8, _voter2],
                [VoteDirection.DOWN, "20", 4, _voter3]
            );

            let voter = await eglContractInstance.voters(_voter2);
            let voteCallBlockTimestamp = (await web3.eth.getBlock(txReceipt2.receipt.blockNumber)).timestamp;
            let expectedReleaseDate = voteCallBlockTimestamp + (8 * EPOCH_LENGTH_S);

            assert.equal(voter[VoterAttributes.LOCKUP_DURATION], "8", "Incorrect lockup duration saved for voter");
            assert.equal(voter[VoterAttributes.VOTE_EPOCH], "0", "Incorrect starting epoch saved for voter");
            assert.equal(voter[VoterAttributes.RELEASE_DATE], expectedReleaseDate, "Incorrect release date saved for voter");
            assert.equal(voter[VoterAttributes.TOKENS_LOCKED], web3.utils.toWei("2"), "Incorrect tokens locked for voter");

            await eglContractInstance.reVote(
                VoteDirection.UP, web3.utils.toWei("5"), 2, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000",
                {from: _voter2}
            );
            voter = await eglContractInstance.voters(_voter2);

            assert.equal(voter[VoterAttributes.LOCKUP_DURATION], "2", "Incorrect lockup duration saved for voter");
            assert.equal(voter[VoterAttributes.VOTE_EPOCH], "0", "Incorrect starting epoch saved for voter");
            assert.equal(voter[VoterAttributes.RELEASE_DATE], expectedReleaseDate, "Incorrect release date saved for voter");
            assert.equal(voter[VoterAttributes.TOKENS_LOCKED], web3.utils.toWei("7"), "Incorrect tokens locked for voter");

            //Token transfer
            assert.equal(
                await eglTokenInstance.balanceOf(eglContractInstance.address),
                parseInt(initialContractEglBalance) + parseInt(web3.utils.toWei("37")),
                "Incorrect EglContract token balance"
            );

            // Direction vote totals
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.UP, 0)).toString(),
                web3.utils.toWei("34"),
                "Incorrect 'UP' vote count for vote period 0"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.UP, 2)).toString(),
                "0",
                "Incorrect 'UP' vote count for vote period 2"
            );

            // Voter reward sums
            assert.equal(
                (await eglContractInstance.voterRewardSums(0)).toString(), web3.utils.toWei("114"), "Incorrect reward sum for epoch 0"
            );
            assert.equal(
                (await eglContractInstance.voterRewardSums(1)).toString(), web3.utils.toWei("114"), "Incorrect reward sum for epoch 1"
            );
            assert.equal(
                (await eglContractInstance.voterRewardSums(2)).toString(), web3.utils.toWei("80"), "Incorrect reward sum for epoch 2"
            );

            // Vote totals
            assert.equal(
                (await eglContractInstance.votesTotal(0)).toString(), web3.utils.toWei("37"), "Incorrect reward sum for vote period 0"
            );
            assert.equal(
                (await eglContractInstance.votesTotal(1)).toString(), web3.utils.toWei("37"), "Incorrect reward sum for vote period 1"
            );
            assert.equal(
                (await eglContractInstance.votesTotal(2)).toString(), web3.utils.toWei("20"), "Incorrect reward sum for vote period 2"
            );
        });
        it("should fail all re-vote validations", async () => {
            let [txReceipt1, txReceipt2, txReceipt3] = await generateMultipleSimpleVotes(
                [VoteDirection.UP, "10", 2, _voter1],
                [VoteDirection.UP, "2", 8, _voter2],
                [VoteDirection.DOWN, "20", 4, _voter3]
            );

            await expectRevert(
                eglContractInstance.reVote(
                    VoteDirection.UP, web3.utils.toWei("1"), 1, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000",
                    {from: accounts[9]}
                ),
                "EGL: Address has an insufficient EGL balance"
            );

            await eglTokenInstance.transfer(accounts[9], web3.utils.toWei("10"), {from: _deployer})
            await expectRevert(
                eglContractInstance.reVote(
                    VoteDirection.UP, web3.utils.toWei("1"), 1, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000",
                    {from: accounts[9]}
                ),
                "EGL: EGL contract has insufficient token allowance"
            );
            eglTokenInstance.increaseAllowance(eglContractInstance.address, web3.utils.toWei("10"), {from: accounts[9]})

            await expectRevert(
                eglContractInstance.reVote(
                    VoteDirection.SAME, web3.utils.toWei("1"), 1, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000",
                    {from: accounts[9]}
                ),
                "EGL: Address has not yet voted"
            );

            await expectRevert(
                eglContractInstance.reVote(
                    5, web3.utils.toWei("1"), 1, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000",
                    {from: _voter2}
                ),
                "EGL: Invalid vote direction"
            );

            await expectRevert(
                eglContractInstance.reVote(
                    VoteDirection.UP, web3.utils.toWei("1"), 10, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000",
                    {from: _voter2}
                ),
                "EGL: Invalid lockup duration. Should be between 1 and 8"
            );
        });
    });

    describe('Tally Votes', function () {
        it("voting threshold missed", async () => {
            let epochStart = await eglContractInstance.currentEpochStartDate();
            let txReceipts = await generateMultipleSimpleVotes(
                [VoteDirection.UP, "10", 1, _voter1],
                [VoteDirection.UP, "5", 2, _voter2],
                [VoteDirection.DOWN, "10", 1, _voter3]
            );

            // Direction vote totals
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.UP, 0)).toString(),
                web3.utils.toWei("20"),
                "Incorrect 'UP' vote count for vote period 0 0"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.UP, 1)).toString(),
                web3.utils.toWei("10"),
                "Incorrect 'UP' vote count for vote period 0 2"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.UP, 2)).toString(),
                "0",
                "Incorrect 'UP' vote count for vote period 0 2"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.SAME, 0)).toString(),
                "0",
                "Incorrect 'SAME' vote count for vote period 0 0"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.DOWN, 0)).toString(),
                web3.utils.toWei("10"),
                "Incorrect 'DOWN' vote count for vote period 0 0"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.DOWN, 1)).toString(),
                "0",
                "Incorrect 'DOWN' vote count for vote period 0 1"
            );

            // Vote totals
            assert.equal(
                (await eglContractInstance.votesTotal(0)).toString(),
                web3.utils.toWei("25"),
                "Incorrect vote total for vote period 0 0"
            );
            assert.equal(
                (await eglContractInstance.votesTotal(1)).toString(),
                web3.utils.toWei("5"),
                "Incorrect vote total for vote period 0 1"
            );
            assert.equal(
                (await eglContractInstance.votesTotal(2)).toString(),
                "0",
                "Incorrect vote total for vote period 0 2"
            );

            // Sleep to end the epoch
            await sleep(EPOCH_LENGTH_S + 1)
            let tallyVotesTxReceipt = await eglContractInstance.tallyVotes({from: accounts[9]});
            let tallyVoteEvent = tallyVotesTxReceipt.logs[0].args;

            assert.equal(tallyVoteEvent.nextEpoch.toString(), "1", "Incorrect next epoch");
            assert.equal(tallyVoteEvent.desiredEgl.toString(), "12500000", "Incorrect desired EGL amount after tally votes");
            assert.equal(tallyVoteEvent.totalVotesUp.toString(), web3.utils.toWei("20"), "Incorrect votes up in event");
            assert.equal(tallyVoteEvent.votingThreshold.toString(), web3.utils.toWei("10"), "Incorrect voting threshold");

            assert.equal(
                (await eglContractInstance.currentEpochStartDate()).toString(),
                parseInt(epochStart) + EPOCH_LENGTH_S,
                "Incorrect voting threshold"
            );

            // Direction vote totals
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.UP, 0)).toString(),
                web3.utils.toWei("10"),
                "Incorrect 'UP' vote count for vote period 1 0"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.UP, 1)).toString(),
                "0",
                "Incorrect 'UP' vote count for vote period 1 1"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.UP, 2)).toString(),
                "0",
                "Incorrect 'UP' vote count for vote period 1 2"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.SAME, 0)).toString(),
                "0",
                "Incorrect 'SAME' vote count for vote period 1 0"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.DOWN, 0)).toString(),
                "0",
                "Incorrect 'DOWN' vote count for vote period 1 1"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.DOWN, 0)).toString(),
                "0",
                "Incorrect 'DOWN' vote count for vote period 1 2"
            );

            // Vote totals
            assert.equal(
                (await eglContractInstance.votesTotal(0)).toString(), web3.utils.toWei("5"), "Incorrect vote total for vote period 1 0"
            );
            assert.equal(
                (await eglContractInstance.votesTotal(1)).toString(), "0", "Incorrect vote total for vote period 1 1"
            );
            assert.equal(
                (await eglContractInstance.votesTotal(2)).toString(), "0", "Incorrect vote total for vote period 1 2"
            );
        });
        it("should fail if epoch has not ended", async () => {
            let currentEpoch = await eglContractInstance.currentEpoch();
            assert.equal(currentEpoch, "0", "Incorrect epoch before votes tallied");
            await expectRevert(
                eglContractInstance.tallyVotes({from: _voter1}),
                "EGL: Current voting period has not yet ended"
            );

            // Sleep to end the epoch
            await sleep(EPOCH_LENGTH_S + 1)
            await eglContractInstance.tallyVotes({from: _voter1});

            currentEpoch = await eglContractInstance.currentEpoch();
            await eglContractInstance.currentEpoch();
            assert.equal(currentEpoch, "1", "Incorrect epoch after votes tallied");
        });
    });

    describe.skip('Withdraw', function () {
        it.skip("person can withdraw tokens after lockup period", async () => {
            let initialContractEglBalance = (await eglTokenInstance.balanceOf(eglContractInstance.address)).toString();
            let [_txReceipt1, txReceipt2, _txReceipt3] = await generateMultipleSimpleVotes(
                [VoteDirection.UP, "10", 2, _voter1],
                [VoteDirection.UP, "2", 8, _voter2],
                [VoteDirection.DOWN, "20", 4, _voter3]
            );

            // Wait until
            let voter = await eglContractInstance.voters(_voter2);
            let voteCallBlockTimestamp = (await web3.eth.getBlock(txReceipt2.receipt.blockNumber)).timestamp;
            let expectedReleaseDate = voteCallBlockTimestamp + (8 * EPOCH_LENGTH_S);

            assert.equal(voter[VoterAttributes.LOCKUP_DURATION], "8", "Incorrect lockup duration saved for voter");
            assert.equal(voter[VoterAttributes.VOTE_EPOCH], "0", "Incorrect starting epoch saved for voter");
            assert.equal(voter[VoterAttributes.RELEASE_DATE], expectedReleaseDate, "Incorrect release date saved for voter");
            assert.equal(voter[VoterAttributes.TOKENS_LOCKED], web3.utils.toWei("2"), "Incorrect tokens locked for voter");

            await eglContractInstance.reVote(
                VoteDirection.UP, web3.utils.toWei("5"), 2, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000",
                {from: _voter2}
            );
            voter = await eglContractInstance.voters(_voter2);

            assert.equal(voter[VoterAttributes.LOCKUP_DURATION], "2", "Incorrect lockup duration saved for voter");
            assert.equal(voter[VoterAttributes.VOTE_EPOCH], "0", "Incorrect starting epoch saved for voter");
            assert.equal(voter[VoterAttributes.RELEASE_DATE], expectedReleaseDate, "Incorrect release date saved for voter");
            assert.equal(voter[VoterAttributes.TOKENS_LOCKED], web3.utils.toWei("7"), "Incorrect tokens locked for voter");

            //Token transfer
            assert.equal(
                await eglTokenInstance.balanceOf(eglContractInstance.address),
                parseInt(initialContractEglBalance) + parseInt(web3.utils.toWei("37")),
                "Incorrect EglContract token balance"
            );

            // Direction vote totals
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.UP, 0)).toString(),
                web3.utils.toWei("34"),
                "Incorrect 'UP' vote count for vote period 0"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.UP, 2)).toString(),
                "0",
                "Incorrect 'UP' vote count for vote period 2"
            );

            // Voter reward sums
            assert.equal(
                (await eglContractInstance.voterRewardSums(0)).toString(), web3.utils.toWei("114"), "Incorrect reward sum for epoch 0"
            );
            assert.equal(
                (await eglContractInstance.voterRewardSums(1)).toString(), web3.utils.toWei("114"), "Incorrect reward sum for epoch 1"
            );
            assert.equal(
                (await eglContractInstance.voterRewardSums(2)).toString(), web3.utils.toWei("80"), "Incorrect reward sum for epoch 2"
            );

            // Vote totals
            assert.equal(
                (await eglContractInstance.votesTotal(0)).toString(), web3.utils.toWei("37"), "Incorrect reward sum for vote period 0"
            );
            assert.equal(
                (await eglContractInstance.votesTotal(1)).toString(), web3.utils.toWei("37"), "Incorrect reward sum for vote period 1"
            );
            assert.equal(
                (await eglContractInstance.votesTotal(2)).toString(), web3.utils.toWei("20"), "Incorrect reward sum for vote period 2"
            );
        });
        it("should fail all withdraw validations", async () => {
            let txReceipts = await generateMultipleSimpleVotes(
                [VoteDirection.UP, "10", 2, _voter1],
                [VoteDirection.UP, "2", 8, _voter2],
                [VoteDirection.DOWN, "20", 4, _voter3]
            );

            await expectRevert(
                eglContractInstance.withdraw({from: accounts[9]}),
                "EGL: Address has not voted"
            );

            await expectRevert(
                eglContractInstance.withdraw({from: _voter1}),
                "EGL: Tokens can only be withdrawn after the release date"
            );
        });
    });

    describe.skip('Sweep Pool Rewards', function () {
        it.skip("person can withdraw tokens after lockup period", async () => {
            let initialContractEglBalance = (await eglTokenInstance.balanceOf(eglContractInstance.address)).toString();
            let [_txReceipt1, txReceipt2, _txReceipt3] = await generateMultipleSimpleVotes(
                [VoteDirection.UP, "10", 2, _voter1],
                [VoteDirection.UP, "2", 8, _voter2],
                [VoteDirection.DOWN, "20", 4, _voter3]
            );

            // Wait until
            let voter = await eglContractInstance.voters(_voter2);
            let voteCallBlockTimestamp = (await web3.eth.getBlock(txReceipt2.receipt.blockNumber)).timestamp;
            let expectedReleaseDate = voteCallBlockTimestamp + (8 * EPOCH_LENGTH_S);

            assert.equal(voter[VoterAttributes.LOCKUP_DURATION], "8", "Incorrect lockup duration saved for voter");
            assert.equal(voter[VoterAttributes.VOTE_EPOCH], "0", "Incorrect starting epoch saved for voter");
            assert.equal(voter[VoterAttributes.RELEASE_DATE], expectedReleaseDate, "Incorrect release date saved for voter");
            assert.equal(voter[VoterAttributes.TOKENS_LOCKED], web3.utils.toWei("2"), "Incorrect tokens locked for voter");

            await eglContractInstance.reVote(
                VoteDirection.UP, web3.utils.toWei("5"), 2, "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000",
                {from: _voter2}
            );
            voter = await eglContractInstance.voters(_voter2);

            assert.equal(voter[VoterAttributes.LOCKUP_DURATION], "2", "Incorrect lockup duration saved for voter");
            assert.equal(voter[VoterAttributes.VOTE_EPOCH], "0", "Incorrect starting epoch saved for voter");
            assert.equal(voter[VoterAttributes.RELEASE_DATE], expectedReleaseDate, "Incorrect release date saved for voter");
            assert.equal(voter[VoterAttributes.TOKENS_LOCKED], web3.utils.toWei("7"), "Incorrect tokens locked for voter");

            //Token transfer
            assert.equal(
                await eglTokenInstance.balanceOf(eglContractInstance.address),
                parseInt(initialContractEglBalance) + parseInt(web3.utils.toWei("37")),
                "Incorrect EglContract token balance"
            );

            // Direction vote totals
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.UP, 0)).toString(),
                web3.utils.toWei("34"),
                "Incorrect 'UP' vote count for vote period 0"
            );
            assert.equal(
                (await eglContractInstance.directionVoteCount(VoteDirection.UP, 2)).toString(),
                "0",
                "Incorrect 'UP' vote count for vote period 2"
            );

            // Voter reward sums
            assert.equal(
                (await eglContractInstance.voterRewardSums(0)).toString(), web3.utils.toWei("114"), "Incorrect reward sum for epoch 0"
            );
            assert.equal(
                (await eglContractInstance.voterRewardSums(1)).toString(), web3.utils.toWei("114"), "Incorrect reward sum for epoch 1"
            );
            assert.equal(
                (await eglContractInstance.voterRewardSums(2)).toString(), web3.utils.toWei("80"), "Incorrect reward sum for epoch 2"
            );

            // Vote totals
            assert.equal(
                (await eglContractInstance.votesTotal(0)).toString(), web3.utils.toWei("37"), "Incorrect reward sum for vote period 0"
            );
            assert.equal(
                (await eglContractInstance.votesTotal(1)).toString(), web3.utils.toWei("37"), "Incorrect reward sum for vote period 1"
            );
            assert.equal(
                (await eglContractInstance.votesTotal(2)).toString(), web3.utils.toWei("20"), "Incorrect reward sum for vote period 2"
            );
        });
        it("should fail all withdraw validations", async () => {
            let txReceipts = await generateMultipleSimpleVotes(
                [VoteDirection.UP, "10", 2, _voter1],
                [VoteDirection.UP, "2", 8, _voter2],
                [VoteDirection.DOWN, "20", 4, _voter3]
            );

            await expectRevert(
                eglContractInstance.withdraw({from: accounts[9]}),
                "EGL: Address has not voted"
            );

            await expectRevert(
                eglContractInstance.withdraw({from: _voter1}),
                "EGL: Tokens can only be withdrawn after the release date"
            );
        });
    });
});