# @secured-finance/stablecoin-lib-ethers

[Ethers](https://www.npmjs.com/package/ethers)-based library for reading protocol state and sending transactions.

## Quickstart

Install in your project:

```
npm install --save @secured-finance/stablecoin-lib-base @secured-finance/stablecoin-lib-ethers ethers@^5.0.0
```

Connecting to an Ethereum node and sending a transaction:

```javascript
const { Wallet, providers } = require("ethers");
const { EthersSfStablecoin } = require("@secured-finance/stablecoin-lib-ethers");

async function example() {
  const provider = new providers.JsonRpcProvider("http://localhost:8545");
  const wallet = new Wallet(process.env.PRIVATE_KEY).connect(provider);
  const sfStablecoin = await EthersSfStablecoin.connect(wallet);

  const { newTrove } = await sfStablecoin.openTrove({
    depositCollateral: 5, // FIL
    borrowDebtToken: 2000
  });

  console.log(`Successfully opened a Liquity Trove (${newTrove})!`);
}
```

## More examples

See [packages/examples](https://github.com/Secured-Finance/stablecoin-sdk/tree/main/packages/examples) in the repo.

[Dev UI](https://github.com/Secured-Finance/stablecoin-sdk/tree/main/packages/dev-frontend) itself contains many examples of `@secured-finance/stablecoin-lib-ethers` use.

## API Reference

For now, it can be found in the public [repo](https://github.com/Secured-Finance/stablecoin-sdk/blob/main/docs/sdk/lib-ethers.md).
