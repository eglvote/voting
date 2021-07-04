const EglToken = artifacts.require("./EglToken.sol");

contract("EglTokenTests", (accounts) => {
    let totalTokenSupply;
    let eglTokenInstance;

    beforeEach(async () => {
        totalTokenSupply = web3.utils.toWei("4000000000");
        eglTokenInstance = await EglToken.new();
        await eglTokenInstance.initialize(accounts[1], "EthereumGasLimit", "EGL", totalTokenSupply);
    });

    describe("Token Supply", function () {
        it("should have a total supply of 4,000,000,000 tokens", async () => {
            let supplyLimit = await eglTokenInstance.totalSupply();
            assert.equal(
                supplyLimit.toString(), 
                web3.utils.toWei("4000000000"), 
                "Incorrect total token supply limit"
            );
        });

        it("should have a cap of 4,000,000,000 tokens", async () => {
            let tokenCap = await eglTokenInstance.cap();
            assert.equal(
                tokenCap.toString(),
                web3.utils.toWei("4000000000"),
                "Incorrect token cap"
            );
        });
        it("should have minted tokens to the correct account", async  () => {
            let tokenBalance = await eglTokenInstance.balanceOf(accounts[1]);
            assert.equal(
                tokenBalance.toString(), 
                web3.utils.toWei("4000000000"), 
                "Account does not have correct balance"
            );
        });
        it("should not transfer any tokens to deployer", async  () => {
            let deployerTokenBalance = await eglTokenInstance.balanceOf(accounts[0]);
            assert.equal(
                deployerTokenBalance.toString(), 
                "0", 
                "Deployer should not have a token balance"
            );
        });
    });

    describe.skip("Token Upgrade", function () {
        it("should upgrade to new implementation contract", async () => {
        });
    });
});