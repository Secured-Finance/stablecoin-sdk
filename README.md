# USDFC SDK

USDFC SDK is a comprehensive toolkit for developers to integrate and interact with USDFC.

## Summary

- [Protocol Overview](#protocol-overview)
- [SDK Structure](#sdk-structure)
- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Clone & Install](#clone--install)
  - [Top-level scripts](#top-level-scripts)
    - [Run all tests](#run-all-tests)
    - [Start dev-frontend in development mode](#start-dev-frontend-in-development-mode)
    - [Start dev-frontend against a mainnet fork RPC node](#start-dev-frontend-against-a-mainnet-fork-rpc-node)
    - [Build dev-frontend for production](#build-dev-frontend-for-production)
  - [Configuring your custom frontend](#configuring-your-custom-frontend)
- [Known Issues](#known-issues)

## Protocol Overview

USDFC protocol is a collateralized debt platform. Users can lock up FIL, and issue stablecoin tokens (USDFC) to their own Filecoin address, and subsequently transfer those tokens to any other Filecoin address. The individual collateralized debt positions are called Troves.

The stablecoin tokens are economically geared towards maintaining value of 1 USDFC = \$1 USD, due to the following properties:

1. The system is designed to always be over-collateralized - the dollar value of the locked FIL exceeds the dollar value of the issued stablecoins

2. The stablecoins are fully redeemable - users can always swap $x worth of USDFC for $x worth of FIL (minus fees), directly with the system.

3. The system algorithmically controls the generation of USDFC through a variable issuance fee.

After opening a Trove with some FIL, users may issue ("borrow") tokens such that the collateralization ratio of their Trove remains above 110%. A user with $1000 worth of FIL in a Trove can issue up to 909.09 USDFC.

The tokens are freely exchangeable - anyone with a Filecoin address can send or receive USDFC tokens, whether they have an open Trove or not. The tokens are burned upon repayment of a Trove's debt.

The USDFC system regularly updates the FIL:USD price via a decentralized data feed. When a Trove falls below a minimum collateralization ratio (MCR) of 110%, it is considered under-collateralized, and is vulnerable to liquidation.

## SDK Structure

- `packages/dev-frontend/` – USDFC Developer UI: a fully functional React app used for interfacing with the smart contracts during development
- `packages/fuzzer/` – A very simple, purpose-built tool based on USDFC middleware for randomly interacting with the system
- `packages/lib-base/` – Common interfaces and classes shared by the other `lib-` packages
- `packages/lib-ethers/` – [Ethers](https://github.com/ethers-io/ethers.js/)-based middleware that can read USDFC state and send transactions
- `packages/lib-react/` – Components and hooks that React-based apps can use to view USDFC contract state
- `packages/lib-subgraph/` – [Apollo Client](https://github.com/apollographql/apollo-client)-based middleware backed by the USDFC subgraph that can read USDFC state
- `packages/subgraph/` – [Subgraph](https://thegraph.com) for querying USDFC state as well as historical data like transaction history

Backend development is done in the Hardhat framework, and allows USDFC to be deployed on the Hardhat EVM network for fast compilation and test execution.

## Development

This monorepo is based on npm's feature. You might be able to install some of the packages individually with npm, but to make all interdependent packages see each other, you'll need to use npm.

### Prerequisites

You'll need to install the following:

- [Git](https://help.github.com/en/github/getting-started-with-github/set-up-git)
- [Node v20.x](https://nodejs.org/dist/latest-v20.x/)

### Clone & Install

```
git clone https://github.com/Secured-Finance/stablecoin-sdk.git
cd stablecoin-sdk
npm install
```

### Top-level scripts

There are a number of scripts in the top-level package.json file to ease development, which you can run with npm.

#### Run all tests

```
npm run test
```

#### Start dev-frontend in development mode

```
npm run start-dev-frontend
```

This will start dev-frontend in development mode on http://localhost:3000. The app will automatically be reloaded if you change a source file under `packages/dev-frontend`.

If you make changes to a different package under `packages`, it is recommended to rebuild the entire project with `npm run prepare` in the root directory of the repo. This makes sure that a change in one package doesn't break another.

To stop the dev-frontend running in this mode, bring up the terminal in which you've started the command and press Ctrl+C.

#### Start dev-frontend against a mainnet fork RPC node

This will start a hardhat mainnet forked RPC node at the block number configured in `hardhat.config.mainnet-fork.ts`, so you need to make sure you're not running a hardhat node on port 8545 already.

You'll need an Alchemy API key to create the fork.

```
ALCHEMY_API_KEY=enter_your_key_here npm run start-fork
```

```
npm run start-demo:dev-frontend
```

This spawns a modified version of dev-frontend that automatically signs transactions so you don't need to interact with a browser wallet. It directly uses the local forked RPC node.

You may need to wait a minute or so for your fork mainnet provider to load and cache all the blockchain state at your chosen block number. Refresh the page after 5 minutes.

#### Build dev-frontend for production

In a freshly cloned & installed monorepo, or if you have only modified code inside the dev-frontend package:

```
npm run build
```

If you have changed something in one or more packages apart from dev-frontend, it's best to use:

```
npm run rebuild
```

This combines the top-level `prepare` and `build` scripts.

You'll find the output in `packages/dev-frontend/build`.

### Configuring your custom frontend

Your custom built frontend can be configured by putting a file named `config.json` inside the same directory as `index.html` built in the previous step. The format of this file is:

```
{
  "frontendTag": "0xDBA767F3DFF3835BEf5dE1eDEe91A9901402AB21",
  "ankrApiKey": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

## Known Issues

### Temporary and slightly inaccurate TCR calculation within `batchLiquidateTroves` in Recovery Mode.

When liquidating a trove with `ICR > 110%`, a collateral surplus remains claimable by the borrower. This collateral surplus should be excluded from subsequent TCR calculations, but within the liquidation sequence in `batchLiquidateTroves` in Recovery Mode, it is not. This results in a slight distortion to the TCR value used at each step of the liquidation sequence going forward. This distortion only persists for the duration the `batchLiquidateTroves` function call, and the TCR is again calculated correctly after the liquidation sequence ends. In most cases there is no impact at all, and when there is, the effect tends to be minor. The issue is not present at all in Normal Mode.

There is a theoretical and extremely rare case where it incorrectly causes a loss for Stability Depositors instead of a gain. It relies on the stars aligning: the system must be in Recovery Mode, the TCR must be very close to the 150% boundary, a large trove must be liquidated, and the FIL price must drop by >10% at exactly the right moment. No profitable exploit is possible. For more details, please see [this security advisory](https://github.com/liquity/dev/security/advisories/GHSA-xh2p-7p87-fhgh) in the Liquity's repository.

### SortedTroves edge cases - top and bottom of the sorted list

When the trove is at one end of the `SortedTroves` list and adjusted such that its ICR moves further away from its neighbor, `findInsertPosition` returns unhelpful positional hints, which if used can cause the `adjustTrove` transaction to run out of gas. This is due to the fact that one of the returned addresses is in fact the address of the trove to move - however, at re-insertion, it has already been removed from the list. As such the insertion logic defaults to `0x0` for that hint address, causing the system to search for the trove starting at the opposite end of the list. A workaround is possible, and this has been corrected in the SDK used by front ends.

### Front-running issues

#### Loss evasion by front-running Stability Pool depositors

_Example sequence 1): evade liquidation tx_

- Depositor sees incoming liquidation tx that would cause them a net loss
- Depositor front-runs with `withdrawFromSP()` to evade the loss

_Example sequence 2): evade price drop_

- Depositor sees incoming price drop tx (or just anticipates one, by reading exchange price data), that would shortly be followed by unprofitable liquidation txs
- Depositor front-runs with `withdrawFromSP()` to evade the loss

Stability Pool depositors expect to make profits from liquidations which are likely to happen at a collateral ratio slightly below 110%, but well above 100%. In rare cases (flash crashes, oracle failures), troves may be liquidated below 100% though, resulting in a net loss for stability depositors. Depositors thus have an incentive to withdraw their deposits if they anticipate liquidations below 100% (note that the exact threshold of such “unprofitable” liquidations will depend on the current Dollar price of USDFC).

As long the difference between two price feed updates is <10% and price stability is maintained, loss evasion situations should be rare.

In the current implementation, deposit withdrawals are prohibited if and while there are troves with a collateral ratio (ICR) < 110% in the system. This prevents loss evasion by front-running the liquidate transaction as long as there are troves that are liquidatable in normal mode.

This solution is only partially effective since it does not prevent stability depositors from monitoring the FIL price feed and front-running oracle price update transactions that would make troves liquidatable. Given that we expect loss-evasion opportunities to be very rare, we do not expect that a significant fraction of stability depositors would actually apply front-running strategies, which require sophistication and automation. In the unlikely event that a large fraction of the depositors withdraw shortly before the liquidation of troves at <100% CR, the redistribution mechanism will still be able to absorb defaults.

#### Reaping liquidation gains on the fly

_Example sequence:_

- User sees incoming profitable liquidation tx
- User front-runs it and immediately makes a deposit with `provideToSP()`
- User earns a profit

Front-runners could deposit funds to the Stability Pool on the fly (instead of keeping their funds in the pool) and make liquidation gains when they see a pending price update or liquidate transaction. They could even borrow the USDFC using a trove as a flash loan.

Such flash deposit-liquidations would actually be beneficial (in terms of TCR) to system health and prevent redistributions, since the pool can be filled on the spot to liquidate troves anytime, if only for the length of 1 transaction.

#### Front-running and changing the order of troves as a DoS attack

_Example sequence:_

- Attacker sees incoming operation(`openTrove()`, `redeemCollateral()`, etc) that would insert a trove to the sorted list
- Attacker front-runs with mass openTrove txs
- Incoming operation becomes more costly - more traversals needed for insertion

It’s theoretically possible to increase the number of the troves that need to be traversed on-chain. That is, an attacker that sees a pending borrower transaction (or redemption or liquidation transaction) could try to increase the number of traversed troves by introducing additional troves on the way. However, the number of troves that an attacker can inject before the pending transaction gets mined is limited by the amount of spendable gas. Also, the total costs of making the path longer by 1 are significantly higher (gas costs of opening a trove, plus the 0.5% borrowing fee) than the costs of one extra traversal step (simply reading from storage). The attacker also needs significant capital on-hand, since the minimum debt for a trove is 200 USDFC.

In case of a redemption, the “last” trove affected by the transaction may end up being only partially redeemed from, which means that its ICR will change so that it needs to be reinserted at a different place in the sorted trove list (note that this is not the case for partial liquidations in recovery mode, which preserve the ICR). A special ICR hint therefore needs to be provided by the transaction sender for that matter, which may become incorrect if another transaction changes the order before the redemption is processed. The protocol gracefully handles this by terminating the redemption sequence at the last fully redeemed trove.

An attacker trying to DoS redemptions could be bypassed by redeeming an amount that exactly corresponds to the debt of the affected trove(s).

The attack can be aggravated if a big trove is placed first in the queue, so that any incoming redemption is smaller than its debt, as no USDFC would be redeemed if the hint for that trove fails. But that attack would be very expensive and quite risky (risk of being redeemed if the strategy fails and of being liquidated as it may have a low CR).

Finally, this DoS could be avoided if the initial transaction avoids the public gas auction entirely and is sent direct-to-miner, via (for example) Flashbots.
