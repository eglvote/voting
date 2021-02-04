import Web3 from 'web3'

const resolveWeb3 = (resolve) => {
    let { web3 } = window
    const alreadyInjected = typeof web3 !== 'undefined' // i.e. Mist/Metamask
    const localProvider = `http://127.0.0.1:8545`

    if (alreadyInjected) {
        console.log(`Injected web3 detected.`)
        web3 = new Web3(web3.currentProvider)
    } else {
        console.log(`No web3 instance injected, using Local web3.`)
        const provider = new Web3.providers.HttpProvider(localProvider)
        web3 = new Web3(provider)
    }

    resolve(web3)
}

export default () =>
    new Promise((resolve) => {
        // Wait for loading completion to avoid race conditions with web3 injection timing.
        window.addEventListener(`load`, () => {
            resolveWeb3(resolve)
        })
        // If document has loaded already, try to get Web3 immediately.
        if (document.readyState === `complete`) {
            resolveWeb3(resolve)
        }
    })

//     const Web3 = require('web3'); // import web3 v1.0 constructor from node_modules
// if(window.ethereum) {
//     const web3Instance = new Web3(window['ethereum']);

//     var methods = {
//         getAddressETHBalance: function(address)    {
//             return new Promise(function(resolve, reject) {
//                 resolve(web3Instance.eth.getBalance(address));
//             });
//         }
//     };

//     methods.getAddressETHBalance(<ADDRESS>);
// } else {
//     alert('Missing MetaMask extention.');
// }
