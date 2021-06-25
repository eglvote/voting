const EglToken = artifacts.require("./EglToken.sol");

contract("EglTokenTests", (accounts) => {
    let totalTokenSupply;
    let eglTokenInstance;

    beforeEach(async () => {
        totalTokenSupply = web3.utils.toWei("4000000000");
        eglTokenInstance = await EglToken.new();
        await eglTokenInstance.initialize("EthereumGasLimit", "EGL", totalTokenSupply);
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
    });

    describe.skip("Token Upgrade", function () {
        it("should upgrade to new implementation contract", async () => {
        });
    });
});