import Web3 from 'web3'

const resolveWeb3 = (resolve) => {
    let { web3 } = window

    const webSocketProvider = 'ws://127.0.0.1:7545'
    const alreadyInjected = typeof web3 !== 'undefined' // i.e. Mist/Metamask

    if (alreadyInjected) {
        console.log(`Injected web3 detected.`)
        web3 = new Web3(webSocketProvider)
    } else {
        console.log(`No web3 instance injected, using Local web3.`)
        const webSocketProvider = new Web3.providers.WebsocketProvider(
            webSocketProvider
        )

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
