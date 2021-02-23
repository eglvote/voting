const { expectRevert, time } = require("@openzeppelin/test-helpers");
const {
    BN,
    UniswapV2Router,
    TestableEglContract,
    EglToken,
    EglUpgrader,
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
} = require("./helpers/constants");

const {
    sleep, 
    populateEventDataFromLogs,
    getBlockTimestamp,
    giveFreeTokens,
    populateAllEventDataFromLogs,
    getAllEventsForType,
} = require("./helpers/helper-functions")

contract("EglTests", (accounts) => {
    const [_deployer, _voter1, _voter2, _voter3, _voter4NoAllowance, _creator, _seed1, _seed2] = accounts;
    const SEED_ACCOUNTS = [_seed1, _seed2];
    const CREATOR_REWARDS_ACCOUNT = _creator;
    
    let eglTokenInstance;
    let eglContractInstance;
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
                    ZeroAddress,
                    0,
                    ZeroAddress,
                    { from: voteValues[3] }
                );
            })
        );
    }

    beforeEach(async () => {             
        UniswapV2Router.setProvider(web3._provider);
        let routerContract = await UniswapV2Router.deployed();                    

        let totalTokenSupply = new BN(web3.utils.toWei("4000000000"));
        eglTokenInstance = await EglToken.new();
        await eglTokenInstance.initialize("EthereumGasLimit", "EGL", totalTokenSupply);

        let giftAccounts = {
            "Account 1": _voter1,
            "Account 2": _voter2,
        }
        let eglsGifted = await giveFreeTokens(giftAccounts, eglTokenInstance);

        let eglUpgraderInstance = await EglUpgrader.deployed();
        eglContractInstance = await TestableEglContract.new();        
        let eglContractDeploymentHash = eglContractInstance.transactionHash;
        let eglContractDeploymentTransaction = await web3.eth.getTransaction(eglContractDeploymentHash);
        eglContractDeployBlockNumber = eglContractDeploymentTransaction.blockNumber;
        let eglContractDeploymentBlock = await web3.eth.getBlock(eglContractDeployBlockNumber);
        let eglContractDeploymentTimestamp = eglContractDeploymentBlock.timestamp;
        eglContractDeployGasLimit = eglContractDeploymentBlock.gasLimit;

        let txReceipt = await eglContractInstance.initialize(
            eglUpgraderInstance.address,
            eglTokenInstance.address,
            routerContract.address,
            DefaultEthToLaunch,
            eglContractDeploymentTimestamp,
            DefaultVotePauseSeconds,
            DefaultEpochLengthSeconds,
            "6700000",
            "7200000",
            SEED_ACCOUNTS,
            eglsGifted,
            CREATOR_REWARDS_ACCOUNT
        );
        await eglTokenInstance.transfer(eglContractInstance.address, totalTokenSupply.sub(eglsGifted), { from: _deployer });

        initEvent = populateAllEventDataFromLogs(txReceipt, EventType.INITIALIZED)[0];
        eglContractDeployBlockNumber = txReceipt.receipt.blockNumber;
        eglContractDeployGasLimit = (await web3.eth.getBlock(eglContractDeployBlockNumber)).gasLimit
    });

    describe.skip("Debug", function () {
        it("", async () => {
        });
    });

    describe("Initial Balances & Seed Accounts", function () {
        it("seed account tokens should be locked and not available to withdraw", async () => {
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
                    seedAccount[VoterAttributes.TOKENS_LOCKED],
                    web3.utils.toWei("2500000"),
                    "Incorrect seed account tokens locked"
                );
                assert.equal(
                    seedAccount[VoterAttributes.GAS_TARGET],
                    eglContractDeployGasLimit,
                    "Incorrect seed account gas target"
                );
                assert.equal(
                    seedAccount[VoterAttributes.DAO_RECIPIENT],
                    ZeroAddress,
                    "Incorrect seed account DAO recipient address"
                );
                assert.equal(
                    seedAccount[VoterAttributes.DAO_AMOUNT],
                    "0",
                    "Incorrect seed account DAO amount"
                );
                assert.equal(
                    seedAccount[VoterAttributes.UPGRADE_ADDRESS],
                    ZeroAddress,
                    "Incorrect seed account upgrade address"
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
                assert.equal(
                    uninitializedAccount[VoterAttributes.DAO_RECIPIENT],
                    ZeroAddress,
                    "Uninitialized account should not have an initial DAO recipient address"
                );
                assert.equal(
                    uninitializedAccount[VoterAttributes.DAO_AMOUNT],
                    "0",
                    "Uninitialized account should not have an initial DAO amount"
                );
                assert.equal(
                    uninitializedAccount[VoterAttributes.UPGRADE_ADDRESS],
                    ZeroAddress,
                    "Uninitialized account should not have an initial upgrade address"
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
                    ZeroAddress,
                    0,
                    ZeroAddress,
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
                    ZeroAddress,
                    0,
                    ZeroAddress,
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
                    ZeroAddress,
                    0,
                    ZeroAddress,
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
                ZeroAddress,
                0,
                ZeroAddress,
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
            assert.equal(
                voter[VoterAttributes.DAO_RECIPIENT],
                ZeroAddress,
                "Incorrect DAO recipient address stored after vote()"
            );
            assert.equal(
                voter[VoterAttributes.DAO_AMOUNT],
                "0",
                "Incorrect DAO amount stored after vote()"
            );
            assert.equal(
                voter[VoterAttributes.UPGRADE_ADDRESS],
                ZeroAddress,
                "Incorrect upgrade address stored after vote()"
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
                ZeroAddress,
                0,
                ZeroAddress,
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
                ZeroAddress,
                0,
                ZeroAddress,
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
                ZeroAddress,
                0,
                ZeroAddress,
                {from: _voter1}
            );
            await expectRevert(
                eglContractInstance.vote(
                    ValidGasTarget,
                    voteAmount.toString(),
                    1,
                    ZeroAddress,
                    0,
                    ZeroAddress,
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
                    ZeroAddress,
                    0,
                    ZeroAddress,
                    {from: _voter1}
                ),
                "EGL:INVALID_GAS_TARGET."
            );

            await expectRevert(
                eglContractInstance.vote(
                    InvalidGasTargetLow,
                    voteAmount.toString(),
                    1,
                    ZeroAddress,
                    0,
                    ZeroAddress,
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
                    ZeroAddress,
                    0,
                    ZeroAddress,
                    {from: _voter1}
                ),
                "EGL:INVALID_LOCKUP"
            );
            await expectRevert(
                eglContractInstance.vote(
                    ValidGasTarget,
                    voteAmount.toString(),
                    0,
                    ZeroAddress,
                    0,
                    ZeroAddress,
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
                ZeroAddress,
                0,
                ZeroAddress,
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
                ZeroAddress,
                0,
                ZeroAddress,
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
                ZeroAddress,
                0,
                ZeroAddress,
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
                ZeroAddress,
                0,
                ZeroAddress,
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
                ZeroAddress,
                0,
                ZeroAddress,
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
                ZeroAddress,
                0,
                ZeroAddress,
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
                    ZeroAddress,
                    0,
                    ZeroAddress,
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
                    ZeroAddress,
                    0,
                    ZeroAddress,
                    {from: _voter1}
                ),
                "EGL:AMNT_TOO_LOW"
            );

            await expectRevert(
                eglContractInstance.reVote(
                    ValidGasTarget,
                    web3.utils.toWei("100000000"),
                    1,
                    ZeroAddress,
                    0,
                    ZeroAddress,
                    {from: _voter1}
                ),
                "EGL:INSUFFICIENT_EGL_BALANCE"
            );

            await expectRevert(
                eglContractInstance.reVote(
                    ValidGasTarget,
                    web3.utils.toWei("30000000"),
                    1,
                    ZeroAddress,
                    0,
                    ZeroAddress,
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
        it("should set voting threshold to 5% for the first 26 epochs (6 months)", async () => {
            for (let i = 0; i <= 26; i++) {
                await time.increase(DefaultEpochLengthSeconds + 10);
                let txReceipt = await eglContractInstance.tallyVotes({ from: accounts[9] })
                let tallyVotesEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED)[0];
                assert.equal(web3.utils.fromWei(tallyVotesEvent.votingThreshold), "5", "Vote threshold should be 5%")
            }
        });
        it("should increase vote threshold by 10% per year to a max of 50% (runs long)", async () => {
            let yearlyThreshold = 10;
            for (let i = 0; i <= 52 * 6; i++) {
                await time.increase(DefaultEpochLengthSeconds + 10);
                let txReceipt = await eglContractInstance.tallyVotes({ from: accounts[9] })
                if (i > 0 && i % 52 === 0) {
                    let tallyVotesEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTES_TALLIED)[0];
                    assert.equal(web3.utils.fromWei(tallyVotesEvent.votingThreshold), yearlyThreshold.toString(), "Vote threshold should be 5%")
                    yearlyThreshold = yearlyThreshold === 50 ? yearlyThreshold : yearlyThreshold + 10;
                }
            }
        });
        it("should pass vote if vote percentage greater than the vote threshold", async () => {
            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                web3.utils.toWei("50000000"),
                {from: _voter1}
            );

            let epochVoteTotal = await eglContractInstance.votesTotal(0);            
            await castSimpleVotes([ValidGasTarget, (parseFloat(web3.utils.fromWei(epochVoteTotal)) * 0.05).toString(), 1, _voter1]);
            await time.increase(DefaultEpochLengthSeconds + 10)
            let txReceipt = await eglContractInstance.tallyVotes({ from: accounts[9] })

            let votesThresholdMetEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_MET)[0];
            assert.isAtLeast(parseFloat(web3.utils.fromWei(votesThresholdMetEvent.actualVotePercentage)), 5, "Vote percentage should be above 5%")
            assert.exists(votesThresholdMetEvent, "Expected 'VoteThresholdMet' event");

        });
        it("should fail vote if vote percentage less than the vote threshold", async () => {
            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                web3.utils.toWei("50000000"),
                {from: _voter1}
            );

            let epochVoteTotal = await eglContractInstance.votesTotal(0);            
            await castSimpleVotes([ValidGasTarget, (parseFloat(web3.utils.fromWei(epochVoteTotal)) * 0.0499).toString(), 1, _voter1]);
            await time.increase(DefaultEpochLengthSeconds + 10)
            let txReceipt = await eglContractInstance.tallyVotes({ from: accounts[9] })

            let votesThresholdFailedEvent = await populateAllEventDataFromLogs(txReceipt, EventType.VOTE_THRESHOLD_FAILED)[0];
            assert.isBelow(parseFloat(web3.utils.fromWei(votesThresholdFailedEvent.actualVotePercentage)), 5, "Vote percentage should be below 5%")
            assert.exists(votesThresholdFailedEvent, "Expected 'VoteThresholdFailed' event");
        });
        it("should adjust EGL to average gas target value if vote passes", async () => {
            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                web3.utils.toWei("50000000"),
                {from: _voter1}
            );

            let epochVoteTotal = await eglContractInstance.votesTotal(0);            
            await castSimpleVotes([9000000, (parseFloat(web3.utils.fromWei(epochVoteTotal)) * 0.2).toString(), 8, _voter1]);
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
            let epochVoteTotal = await eglContractInstance.votesTotal(0);            
            await castSimpleVotes(
                [10500000, (parseFloat(web3.utils.fromWei(epochVoteTotal)) * 0.06).toString(), 1, _voter1],
                [10500000, (parseFloat(web3.utils.fromWei(epochVoteTotal)) * 0.06).toString(), 1, _voter2],
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
            let epochVoteTotal = await eglContractInstance.votesTotal(0);            
            await castSimpleVotes(
                [10500000, (parseFloat(web3.utils.fromWei(epochVoteTotal)) * 0.06).toString(), 1, _voter1],
                [10500000, (parseFloat(web3.utils.fromWei(epochVoteTotal)) * 0.06).toString(), 1, _voter2],
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
            assert.equal(votesThresholdFailedEvent.desiredEgl.toString(), expectedDesiredEgl.toString(), "Incorrect desired EGL after failed vote");
        });
        it.skip("should cleanup voting variables", async () => {
            let epochStart = await eglContractInstance.currentEpochStartDate();
            eglTokenInstance.increaseAllowance(
                eglContractInstance.address,
                web3.utils.toWei("50000000"),
                {from: _voter1}
            );

            await castSimpleVotes([ValidGasTarget, "10", 2, _voter1]);
            
            console.log("Current Epoch: ", (await eglContractInstance.currentEpoch()).toString());
            for (let i = 0; i < 5; i++) {
                await time.increase(DefaultEpochLengthSeconds)
                await eglContractInstance.tallyVotes({ from: accounts[9] })
            }

            console.log("Current Epoch after 6 tally votes: ", (await eglContractInstance.currentEpoch()).toString());

            let tallyVoteEvents = await getAllEventsForType(EventType.VOTES_TALLIED, eglContractInstance);
            let voteThresholdFailedEvents = await getAllEventsForType(EventType.VOTE_THRESHOLD_FAILED, eglContractInstance);
            let latestTallyVoteEvent = tallyVoteEvents[tallyVoteEvents.length - 1];
            let latestVoteThresholdFailedEvent = voteThresholdFailedEvents[voteThresholdFailedEvents.length - 1];

            console.log("Vote Percentage: ", web3.utils.fromWei(latestTallyVoteEvent.actualVotePercentage));

            console.log("Caller: ", latestVoteThresholdFailedEvent.caller.toString())
            console.log("CurrentEpoch: ", latestVoteThresholdFailedEvent.currentEpoch.toString())
            console.log("desiredEgl: ", latestVoteThresholdFailedEvent.desiredEgl.toString())
            console.log("voteThreshold: ", latestVoteThresholdFailedEvent.voteThreshold.toString())
            console.log("actualVotePercentage: ", latestVoteThresholdFailedEvent.actualVotePercentage.toString())
            console.log("baselineEgl: ", latestVoteThresholdFailedEvent.baselineEgl.toString())
            console.log("initialEgl: ", latestVoteThresholdFailedEvent.initialEgl.toString())
            console.log("timeSinceFirstEpoch: ", latestVoteThresholdFailedEvent.timeSinceFirstEpoch.toString())
            console.log("gracePeriodSeconds: ", latestVoteThresholdFailedEvent.gracePeriodSeconds.toString())

            // console.log(tallyVoteEvents[EventType.VOTE_THRESHOLD_MET])
            assert.exists(latestTallyVoteEvent, "Expected VoteThresholdMet event");
            // assert.notExists(
            //     tallyVoteEvents[EventType.CREATOR_REWARDS_CLAIMED],
            //     "Unexpect CreatorRewardsClaimed event"
            // );

            // let gasLimitSum = new BN(
            //     tallyVoteEvents[EventType.VOTE_THRESHOLD_MET].gasLimitSum
            // );
            // let voteCount = new BN(
            //     tallyVoteEvents[EventType.VOTE_THRESHOLD_MET].voteCount
            // );
            // let expectedEgl = gasLimitSum.div(voteCount);
            // assert.equal(
            //     tallyVoteEvents[EventType.VOTES_TALLIED].desiredEgl.toString(),
            //     expectedEgl.toString(),
            //     "Incorrect desired EGL amount after tally votes"
            // );
            // assert.equal(
            //     tallyVoteEvents[EventType.VOTES_TALLIED].currentEpoch.toString(),
            //     "0",
            //     "Incorrect next epoch"
            // );
            // assert.equal(
            //     tallyVoteEvents[EventType.VOTES_TALLIED].votingThreshold.toString(),
            //     web3.utils.toWei("10"),
            //     "Incorrect voting threshold"
            // );

            // assert.equal(
            //     (await eglContractInstance.currentEpochStartDate()).toString(),
            //     parseInt(epochStart) + DefaultEpochLengthSeconds,
            //     "Incorrect start date for next epoch"
            // );

            // let expectedVoteWeightsSum = [
            //     web3.utils.toWei("200000020"),
            //     web3.utils.toWei("200000000"),
            //     web3.utils.toWei("200000000"),
            //     web3.utils.toWei("200000000"),
            //     web3.utils.toWei("200000000"),
            //     web3.utils.toWei("200000000"),
            //     web3.utils.toWei("200000000"),
            //     "0",
            // ];

            // let expectedVoteTotals = [
            //     web3.utils.toWei("25000010"),
            //     web3.utils.toWei("25000000"),
            //     web3.utils.toWei("25000000"),
            //     web3.utils.toWei("25000000"),
            //     web3.utils.toWei("25000000"),
            //     web3.utils.toWei("25000000"),
            //     web3.utils.toWei("25000000"),
            //     "0",
            // ];

            // let expectedVoteRewardSums = [
            //     web3.utils.toWei("200000020"),
            //     web3.utils.toWei("200000020"),
            //     web3.utils.toWei("200000000"),
            //     web3.utils.toWei("200000000"),
            //     web3.utils.toWei("200000000"),
            //     web3.utils.toWei("200000000"),
            //     web3.utils.toWei("200000000"),
            //     web3.utils.toWei("200000000"),
            // ];

            // for (let i = 0; i < 8; i++) {
            //     // Vote weight total for epoch
            //     assert.equal(
            //         (await eglContractInstance.voteWeightsSum(i)).toString(),
            //         expectedVoteWeightsSum[i],
            //         "Incorrect vote weight sum after tally votes - week " + i
            //     );

            //     // TODO: Test gasTargetSum

            //     // Votes total
            //     assert.equal(
            //         (await eglContractInstance.votesTotal(i)).toString(),
            //         expectedVoteTotals[i],
            //         "Incorrect votes totals after 1st tally votes- week " + i
            //     );

            //     // Voter reward sums
            //     assert.equal(
            //         (await eglContractInstance.voterRewardSums(i)).toString(),
            //         expectedVoteRewardSums[i],
            //         "Incorrect initial voter reward sums after 1st tally votes - week " +
            //         i
            //     );
            // }        
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
            assert.equal(creatorRewardEvent.amountClaimed.toString(), InitialCreatorReward, "Incorrect creator reward amount");    
        });
        it("should tally DAO votes if DAO vote percentage at least 20%", async () => {

        });
        it("should not tally DAO votes if EGL vote percentage over 20% but DAO vote percentage is below 20%", async () => {

        });
        it("should clear previous DAO winner variables if vote below 20%", async () => {

        });
        it("should tally upgrade votes if upgrade vote percentage at least 50%", async () => {

        });
        it("should not tally upgrade votes if EGL vote percentage over 50% but DAO vote percentage is below 50%", async () => {

        });
        it("should clear previous upgrade winner variables if vote below 50%", async () => {

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
                ValidGasTarget,
                "10",
                1,
                _voter1,
            ]);

            let voter = await eglContractInstance.voters(_voter1);
            let expectedReleaseDate =
                (await getBlockTimestamp(web3, voteTxReceipt)) + 2 * DefaultEpochLengthSeconds;
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
        it("sends token to coinbase account", async () => {
          let txReceipt = await eglContractInstance.sweepPoolRewards();
          let eventData = populateEventDataFromLogs(txReceipt, EventType.POOL_REWARD_SWEPT);
          console.log("blockReward: ", (eventData.blockReward).toString());
          console.log("proximityRewardPercent: ", (eventData.proximityRewardPercent).toString());
        });
    });
});