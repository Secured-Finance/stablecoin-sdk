# USDFC SDK

USDFC SDK is a comprehensive toolkit for developers to integrate and interact with USDFC.

## Summary

- [Protocol Overview](#protocol-overview)
- [Liquidation and the Stability Pool](#liquidation-and-the-stability-pool)
  - [Liquidation gas costs](#liquidation-gas-costs)
  - [Liquidation Logic](#liquidation-logic)
    - [Liquidations in Normal Mode: TCR >= 150%](#liquidations-in-normal-mode-tcr--150)
    - [Liquidations in Recovery Mode: TCR < 150%](#liquidations-in-recovery-mode-tcr--150)
- [Gains From Liquidations](#gains-from-liquidations)
- [USDFC Token Redemption](#usdfc-token-redemption)
  - [Partial redemption](#partial-redemption)
  - [Full redemption](#full-redemption)
  - [Redemptions create a price floor](#redemptions-create-a-price-floor)
- [Recovery Mode](#recovery-mode)
- [Project Structure](#project-structure)
  - [Directories](#directories)
- [SFC Token Architecture](#sfc-token-architecture)
  - [SFC Lockup contracts and token vesting](#sfc-lockup-contracts-and-token-vesting)
  - [Lockup Implementation and admin transfer restriction](#lockup-implementation-and-admin-transfer-restriction)
  - [Launch sequence and vesting process](#launch-sequence-and-vesting-process)
    - [Deploy SFC Contracts](#deploy-sfc-contracts)
    - [Deploy and fund Lockup Contracts](#deploy-and-fund-lockup-contracts)
    - [Deploy USDFC protocol Core](#deploy-usdfc-protocol-core)
    - [During one year lockup period](#during-one-year-lockup-period)
    - [Upon end of one year lockup period](#upon-end-of-one-year-lockup-period)
    - [Post-lockup period](#post-lockup-period)
- [Core System Architecture](#core-system-architecture)
  - [Core Smart Contracts](#core-smart-contracts)
  - [Data and Value Silo Contracts](#data-and-value-silo-contracts)
  - [Contract Interfaces](#contract-interfaces)
  - [PriceFeed and Oracle](#pricefeed-and-oracle)
  - [PriceFeed Logic](#pricefeed-logic)
  - [Testnet PriceFeed and PriceFeed tests](#testnet-pricefeed-and-pricefeed-tests)
  - [PriceFeed limitations and known issues](#pricefeed-limitations-and-known-issues)
  - [Keeping a sorted list of Troves ordered by ICR](#keeping-a-sorted-list-of-troves-ordered-by-icr)
  - [Flow of FIL in USDFC protocol](#flow-of-fil-in-usdfc-protocol)
  - [Flow of USDFC tokens in USDFC protocol](#flow-of-usdfc-tokens-in-usdfc-protocol)
  - [Flow of SFC Tokens in USDFC protocol](#flow-of-sfc-tokens-in-usdfc-protocol)
- [Expected User Behaviors](#expected-user-behaviors)
- [Contract Ownership and Function Permissions](#contract-ownership-and-function-permissions)
- [Deployment to a Development Blockchain](#deployment-to-a-development-blockchain)
- [Running Tests](#running-tests)
  - [Brownie Tests](#brownie-tests)
  - [OpenEthereum](#openethereum)
- [System Quantities - Units and Representation](#system-quantities---units-and-representation)
  - [Integer representations of decimals](#integer-representations-of-decimals)
- [Public Data](#public-data)
- [Public User-Facing Functions](#public-user-facing-functions)
  - [Borrower (Trove) Operations - `BorrowerOperations.sol`](#borrower-trove-operations---borroweroperationssol)
  - [TroveManager Functions - `TroveManager.sol`](#trovemanager-functions---trovemanagersol)
  - [Hint Helper Functions - `HintHelpers.sol`](#hint-helper-functions---hinthelperssol)
  - [Stability Pool Functions - `StabilityPool.sol`](#stability-pool-functions---stabilitypoolsol)
  - [SFC Staking Functions `ProtocolTokenStaking.sol`](#sfc-staking-functions--sfcstakingsol)
  - [Lockup Contract Factory `LockupContractFactory.sol`](#lockup-contract-factory-lockupcontractfactorysol)
  - [Lockup contract - `LockupContract.sol`](#lockup-contract---lockupcontractsol)
  - [USDFC token `DebtToken.sol` and SFC token `SFCToken.sol`](#usdfc-token-debttokensol-and-sfc-token-sfctokensol)
- [Supplying Hints to Trove operations](#supplying-hints-to-trove-operations)
  - [Hints for `redeemCollateral`](#hints-for-redeemcollateral)
    - [First redemption hint](#first-redemption-hint)
    - [Partial redemption hints](#partial-redemption-hints)
- [Gas compensation](#gas-compensation)
  - [Gas compensation schedule](#gas-compensation-schedule)
  - [Liquidation](#liquidation)
  - [Gas compensation and redemptions](#gas-compensation-and-redemptions)
  - [Gas compensation helper functions](#gas-compensation-helper-functions)
- [The Stability Pool](#the-stability-pool)
  - [Mixed liquidations: offset and redistribution](#mixed-liquidations-offset-and-redistribution)
  - [Stability Pool deposit losses and FIL gains - implementation](#stability-pool-deposit-losses-and-fil-gains---implementation)
  - [Stability Pool example](#stability-pool-example)
  - [Stability Pool implementation](#stability-pool-implementation)
  - [How deposits and FIL gains are tracked](#how-deposits-and-fil-gains-are-tracked)
- [SFC Issuance to Stability Providers](#sfc-issuance-to-stability-providers)
  - [SFC Issuance schedule](#sfc-issuance-schedule)
  - [SFC Issuance implementation](#sfc-issuance-implementation)
  - [Handling the front end SFC gain](#handling-the-front-end-sfc-gain)
  - [SFC reward events and payouts](#sfc-reward-events-and-payouts)
- [SFC issuance to usdfc providers](#sfc-issuance-to-usdfc-providers)
- [USDFC System Fees](#usdfc-system-fees)
  - [Redemption Fee](#redemption-fee)
  - [Issuance fee](#issuance-fee)
  - [Fee Schedule](#fee-schedule)
  - [Intuition behind fees](#intuition-behind-fees)
  - [Fee decay Implementation](#fee-decay-implementation)
  - [Staking SFC and earning fees](#staking-sfc-and-earning-fees)
- [Redistributions and Corrected Stakes](#redistributions-and-corrected-stakes)
  - [Corrected Stake Solution](#corrected-stake-solution)
- [Math Proofs](#math-proofs)
- [Definitions](#definitions)
- [Development](#development)
  - [Prerequisites](#prerequisites)
    - [Making node-gyp work](#making-node-gyp-work)
  - [Clone & Install](#clone--install)
  - [Top-level scripts](#top-level-scripts)
    - [Run all tests](#run-all-tests)
    - [Deploy contracts to a testnet](#deploy-contracts-to-a-testnet)
    - [Start a local blockchain and deploy the contracts](#start-a-local-blockchain-and-deploy-the-contracts)
    - [Start dev-frontend in development mode](#start-dev-frontend-in-development-mode)
    - [Start dev-frontend against a mainnet fork RPC node](#start-dev-frontend-against-a-mainnet-fork-rpc-node)
    - [Build dev-frontend for production](#build-dev-frontend-for-production)
  - [Configuring your custom frontend](#configuring-your-custom-dev-ui)
- [Known Issues](#known-issues)
  - [Front-running issues](#front-running-issues)
- [Disclaimer](#disclaimer)

## Protocol Overview

USDFC protocol is a collateralized debt platform. Users can lock up FIL, and issue stablecoin tokens (USDFC) to their own Filecoin address, and subsequently transfer those tokens to any other Filecoin address. The individual collateralized debt positions are called Troves.

The stablecoin tokens are economically geared towards maintaining value of 1 USDFC = \$1 USD, due to the following properties:

1. The system is designed to always be over-collateralized - the dollar value of the locked FIL exceeds the dollar value of the issued stablecoins

2. The stablecoins are fully redeemable - users can always swap $x worth of USDFC for $x worth of FIL (minus fees), directly with the system.

3. The system algorithmically controls the generation of USDFC through a variable issuance fee.

After opening a Trove with some FIL, users may issue ("borrow") tokens such that the collateralization ratio of their Trove remains above 110%. A user with $1000 worth of FIL in a Trove can issue up to 909.09 USDFC.

The tokens are freely exchangeable - anyone with a Filecoin address can send or receive USDFC tokens, whether they have an open Trove or not. The tokens are burned upon repayment of a Trove's debt.

The USDFC system regularly updates the FIL:USD price via a decentralized data feed. When a Trove falls below a minimum collateralization ratio (MCR) of 110%, it is considered under-collateralized, and is vulnerable to liquidation.

## Liquidation and the Stability Pool

USDFC protocol utilizes a two-step liquidation mechanism in the following order of priority:

1. Offset under-collateralized Troves against the Stability Pool containing USDFC tokens
2. Redistribute under-collateralized Troves to other borrowers if the Stability Pool is emptied

USDFC protocol primarily uses the USDFC tokens in its Stability Pool to absorb the under-collateralized debt, i.e. to repay the liquidated borrower's liability.

Any user may deposit USDFC tokens to the Stability Pool. This allows them to earn the collateral from the liquidated Trove. When a liquidation occurs, the liquidated debt is cancelled with the same amount of USDFC in the Pool (which is burned as a result), and the liquidated FIL is proportionally distributed to depositors.

Stability Pool depositors can expect to earn net gains from liquidations, as in most cases, the value of the liquidated FIL will be greater than the value of the cancelled debt (since a liquidated Trove will likely have an ICR just slightly below 110%).

If the liquidated debt is higher than the amount of USDFC in the Stability Pool, the system tries to cancel as much debt as possible with the tokens in the Stability Pool, and then redistributes the remaining liquidated collateral and debt across all active Troves.

Anyone may call the public `liquidateTroves()` function, which will check for under-collateralized Troves, and liquidate them. Alternatively they can call `batchLiquidateTroves()` with a custom list of trove addresses to attempt to liquidate.

### Liquidation gas costs

Currently, mass liquidations performed via the above functions cost 60-65k gas per trove. Thus the system can liquidate up to a maximum of 95-105 troves in a single transaction.

### Liquidation Logic

The precise behavior of liquidations depends on the ICR of the Trove being liquidated and global system conditions: the total collateralization ratio (TCR) of the system, the size of the Stability Pool, etc.

Here is the liquidation logic for a single Trove in Normal Mode and Recovery Mode. `SP.USDFC` represents the USDFC in the Stability Pool.

#### Liquidations in Normal Mode: TCR >= 150%

| Condition                          | Liquidation behavior                                                                                                                                                                                                                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ICR < MCR & SP.USDFC >= trove.debt | USDFC in the StabilityPool equal to the Trove’s debt is offset with the Trove’s debt. The Trove’s FIL collateral is shared between depositors.                                                                                                                                                                      |
| ICR < MCR & SP.USDFC < trove.debt  | The total StabilityPool USDFC is offset with an equal amount of debt from the Trove. A fraction of the Trove’s collateral (equal to the ratio of its offset debt to its entire debt) is shared between depositors. The remaining debt and collateral (minus FIL gas compensation) is redistributed to active Troves |
| ICR < MCR & SP.USDFC = 0           | Redistribute all debt and collateral (minus FIL gas compensation) to active Troves.                                                                                                                                                                                                                                 |
| ICR >= MCR                         | Do nothing.                                                                                                                                                                                                                                                                                                         |

#### Liquidations in Recovery Mode: TCR < 150%

| Condition                                 | Liquidation behavior                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ICR <=100%                                | Redistribute all debt and collateral (minus FIL gas compensation) to active Troves.                                                                                                                                                                                                                                                                                                    |
| 100% < ICR < MCR & SP.USDFC > trove.debt  | USDFC in the StabilityPool equal to the Trove’s debt is offset with the Trove’s debt. The Trove’s FIL collateral (minus FIL gas compensation) is shared between depositors.                                                                                                                                                                                                            |
| 100% < ICR < MCR & SP.USDFC < trove.debt  | The total StabilityPool USDFC is offset with an equal amount of debt from the Trove. A fraction of the Trove’s collateral (equal to the ratio of its offset debt to its entire debt) is shared between depositors. The remaining debt and collateral (minus FIL gas compensation) is redistributed to active troves                                                                    |
| MCR <= ICR < TCR & SP.USDFC >= trove.debt | The Pool USDFC is offset with an equal amount of debt from the Trove. A fraction of FIL collateral with dollar value equal to `1.1 * debt` is shared between depositors. Nothing is redistributed to other active Troves. Since its ICR was > 1.1, the Trove has a collateral remainder, which is sent to the `CollSurplusPool` and is claimable by the borrower. The Trove is closed. |
| MCR <= ICR < TCR & SP.USDFC < trove.debt  | Do nothing.                                                                                                                                                                                                                                                                                                                                                                            |
| ICR >= TCR                                | Do nothing.                                                                                                                                                                                                                                                                                                                                                                            |
|                                           |

## Gains From Liquidations

Stability Pool depositors gain Filecoin over time, as liquidated debt is canceled with their deposit. When they withdraw all or part of their deposited tokens, or top up their deposit, the system sends them their accumulated FIL gains.

Similarly, a Trove’s accumulated gains from liquidations are automatically applied to the Trove when the owner performs any operation – e.g. adding/withdrawing collateral, or issuing/repaying USDFC.

## USDFC Token Redemption

Any USDFC holder (whether or not they have an active Trove) may redeem their USDFC directly with the system. Their USDFC is exchanged for FIL, at face value: redeeming x USDFC tokens returns \$x worth of FIL (minus a [redemption fee](#redemption-fee)).

When USDFC is redeemed for FIL, the system cancels the USDFC with debt from Troves, and the FIL is drawn from their collateral.

In order to fulfill the redemption request, Troves are redeemed from in ascending order of their collateralization ratio.

A redemption sequence of `n` steps will **fully** redeem from up to `n-1` Troves, and **partially** redeems from up to 1 Trove, which is always the last Trove in the redemption sequence.

Redemptions are blocked when TCR < 110% (there is no need to restrict ICR < TCR). At that TCR redemptions would likely be unprofitable, as USDFC is probably trading above $1 if the system has crashed that badly, but it could be a way for an attacker with a lot of USDFC to lower the TCR even further.

Note that redemptions are disabled during the first 14 days of operation since deployment of the USDFC protocol to protect the monetary system in its infancy.

### Partial redemption

Most redemption transactions will include a partial redemption, since the amount redeemed is unlikely to perfectly match the total debt of a series of Troves.

The partially redeemed Trove is re-inserted into the sorted list of Troves, and remains active, with reduced collateral and debt.

### Full redemption

A Trove is defined as “fully redeemed from” when the redemption has caused (debt-20) of its debt to absorb (debt-20) USDFC. Then, its 20 USDFC Liquidation Reserve is cancelled with its remaining 20 debt: the Liquidation Reserve is burned from the gas address, and the 20 debt is zero’d.

Before closing, we must handle the Trove’s **collateral surplus**: that is, the excess FIL collateral remaining after redemption, due to its initial over-collateralization.

This collateral surplus is sent to the `CollSurplusPool`, and the borrower can reclaim it later. The Trove is then fully closed.

### Redemptions create a price floor

Economically, the redemption mechanism creates a hard price floor for USDFC, ensuring that the market price stays at or near to \$1 USD.

## Recovery Mode

Recovery Mode kicks in when the total collateralization ratio (TCR) of the system falls below 150%.

During Recovery Mode, liquidation conditions are relaxed, and the system blocks borrower transactions that would further decrease the TCR. New USDFC may only be issued by adjusting existing Troves in a way that improves their ICR, or by opening a new Trove with an ICR of >=150%. In general, if an existing Trove’s adjustment reduces its ICR, the transaction is only executed if the resulting TCR is above 150%.

Recovery Mode is structured to incentivize borrowers to behave in ways that promptly raise the TCR back above 150%, and to incentivize USDFC holders to replenish the Stability Pool.

Economically, Recovery Mode is designed to encourage collateral top-ups and debt repayments, and also itself acts as a self-negating deterrent: the possibility of it occurring actually guides the system away from ever reaching it.

## Project Structure

### Directories

- `packages/dev-frontend/` – USDFC Developer UI: a fully functional React app used for interfacing with the smart contracts during development
- `packages/fuzzer/` – A very simple, purpose-built tool based on USDFC middleware for randomly interacting with the system
- `packages/lib-base/` – Common interfaces and classes shared by the other `lib-` packages
- `packages/lib-ethers/` – [Ethers](https://github.com/ethers-io/ethers.js/)-based middleware that can read USDFC state and send transactions
- `packages/lib-react/` – Components and hooks that React-based apps can use to view USDFC contract state
- `packages/lib-subgraph/` – [Apollo Client](https://github.com/apollographql/apollo-client)-based middleware backed by the USDFC subgraph that can read USDFC state
- `packages/subgraph/` – [Subgraph](https://thegraph.com) for querying USDFC state as well as historical data like transaction history

Backend development is done in the Hardhat framework, and allows USDFC to be deployed on the Hardhat EVM network for fast compilation and test execution.

## SFC Token Architecture

The USDFC system incorporates a secondary token, SFC. This token entitles the holder to a share of the system revenue generated by redemption fees and issuance fees.

To earn a share of system fees, the SFC holder must stake their SFC in a staking contract.

USDFC also issues SFC to Stability Providers, in a continuous time-based manner.

The SFC contracts consist of:

- `ProtocolTokenStaking.sol` – the staking contract, containing stake and unstake functionality for SFC holders. This contract receives FIL fees from redemptions, and USDFC fees from new debt issuance.

- `CommunityIssuance.sol` – This contract handles the issuance of SFC tokens to Stability Providers as a function of time. It is controlled by the `StabilityPool`. After system launch, the `CommunityIssuance` can receive SFC anytime. The contract steadily issues the received SFC tokens to the Stability Providers over time.

- `ProtocolToken.sol` – This is the SFC ERC20 contract. There is no cap on the supply, which is minted by the `triggerInitialAllocation()` and `triggerAnnualAllocation()` functions.

### SFC Lockup contracts and token vesting

Some SFC is reserved for team members and partners, and is locked up for one year upon system launch. Additionally, some team members receive SFC vested on a monthly basis, which during the first year, is transferred directly to their lockup contract.

In the first year after launch:

- All team members and partners are unable to access their locked up SFC tokens

- The USDFC admin address may transfer tokens **only to verified lockup contracts with an unlock date at least one year after system deployment**

Also, separate SFC allocations are made at deployment to an EOA that will hold an amount of SFC for bug bounties/hackathons and to a Uniswap LP reward contract. Aside from these allocations, the only SFC made freely available in this first year is the SFC that is publicly issued to Stability Providers via the `CommunityIssuance` contract.

### Lockup Implementation and admin transfer restriction

A `LockupContractFactory` is used to deploy `LockupContracts` in the first year.

### Launch sequence and vesting process

#### Deploy SFC Contracts

1. USDFC admin deploys `LockupContractFactory`
2. USDFC admin deploys `CommunityIssuance`
3. USDFC admin deploys `ProtocolTokenStaking`
4. USDFC admin creates a Pool in Uniswap for USDFC/FIL and deploys `Unipool` (LP rewards contract), which knows the address of the Pool
5. USDFC admin deploys `ProtocolToken`, which upon deployment:

   - Stores the `CommunityIssuance` and `LockupContractFactory` addresses
   - Mints SFC tokens to `CommunityIssuance`, the USDFC admin address, the `Unipool` LP rewards address, and the bug bounty address

6. USDFC admin sets `ProtocolToken` address in `LockupContractFactory`, `CommunityIssuance`, `ProtocolTokenStaking`, and `Unipool`

#### Deploy and fund Lockup Contracts

7. USDFC admin tells `LockupContractFactory` to deploy a `LockupContract` for each beneficiary, with an `unlockTime` set to exactly one year after system deployment
8. USDFC admin transfers SFC to each `LockupContract`, according to their entitlement

#### Deploy USDFC Core

9. USDFC admin deploys the USDFC core system
10. USDFC admin connects USDFC core system internally (with setters)
11. USDFC admin connects `ProtocolTokenStaking` to USDFC core contracts and `ProtocolToken`
12. USDFC admin connects `CommunityIssuance` to USDFC core contracts and `ProtocolToken`

## Core System Architecture

The core USDFC system consists of several smart contracts, which are deployable to the Filecoin blockchain.

All application logic and data is contained in these contracts – there is no need for a separate database or back end logic running on a web server. In effect, the Filecoin network is itself the USDFC back end. As such, all balances and contract data are public.

The three main contracts – `BorrowerOperations.sol`, `TroveManager.sol` and `StabilityPool.sol` – hold the user-facing public functions, and contain most of the internal system logic. Together they control Trove state updates and movements of Filecoin and USDFC tokens around the system.

### Core Smart Contracts

`BorrowerOperations.sol` – contains the basic operations by which borrowers interact with their Trove: Trove creation, FIL top-up / withdrawal, stablecoin issuance and repayment. It also sends issuance fees to the `ProtocolTokenStaking` contract. BorrowerOperations functions call in to TroveManager, telling it to update Trove state, where necessary. BorrowerOperations functions also call in to the various Pools, telling them to move Filecoin/Tokens between Pools or between Pool <> user, where necessary.

`TroveManager.sol` – contains functionality for liquidations and redemptions. It sends redemption fees to the `ProtocolTokenStaking` contract. Also contains the state of each Trove – i.e. a record of the Trove’s collateral and debt. TroveManager does not hold value (i.e. Filecoin / other tokens). TroveManager functions call in to the various Pools to tell them to move Filecoin/tokens between Pools, where necessary.

`TroveBase.sol` – Both TroveManager and BorrowerOperations inherit from the parent contract TroveBase, which contains some common functions related to Troves.

`ProtocolBase.sol` – TroveBase, StabilityPool, and HintHelpers inherit from the parent contract ProtocolBase, which contains global constants.

`StabilityPool.sol` – contains functionality for Stability Pool operations: making deposits, and withdrawing compounded deposits and accumulated FIL and SFC gains. Holds the USDFC Stability Pool deposits, and the FIL gains for depositors, from liquidations.

`DebtToken.sol` – the stablecoin token contract, which implements the ERC20 fungible token standard in conjunction with EIP-2612 and a mechanism that blocks (accidental) transfers to addresses like the StabilityPool and address(0) that are not supposed to receive funds through direct transfers. The contract mints, burns and transfers USDFC tokens.

`SortedTroves.sol` – a doubly linked list that stores addresses of Trove owners, sorted by their individual collateralization ratio (ICR). It inserts and re-inserts Troves at the correct position, based on their ICR.

`PriceFeed.sol` – Contains functionality for obtaining the current FIL:USD price, which the system uses for calculating collateralization ratios.

`HintHelpers.sol` – Helper contract, containing the read-only functionality for calculation of accurate hints to be supplied to borrower operations and redemptions.

### Data and Value Silo Contracts

Along with `StabilityPool.sol`, these contracts hold Filecoin and/or tokens for their respective parts of the system, and contain minimal logic:

`ActivePool.sol` - holds the total Filecoin balance and records the total stablecoin debt of the active Troves.

`DefaultPool.sol` - holds the total Filecoin balance and records the total stablecoin debt of the liquidated Troves that are pending redistribution to active Troves. If a Trove has pending fil/debt “rewards” in the DefaultPool, then they will be applied to the Trove when it next undergoes a borrower operation, a redemption, or a liquidation.

`CollSurplusPool.sol` - holds the ETH surplus from Troves that have been fully redeemed from as well as from Troves with an ICR > MCR that were liquidated in Recovery Mode. Sends the surplus back to the owning borrower, when told to do so by `BorrowerOperations.sol`.

`GasPool.sol` - holds the total USDFC liquidation reserves. USDFC is moved into the `GasPool` when a Trove is opened, and moved out when a Trove is liquidated or closed.

### Contract Interfaces

`ITroveManager.sol`, `IPool.sol` etc. These provide specification for a contract’s functions, without implementation. They are similar to interfaces in Java or C#.

### PriceFeed and Oracle

USDFC functions that require the most current FIL:USD price data fetch the price dynamically, as needed, via the core `PriceFeed.sol` contract using the Chainlink FIL:USD reference contract as its primary and Tellor’s FIL:USD price feed as its secondary (fallback) data source. PriceFeed is stateful, i.e. it records the last good price that may come from either of the two sources based on the contract’s current state.

The fallback logic distinguishes 3 different failure modes for Chainlink and 2 failure modes for Tellor:

- `Frozen` (for both oracles): last price update more than 4 hours ago
- `Broken` (for both oracles): response call reverted, invalid timeStamp that is either 0 or in the future, or reported price is non-positive (Chainlink) or zero (Tellor). Chainlink is considered broken if either the response for the latest round _or_ the response for the round before the latest fails one of these conditions.
- `PriceChangeAboveMax` (Chainlink only): higher than 50% deviation between two consecutive price updates

There is also a return condition `bothOraclesLiveAndUnbrokenAndSimilarPrice` which is a function returning true if both oracles are live and not broken, and the percentual difference between the two reported prices is below 5%.

The current `PriceFeed.sol` contract has an external `fetchPrice()` function that is called by core USDFC functions which require a current FIL:USD price. `fetchPrice()` calls each oracle’s proxy, asserts on the responses, and converts returned prices to 18 digits.

### Tellor price data lag

USDFC sees a Tellor FIL-USD price that is at least 15 minutes old. This is because Tellor operates via proof-of-stake, and some dispute period is needed in which fake prices can be disputed. When a Tellor price is disputed, it is removed from the list of prices that USDFC sees. This dispute period ensures that, given at least one responsive disputer who disputes fake FIL prices, USDFC will never consume fake price data from Tellor.

The choice of 15 minutes for the dispute period was based on careful analysis of the impact of a delayed ETH price on a Liquity system. We used historical ETH price data and looked at the impact of different delay lengths. 15 minutes was chosen as a sweet spot that gives plenty of time for disputers to respond to fake prices, while keeping any adverse impacts on Liquity to a minimum.

### PriceFeed Logic

The `PriceFeed` contract fetches the current price and previous price from Chainlink and changes its state (`Status`) based on certain conditions.

**Initial PriceFeed state:** `chainlinkWorking`. The initial system state that is maintained as long as Chainlink is working properly, i.e. neither broken nor frozen nor exceeding the maximum price change threshold between two consecutive rounds.

### Testnet PriceFeed and PriceFeed tests

`PriceFeedTestnet.sol` is a mock PriceFeed for testnet and general back end testing purposes, with no oracle connection. It contains a manual price setter `setPrice()`, and a getter `getPrice()`, which returns the latest stored price.

The mainnet `PriceFeed.sol` is tested in `test/PriceFeedTest.js`, using a mock Chainlink aggregator and a mock TellorMaster contract.

### PriceFeed limitations and known issues

The purpose of the PriceFeed is to be at least as good as an immutable PriceFeed that relies purely on Chainlink, while also having some resilience in case of Chainlink failure / timeout, and chance of recovery.

The PriceFeed logic consists of automatic on-chain decision-making for obtaining fallback price data from Tellor, and if possible, for returning to Chainlink if/when it recovers.

The PriceFeed logic is complex, and although we would prefer simplicity, it does allow the system a chance of switching to an accurate price source in case of a Chainlink failure or timeout, and also the possibility of returning to an honest Chainlink price after it has failed and recovered.

We believe the benefit of the fallback logic is worth the complexity, given that our system is entirely immutable - if we had no fallback logic and Chainlink were to be hacked or permanently fail, USDFC protocol would become permanently unusable anyway.

**Chainlink Decimals**: the `PriceFeed` checks for and uses the latest `decimals` value reported by the Chainlink aggregator in order to calculate the Chainlink price at 18-digit precision, as needed by USDFC protocol. `PriceFeed` does not assume a value for decimals and can handle the case where Chainlink change their decimal value.

However, the check `chainlinkIsBroken` uses both the current response from the latest round and the response previous round. Since `decimals` is not attached to round data, USDFC protocol has no way of knowing whether decimals has changed between the current round and the previous round, so we assume it is the same. USDFC protocol assumes the current return value of decimals() applies to both current round `i` and previous round `i-1`.

This means that a decimal change that coincides with a USDFC protocol price fetch could cause USDFC protocol to assert that the Chainlink price has deviated too much, and fall back to Tellor. There is nothing we can do about this. We hope/expect Chainlink to never change their `decimals()` return value (currently 8), and if a hack/technical error causes Chainlink's decimals to change, USDFC protocol may fall back to Tellor.

To summarize the Chainlink decimals issue:

- USDFC protocol can handle the case where Chainlink decimals changes across _two consecutive rounds `i` and `i-1` which are not used in the same USDFC protocol price fetch_
- If USDFC protocol fetches the price at round `i`, it will not know if Chainlink decimals changed across round `i-1` to round `i`, and the consequent price scaling distortion may cause USDFC protocol to fall back to Tellor
- USDFC protocol will always calculate the correct current price at 18-digit precision assuming the current return value of `decimals()` is correct (i.e. is the value used by the nodes).

**Tellor Decimals**: Tellor uses 6 decimal precision for their FILUSD price as determined by a social consensus of Tellor miners/data providers, and shown on Tellor's price feed page. Their decimals value is not offered in their on-chain contracts. We rely on the continued social consensus around 6 decimals for their FILUSD price feed. Tellor have informed us that if there was demand for an FILUSD price at different precision, they would simply create a new `requestId`, and make no attempt to alter the social consensus around the precision of the current FILUSD `requestId` (1) used by USDFC protocol.

### Keeping a sorted list of Troves ordered by ICR

USDFC protocol relies on a particular data structure: a sorted doubly-linked list of Troves that remains ordered by their NICR, i.e. the amount of collateral (in FIL) multiplied by 100e18 and divided by the amount of debt (in USDFC). It inserts and re-inserts Troves at the correct position, based on their NICR.

This ordered list is critical for gas-efficient redemption sequences and for the `liquidateTroves` sequence, both of which target Troves in ascending order of ICR.

The sorted doubly-linked list is found in `SortedTroves.sol`.

Nodes map to active Troves in the system - the ID property is the address of a trove owner. The list accepts positional hints for efficient O(1) insertion - please see the [hints](#supplying-hints-to-trove-operations) section for more details.

ICRs are computed dynamically at runtime, and not stored on the node. This is because ICRs of active Troves change dynamically, when:

- The FIL:USD price varies, altering the USD of the collateral of every Trove
- A liquidation that redistributes collateral and debt to active Troves occurs

The list relies on the fact that a collateral and debt redistribution due to a liquidation preserves the ordering of all active Troves (though it does decrease the ICR of each Trove above the MCR).

The fact that ordering is maintained as redistributions occur, is not immediately obvious: please see the [mathematical proof](https://github.com/liquity/dev/blob/main/papers) which shows that this holds in USDFC protocol.

A node inserted based on current ICR will maintain the correct position, relative to its peers, as liquidation gains accumulate, as long as its raw collateral and debt have not changed.

Nodes also remain sorted as the FIL:USD price varies, since price fluctuations change the collateral value of each Trove by the same proportion.

Thus, nodes need only be re-inserted to the sorted list upon a Trove operation - when the owner adds or removes collateral or debt to their position.

### Flow of FIL in USDFC protocol

FIL in the system lives in four Pools: the ActivePool, the DefaultPool, the StabilityPool and the CollSurplusPool, plus ProtocolTokenStaking contract. When an operation is made, FIL is transferred in one of three ways:

- From a user to a Pool
- From a Pool to a user
- From one Pool to another Pool

FIL is recorded on an _individual_ level, but stored in _aggregate_ in a Pool. An active Trove with collateral and debt has a struct in the TroveManager that stores its FIL collateral value in a uint, but its actual FIL is in the balance of the ActivePool contract.

Likewise, the StabilityPool holds the total accumulated FIL gains from liquidations for all depositors.

ProtocolTokenStaking receives FIL coming from redemption fees.

**Borrower Operations**

| Function                     | FIL quantity                        | Path                                       |
| ---------------------------- | ----------------------------------- | ------------------------------------------ |
| openTrove                    | msg.value                           | msg.sender->BorrowerOperations->ActivePool |
| addColl                      | msg.value                           | msg.sender->BorrowerOperations->ActivePool |
| withdrawColl                 | \_collWithdrawal parameter          | ActivePool->msg.sender                     |
| adjustTrove: adding FIL      | msg.value                           | msg.sender->BorrowerOperations->ActivePool |
| adjustTrove: withdrawing FIL | \_collWithdrawal parameter          | ActivePool->msg.sender                     |
| closeTrove                   | All remaining                       | ActivePool->msg.sender                     |
| claimCollateral              | CollSurplusPool.balance[msg.sender] | CollSurplusPool->msg.sender                |

**Trove Manager**

| Function                               | FIL quantity                           | Path                             |
| -------------------------------------- | -------------------------------------- | -------------------------------- |
| liquidate (offset)                     | collateral to be offset                | ActivePool->StabilityPool        |
| liquidate (redistribution)             | collateral to be redistributed         | ActivePool->DefaultPool          |
| liquidateTroves (offset)               | collateral to be offset                | ActivePool->StabilityPool        |
| liquidateTroves (redistribution)       | collateral to be redistributed         | ActivePool->DefaultPool          |
| batchLiquidateTroves (offset)          | collateral to be offset                | ActivePool->StabilityPool        |
| batchLiquidateTroves (redistribution). | collateral to be redistributed         | ActivePool->DefaultPool          |
| redeemCollateral                       | collateral to be swapped with redeemer | ActivePool->msg.sender           |
| redeemCollateral                       | redemption fee                         | ActivePool->ProtocolTokenStaking |
| redeemCollateral                       | trove's collateral surplus             | ActivePool->CollSurplusPool      |

**Stability Pool**

| Function               | FIL quantity                     | Path                                              |
| ---------------------- | -------------------------------- | ------------------------------------------------- |
| provideToSP            | depositor's accumulated FIL gain | StabilityPool -> msg.sender                       |
| withdrawFromSP         | depositor's accumulated FIL gain | StabilityPool -> msg.sender                       |
| withdrawFILGainToTrove | depositor's accumulated FIL gain | StabilityPool -> BorrowerOperations -> ActivePool |

**LQTY Staking**

| Function | FIL quantity                                   | Path                              |
| -------- | ---------------------------------------------- | --------------------------------- |
| stake    | staker's accumulated FIL gain from system fees | ProtocolTokenStaking ->msg.sender |
| unstake  | staker's accumulated FIL gain from system fees | ProtocolTokenStaking ->msg.sender |

### Flow of USDFC tokens in USDFC protocol

When a user issues debt from their Trove, USDFC tokens are minted to their own address, and a debt is recorded on the Trove. Conversely, when they repay their Trove’s USDFC debt, USDFC is burned from their address, and the debt on their Trove is reduced.

Redemptions burn USDFC from the redeemer’s balance, and reduce the debt of the Trove redeemed against.

Liquidations that involve a Stability Pool offset burn tokens from the Stability Pool’s balance, and reduce the USDFC debt of the liquidated Trove.

The only time USDFC is transferred to/from a USDFC protocol contract, is when a user deposits USDFC to, or withdraws USDFC from, the StabilityPool.

**Borrower Operations**

| Function                       | USDFC Quantity | ERC20 Operation                              |
| ------------------------------ | -------------- | -------------------------------------------- |
| openTrove                      | Drawn USDFC    | USDFC.\_mint(msg.sender, \_debtTokenAmount)  |
|                                | Issuance fee   | USDFC.\_mint(ProtocolTokenStaking, USDFCFee) |
| withdrawDebtToken              | Drawn USDFC    | USDFC.\_mint(msg.sender, \_debtTokenAmount)  |
|                                | Issuance fee   | USDFC.\_mint(ProtocolTokenStaking, USDFCFee) |
| repayDebtToken                 | Repaid USDFC   | USDFC.\_burn(msg.sender, \_debtTokenAmount)  |
| adjustTrove: withdrawing USDFC | Drawn USDFC    | USDFC.\_mint(msg.sender, \_debtTokenAmount)  |
|                                | Issuance fee   | USDFC.\_mint(ProtocolTokenStaking, USDFCFee) |
| adjustTrove: repaying USDFC    | Repaid USDFC   | USDFC.\_burn(msg.sender, \_debtTokenAmount)  |
| closeTrove                     | Repaid USDFC   | USDFC.\_burn(msg.sender, \_debtTokenAmount)  |

**Trove Manager**

| Function                      | USDFC Quantity            | ERC20 Operation                                     |
| ----------------------------- | ------------------------- | --------------------------------------------------- |
| liquidate (offset)            | USDFC to offset with debt | USDFC.\_burn(stabilityPoolAddress, \_debtToOffset); |
| liquidateTroves (offset)      | USDFC to offset with debt | USDFC.\_burn(stabilityPoolAddress, \_debtToOffset); |
| batchLiquidateTroves (offset) | USDFC to offset with debt | USDFC.\_burn(stabilityPoolAddress, \_debtToOffset); |
| redeemCollateral              | USDFC to redeem           | USDFC.\_burn(msg.sender, \_USDFC)                   |

**Stability Pool**

| Function       | USDFC Quantity   | ERC20 Operation                                               |
| -------------- | ---------------- | ------------------------------------------------------------- |
| provideToSP    | deposit / top-up | USDFC.\_transfer(msg.sender, stabilityPoolAddress, \_amount); |
| withdrawFromSP | withdrawal       | USDFC.\_transfer(stabilityPoolAddress, msg.sender, \_amount); |

**Protocol Token Staking**

| Function | USDFC Quantity                                   | ERC20 Operation                                                       |
| -------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| stake    | staker's accumulated USDFC gain from system fees | USDFC.\_transfer(ProtocolTokenStakingAddress, msg.sender, USDFCGain); |
| unstake  | staker's accumulated USDFC gain from system fees | USDFC.\_transfer(ProtocolTokenStakingAddress, msg.sender, USDFCGain); |

### Flow of SFC Tokens in USDFC protocol

Stability Providers and Frontend Operators receive SFC gains according to their share of the total USDFC deposits, and the SFC community issuance schedule. Once obtained, SFC can be staked and unstaked with the `ProtocolTokenStaking` contract.

**Stability Pool**

| Function               | SFC Quantity       | ERC20 Operation                                                     |
| ---------------------- | ------------------ | ------------------------------------------------------------------- |
| provideToSP            | depositor SFC gain | SFC.\_transfer(stabilityPoolAddress, msg.sender, depositorSFCGain); |
|                        | front end SFC gain | SFC.\_transfer(stabilityPoolAddress, \_frontEnd, frontEndSFCGain);  |
| withdrawFromSP         | depositor SFC gain | SFC.\_transfer(stabilityPoolAddress, msg.sender, depositorSFCGain); |
|                        | front end SFC gain | SFC.\_transfer(stabilityPoolAddress, \_frontEnd, frontEndSFCGain);  |
| withdrawFILGainToTrove | depositor SFC gain | SFC.\_transfer(stabilityPoolAddress, msg.sender, depositorSFCGain); |
|                        | front end SFC gain | SFC.\_transfer(stabilityPoolAddress, \_frontEnd, frontEndSFCGain);  |

**Protocol Token Staking Contract**

| Function | SFC Quantity                  | ERC20 Operation                                                    |
| -------- | ----------------------------- | ------------------------------------------------------------------ |
| stake    | staker's SFC deposit / top-up | SFC.\_transfer(msg.sender, ProtocolTokenStakingAddress, \_amount); |
| unstake  | staker's SFC withdrawal       | SFC.\_transfer(ProtocolTokenStakingAddress, msg.sender, \_amount); |

## Expected User Behaviors

Generally, borrowers call functions that trigger Trove operations on their own Trove. Stability Pool users (who may or may not also be borrowers) call functions that trigger Stability Pool operations, such as depositing or withdrawing tokens to/from the Stability Pool.

Anyone may call the public liquidation functions, and attempt to liquidate one or several Troves.

USDFC token holders may also redeem their tokens, and swap an amount of tokens 1-for-1 in value (minus fees) with FIL.

SFC token holders may stake their SFC, to earn a share of the system fee revenue, in FIL and USDFC.

## Contract Ownership and Function Permissions

All the core smart contracts inherit from the OpenZeppelin `OwnableUpgradeable.sol` contract template. As such all contracts have a single owning address, which is the deploying address. The contract's ownership is renounced either upon deployment, or immediately after its address setter has been called, connecting it to the rest of the core USDFC protocol system.

Several public and external functions have modifiers such as `requireCallerIsTroveManager`, `requireCallerIsActivePool`, etc - ensuring they can only be called by the respective permitted contract.

## Deployment to a Development Blockchain

The Hardhat migrations script and deployment helpers in `utils/deploymentHelpers.js` deploy all contracts, and connect all contracts to their dependency contracts, by setting the necessary deployed addresses.

The project is deployed on the Ropsten testnet.

## Running Tests

Run all tests with `npx hardhat test`, or run a specific test with `npx hardhat test ./test/contractTest.js`

Tests are run against the Hardhat EVM.

### Brownie Tests

There are some special tests that are using Brownie framework.

To test, install brownie with:

```
python3 -m pip install --user pipx
python3 -m pipx ensurepath

pipx install eth-brownie
```

and add numpy with:

```
pipx inject eth-brownie numpy
```

Add OpenZeppelin package:

```
brownie pm install OpenZeppelin/openzeppelin-contracts@3.3.0
```

## System Quantities - Units and Representation

### Integer representations of decimals

Several ratios and the FIL:USD price are integer representations of decimals, to 18 digits of precision. For example:

| **uint representation of decimal** | **Number**    |
| ---------------------------------- | ------------- |
| 1100000000000000000                | 1.1           |
| 200000000000000000000              | 200           |
| 1000000000000000000                | 1             |
| 5432100000000000000                | 5.4321        |
| 34560000000                        | 0.00000003456 |
| 370000000000000000000              | 370           |
| 1                                  | 1e-18         |

etc.

## Public Data

All data structures with the ‘public’ visibility specifier are ‘gettable’, with getters automatically generated by the compiler. Simply call `TroveManager::MCR()` to get the MCR, etc.

## Public User-Facing Functions

### Borrower (Trove) Operations - `BorrowerOperations.sol`

`openTrove(uint _maxFeePercentage, uint _debtTokenAmount, address _upperHint, address _lowerHint)`: payable function that creates a Trove for the caller with the requested debt, and the FIL received as collateral. Successful execution is conditional mainly on the resulting collateralization ratio which must exceed the minimum (110% in Normal Mode, 150% in Recovery Mode). In addition to the requested debt, extra debt is issued to pay the issuance fee, and cover the gas compensation. The borrower has to provide a `_maxFeePercentage` that he/she is willing to accept in case of a fee slippage, i.e. when a redemption transaction is processed first, driving up the issuance fee.

`addColl(address _upperHint, address _lowerHint)`: payable function that adds the received FIL to the caller's active Trove.

`withdrawColl(uint _amount, address _upperHint, address _lowerHint)`: withdraws `_amount` of collateral from the caller’s Trove. Executes only if the user has an active Trove, the withdrawal would not pull the user’s Trove below the minimum collateralization ratio, and the resulting total collateralization ratio of the system is above 150%.

`function withdrawDebtToken(uint _maxFeePercentage, uint _debtTokenAmount, address _upperHint, address _lowerHint)`: issues `_amount` of USDFC from the caller’s Trove to the caller. Executes only if the Trove's collateralization ratio would remain above the minimum, and the resulting total collateralization ratio is above 150%. The borrower has to provide a `_maxFeePercentage` that he/she is willing to accept in case of a fee slippage, i.e. when a redemption transaction is processed first, driving up the issuance fee.

`repayDebtToken(uint _amount, address _upperHint, address _lowerHint)`: repay `_amount` of USDFC to the caller’s Trove, subject to leaving 50 debt in the Trove (which corresponds to the 50 USDFC gas compensation).

`_adjustTrove(address _borrower, uint _collWithdrawal, uint _debtChange, bool _isDebtIncrease, address _upperHint, address _lowerHint, uint _maxFeePercentage)`: enables a borrower to simultaneously change both their collateral and debt, subject to all the restrictions that apply to individual increases/decreases of each quantity with the following particularity: if the adjustment reduces the collateralization ratio of the Trove, the function only executes if the resulting total collateralization ratio is above 150%. The borrower has to provide a `_maxFeePercentage` that he/she is willing to accept in case of a fee slippage, i.e. when another redemption transaction is processed first, driving up the issuance fee. The parameter is ignored if the debt is not increased with the transaction.

`closeTrove()`: allows a borrower to repay all debt, withdraw all their collateral, and close their Trove. Requires the borrower have a USDFC balance sufficient to repay their trove's debt, excluding gas compensation - i.e. `(debt - 50)` USDFC.

`claimCollateral(address _user)`: when a borrower’s Trove has been fully redeemed from and closed, or liquidated in Recovery Mode with a collateralization ratio above 110%, this function allows the borrower to claim their FIL collateral surplus that remains in the system (collateral - debt upon redemption; collateral - 110% of the debt upon liquidation).

### TroveManager Functions - `TroveManager.sol`

`liquidate(address _borrower)`: callable by anyone, attempts to liquidate the Trove of `_user`. Executes successfully if `_user`’s Trove meets the conditions for liquidation (e.g. in Normal Mode, it liquidates if the Trove's ICR < the system MCR).

`liquidateTroves(uint n)`: callable by anyone, checks for under-collateralized Troves below MCR and liquidates up to `n`, starting from the Trove with the lowest collateralization ratio; subject to gas constraints and the actual number of under-collateralized Troves. The gas costs of `liquidateTroves(uint n)` mainly depend on the number of Troves that are liquidated, and whether the Troves are offset against the Stability Pool or redistributed. For n=1, the gas costs per liquidated Trove are roughly between 215K-400K, for n=5 between 80K-115K, for n=10 between 70K-82K, and for n=50 between 60K-65K.

`batchLiquidateTroves(address[] calldata _troveArray)`: callable by anyone, accepts a custom list of Troves addresses as an argument. Steps through the provided list and attempts to liquidate every Trove, until it reaches the end or it runs out of gas. A Trove is liquidated only if it meets the conditions for liquidation. For a batch of 10 Troves, the gas costs per liquidated Trove are roughly between 75K-83K, for a batch of 50 Troves between 54K-69K.

`redeemCollateral(uint _debtTokenAmount, address _firstRedemptionHint, address _upperPartialRedemptionHint, address _lowerPartialRedemptionHint, uint _partialRedemptionHintNICR, uint _maxIterations, uint _maxFeePercentage)`: redeems `_debtTokenAmount` of stablecoins for FIL from the system. Decreases the caller’s USDFC balance, and sends them the corresponding amount of FIL. Executes successfully if the caller has sufficient USDFC to redeem. The number of Troves redeemed from is capped by `_maxIterations`. The borrower has to provide a `_maxFeePercentage` that he/she is willing to accept in case of a fee slippage, i.e. when another redemption transaction is processed first, driving up the redemption fee.

`getCurrentICR(address _user, uint _price)`: computes the user’s individual collateralization ratio (ICR) based on their total collateral and total USDFC debt. Returns 2^256 -1 if they have 0 debt.

`getTroveOwnersCount()`: get the number of active Troves in the system.

`getPendingFILReward(address _borrower)`: get the pending FIL reward from liquidation redistribution events, for the given Trove.

`getPendingDebtReward(address _borrower)`: get the pending Trove debt "reward" (i.e. the amount of extra debt assigned to the Trove) from liquidation redistribution events.

`getEntireDebtAndColl(address _borrower)`: returns a Trove’s entire debt and collateral, which respectively include any pending debt rewards and FIL rewards from prior redistributions.

`getEntireSystemColl()`: Returns the systemic entire collateral allocated to Troves, i.e. the sum of the FIL in the Active Pool and the DefaultPool.

`getEntireSystemDebt()`: Returns the systemic entire debt assigned to Troves, i.e. the sum of the USDFCDebt in the Active Pool and the DefaultPool.

`getTCR()`: returns the total collateralization ratio (TCR) of the system. The TCR is based on the entire system debt and collateral (including pending rewards).

`checkRecoveryMode()`: reveals whether or not the system is in Recovery Mode (i.e. whether the Total Collateralization Ratio (TCR) is below the Critical Collateralization Ratio (CCR)).

### Hint Helper Functions - `HintHelpers.sol`

`function getApproxHint(uint _CR, uint _numTrials, uint _inputRandomSeed)`: helper function, returns a positional hint for the sorted list. Used for transactions that must efficiently re-insert a Trove to the sorted list.

`getRedemptionHints(uint _debtTokenAmount, uint _price, uint _maxIterations)`: helper function specifically for redemptions. Returns three hints:

- `firstRedemptionHint` is a positional hint for the first redeemable Trove (i.e. Trove with the lowest ICR >= MCR).
- `partialRedemptionHintNICR` is the final nominal ICR of the last Trove after being hit by partial redemption, or zero in case of no partial redemption (see [Hints for `redeemCollateral`](#hints-for-redeemcollateral)).
- `truncatedDebtTokenAmount` is the maximum amount that can be redeemed out of the provided `_debtTokenAmount`. This can be lower than `_debtTokenAmount` when redeeming the full amount would leave the last Trove of the redemption sequence with less debt than the minimum allowed value.

The number of Troves to consider for redemption can be capped by passing a non-zero value as `_maxIterations`, while passing zero will leave it uncapped.

### Stability Pool Functions - `StabilityPool.sol`

`provideToSP(uint _amount, address _frontEndTag)`: allows stablecoin holders to deposit `_amount` of USDFC to the Stability Pool. It sends `_amount` of USDFC from their address to the Pool, and tops up their USDFC deposit by `_amount` and their tagged front end’s stake by `_amount`. If the depositor already has a non-zero deposit, it sends their accumulated FIL and SFC gains to their address, and pays out their front end’s SFC gain to their front end.

`withdrawFromSP(uint _amount)`: allows a stablecoin holder to withdraw `_amount` of USDFC from the Stability Pool, up to the value of their remaining Stability deposit. It decreases their USDFC balance by `_amount` and decreases their front end’s stake by `_amount`. It sends the depositor’s accumulated FIL and SFC gains to their address, and pays out their front end’s SFC gain to their front end. If the user makes a partial withdrawal, their deposit remainder will earn further gains. To prevent potential loss evasion by depositors, withdrawals from the Stability Pool are suspended when there are liquidable Troves with ICR < 110% in the system.

`withdrawFILGainToTrove(address _hint)`: sends the user's entire accumulated FIL gain to the user's active Trove, and updates their Stability deposit with its accumulated loss from debt absorptions. Sends the depositor's SFC gain to the depositor, and sends the tagged front end's SFC gain to the front end.

`registerFrontEnd(uint _kickbackRate)`: Registers an address as a front end and sets their chosen kickback rate in range `[0,1]`.

`getDepositorFILGain(address _depositor)`: returns the accumulated FIL gain for a given Stability Pool depositor

`getDepositorProtocolTokenGain(address _depositor)`: returns the accumulated SFC gain for a given Stability Pool depositor

`getFrontEndProtocolTokenGain(address _frontEnd)`: returns the accumulated SFC gain for a given front end

`getCompoundedDebtTokenDeposit(address _depositor)`: returns the remaining deposit amount for a given Stability Pool depositor

`getCompoundedFrontEndStake(address _frontEnd)`: returns the remaining front end stake for a given front end

### Protocol Token Staking Functions `ProtocolTokenStaking.sol`

`stake(uint _tokenAmount)`: sends `_tokenAmount` from the caller to the staking contract, and increases their stake. If the caller already has a non-zero stake, it pays out their accumulated FIL and USDFC gains from staking.

`unstake(uint _tokenAmount)`: reduces the caller’s stake by `_tokenAmount`, up to a maximum of their entire stake. It pays out their accumulated FIL and USDFC gains from staking.

### Lockup Contract Factory `LockupContractFactory.sol`

`deployLockupContract(address _beneficiary, uint _unlockTime)`; Deploys a `LockupContract`, and sets the beneficiary’s address, and the `_unlockTime` - the instant in time at which the SFC can be withdrawn by the beneficiary.

### Lockup contract - `LockupContract.sol`

`withdrawProtocolToken()`: When the current time is later than the `unlockTime` and the caller is the beneficiary, it transfers their SFC to them.

### USDFC token `DebtToken.sol` and Protocol token `SFCToken.sol`

Standard ERC20 and EIP2612 (`permit()` ) functionality.

**Note**: `permit()` can be front-run, as it does not require that the permitted spender be the `msg.sender`.

This allows flexibility, as it means that _anyone_ can submit a Permit signed by A that allows B to spend a portion of A's tokens.

The end result is the same for the signer A and spender B, but does mean that a `permit` transaction  
could be front-run and revert - which may hamper the execution flow of a contract that is intended to handle the submission of a Permit on-chain.

For more details please see the original proposal EIP-2612:
https://eips.ethereum.org/EIPS/eip-2612

## Supplying Hints to Trove operations

Troves in USDFC protocol are recorded in a sorted doubly linked list, sorted by their NICR, from high to low. NICR stands for the nominal collateral ratio that is simply the amount of collateral (in FIL) multiplied by 100e18 and divided by the amount of debt (in USDFC), without taking the FIL:USD price into account. Given that all Troves are equally affected by FIL price changes, they do not need to be sorted by their real ICR.

All Trove operations that change the collateralization ratio need to either insert or reinsert the Trove to the `SortedTroves` list. To reduce the computational complexity (and gas cost) of the insertion to the linked list, two ‘hints’ may be provided.

A hint is the address of a Trove with a position in the sorted list close to the correct insert position.

All Trove operations take two ‘hint’ arguments: a `_lowerHint` referring to the `nextId` and an `_upperHint` referring to the `prevId` of the two adjacent nodes in the linked list that are (or would become) the neighbors of the given Trove. Taking both direct neighbors as hints has the advantage of being much more resilient to situations where a neighbor gets moved or removed before the caller's transaction is processed: the transaction would only fail if both neighboring Troves are affected during the pendency of the transaction.

The better the ‘hint’ is, the shorter the list traversal, and the cheaper the gas cost of the function call. `SortedList::findInsertPosition(uint256 _NICR, address _prevId, address _nextId)` that is called by the Trove operation firsts check if `prevId` is still existant and valid (larger NICR than the provided `_NICR`) and then descends the list starting from `prevId`. If the check fails, the function further checks if `nextId` is still existant and valid (smaller NICR than the provided `_NICR`) and then ascends list starting from `nextId`.

The `HintHelpers::getApproxHint(...)` function can be used to generate a useful hint pointing to a Trove relatively close to the target position, which can then be passed as an argument to the desired Trove operation or to `SortedTroves::findInsertPosition(...)` to get its two direct neighbors as ‘exact‘ hints (based on the current state of the system).

`getApproxHint(uint _CR, uint _numTrials, uint _inputRandomSeed)` randomly selects `numTrials` amount of Troves, and returns the one with the closest position in the list to where a Trove with a nominal collateralization ratio of `_CR` should be inserted. It can be shown mathematically that for `numTrials = k * sqrt(n)`, the function's gas cost is with very high probability worst case `O(sqrt(n)) if k >= 10`. For scalability reasons (Infura is able to serve up to ~4900 trials), the function also takes a random seed `_inputRandomSeed` to make sure that calls with different seeds may lead to a different results, allowing for better approximations through multiple consecutive runs.

**Trove operation without a hint**

1. User performs Trove operation in their browser
2. Call the Trove operation with `_lowerHint = _upperHint = userAddress`

Gas cost will be worst case `O(n)`, where n is the size of the `SortedTroves` list.

**Trove operation with hints**

1. User performs Trove operation in their browser
2. The front end computes a new collateralization ratio locally, based on the change in collateral and/or debt.
3. Call `HintHelpers::getApproxHint(...)`, passing it the computed nominal collateralization ratio. Returns an address close to the correct insert position
4. Call `SortedTroves::findInsertPosition(uint256 _NICR, address _prevId, address _nextId)`, passing it the same approximate hint via both `_prevId` and `_nextId` and the new nominal collateralization ratio via `_NICR`.
5. Pass the ‘exact‘ hint in the form of the two direct neighbors, i.e. `_nextId` as `_lowerHint` and `_prevId` as `_upperHint`, to the Trove operation function call. (Note that the hint may become slightly inexact due to pending transactions that are processed first, though this is gracefully handled by the system that can ascend or descend the list as needed to find the right position.)

Gas cost of steps 2-4 will be free, and step 5 will be `O(1)`.

Hints allow cheaper Trove operations for the user, at the expense of a slightly longer time to completion, due to the need to await the result of the two read calls in steps 1 and 2 - which may be sent as JSON-RPC requests to Infura, unless the Frontend Operator is running a full Filecoin node.

### Hints for `redeemCollateral`

`TroveManager::redeemCollateral` as a special case requires additional hints:

- `_firstRedemptionHint` hints at the position of the first Trove that will be redeemed from,
- `_lowerPartialRedemptionHint` hints at the `nextId` neighbor of the last redeemed Trove upon reinsertion, if it's partially redeemed,
- `_upperPartialRedemptionHint` hints at the `prevId` neighbor of the last redeemed Trove upon reinsertion, if it's partially redeemed,
- `_partialRedemptionHintNICR` ensures that the transaction won't run out of gas if neither `_lowerPartialRedemptionHint` nor `_upperPartialRedemptionHint` are valid anymore.

`redeemCollateral` will only redeem from Troves that have an ICR >= MCR. In other words, if there are Troves at the bottom of the SortedTroves list that are below the minimum collateralization ratio (which can happen after an FIL:USD price drop), they will be skipped. To make this more gas-efficient, the position of the first redeemable Trove should be passed as `_firstRedemptionHint`.

#### First redemption hint

The first redemption hint is the address of the trove from which to start the redemption sequence - i.e the address of the first trove in the system with ICR >= 110%.

If when the transaction is confirmed the address is in fact not valid - the system will start from the lowest ICR trove in the system, and step upwards until it finds the first trove with ICR >= 110% to redeem from. In this case, since the number of troves below 110% will be limited due to ongoing liquidations, there's a good chance that the redemption transaction still succeed.

#### Partial redemption hints

All Troves that are fully redeemed from in a redemption sequence are left with zero debt, and are closed. The remaining collateral (the difference between the orginal collateral and the amount used for the redemption) will be claimable by the owner.

It’s likely that the last Trove in the redemption sequence would be partially redeemed from - i.e. only some of its debt cancelled with USDFC. In this case, it should be reinserted somewhere between top and bottom of the list. The `_lowerPartialRedemptionHint` and `_upperPartialRedemptionHint` hints passed to `redeemCollateral` describe the future neighbors the expected reinsert position.

However, if between the off-chain hint computation and on-chain execution a different transaction changes the state of a Trove that would otherwise be hit by the redemption sequence, then the off-chain hint computation could end up totally inaccurate. This could lead to the whole redemption sequence reverting due to out-of-gas error.

To mitigate this, another hint needs to be provided: `_partialRedemptionHintNICR`, the expected nominal ICR of the final partially-redeemed-from Trove. The on-chain redemption function checks whether, after redemption, the nominal ICR of this Trove would equal the nominal ICR hint.

If not, the redemption sequence doesn’t perform the final partial redemption, and terminates early. This ensures that the transaction doesn’t revert, and most of the requested USDFC redemption can be fulfilled.

## Gas compensation

In USDFC protocol, we want to maximize liquidation throughput, and ensure that undercollateralized Troves are liquidated promptly by “liquidators” - agents who may also hold Stability Pool deposits, and who expect to profit from liquidations.

However, gas costs in Filecoin are substantial. If the gas costs of our public liquidation functions are too high, this may discourage liquidators from calling them, and leave the system holding too many undercollateralized Troves for too long.

The protocol thus directly compensates liquidators for their gas costs, to incentivize prompt liquidations in both normal and extreme periods of high gas prices. Liquidators should be confident that they will at least break even by making liquidation transactions.

Gas compensation is paid in a mix of USDFC and FIL. While the FIL is taken from the liquidated Trove, the USDFC is provided by the borrower. When a borrower first issues debt, some USDFC is reserved as a Liquidation Reserve. A liquidation transaction thus draws FIL from the trove(s) it liquidates, and sends the both the reserved USDFC and the compensation in FIL to the caller, and liquidates the remainder.

When a liquidation transaction liquidates multiple Troves, each Trove contributes USDFC and FIL towards the total compensation for the transaction.

Gas compensation per liquidated Trove is given by the formula:

Gas compensation = `20 USDFC + 0.5% of trove’s collateral (FIL)`

The intentions behind this formula are:

- To ensure that smaller Troves are liquidated promptly in normal times, at least
- To ensure that larger Troves are liquidated promptly even in extreme high gas price periods. The larger the Trove, the stronger the incentive to liquidate it.

### Gas compensation schedule

When a borrower opens a Trove, an additional 20 USDFC debt is issued, and 20 USDFC is minted and sent to a dedicated contract (`GasPool`) for gas compensation - the "gas pool".

When a borrower closes their active Trove, this gas compensation is refunded: 20 USDFC is burned from the gas pool's balance, and the corresponding 20 USDFC debt on the Trove is cancelled.

The purpose of the 20 USDFC Liquidation Reserve is to provide a minimum level of gas compensation, regardless of the Trove's collateral size or the current FIL price.

### Liquidation

When a Trove is liquidated, 0.5% of its collateral is sent to the liquidator, along with the 20 USDFC Liquidation Reserve. Thus, a liquidator always receives `{20 USDFC + 0.5% collateral}` per Trove that they liquidate. The collateral remainder of the Trove is then either offset, redistributed or a combination of both, depending on the amount of USDFC in the Stability Pool.

### Gas compensation and redemptions

When a Trove is redeemed from, the redemption is made only against (debt - 20), not the entire debt.

But if the redemption causes an amount (debt - 20) to be cancelled, the Trove is then closed: the 20 USDFC Liquidation Reserve is cancelled with its remaining 200 debt. That is, the gas compensation is burned from the gas pool, and the 200 debt is zero’d. The FIL collateral surplus from the Trove remains in the system, to be later claimed by its owner.

### Gas compensation helper functions

Gas compensation functions are found in the parent _ProtocolBase.sol_ contract:

`_getCollGasCompensation(uint _entireColl)` returns the amount of FIL to be drawn from a trove's collateral and sent as gas compensation.

`_getCompositeDebt(uint _debt)` returns the composite debt (drawn debt + gas compensation) of a trove, for the purpose of ICR calculation.

## The Stability Pool

Any USDFC holder may deposit USDFC to the Stability Pool. It is designed to absorb debt from liquidations, and reward depositors with the liquidated collateral, shared between depositors in proportion to their deposit size.

Since liquidations are expected to occur at an ICR of just below 110%, and even in most extreme cases, still above 100%, a depositor can expect to receive a net gain from most liquidations. When that holds, the dollar value of the FIL gain from a liquidation exceeds the dollar value of the USDFC loss (assuming the price of USDFC is $1).

We define the **collateral surplus** in a liquidation as `$(FIL) - debt`, where `$(...)` represents the dollar value.

At an USDFC price of $1, Troves with `ICR > 100%` have a positive collateral surplus.

After one or more liquidations, a deposit will have absorbed USDFC losses, and received FIL gains. The remaining reduced deposit is the **compounded deposit**.

Stability Providers expect a positive ROI on their initial deposit. That is:

`$(FIL Gain + compounded deposit) > $(initial deposit)`

### Mixed liquidations: offset and redistribution

When a liquidation hits the Stability Pool, it is known as an **offset**: the debt of the Trove is offset against the USDFC in the Pool. When **x** USDFC debt is offset, the debt is cancelled, and **x** USDFC in the Pool is burned. When the USDFC Stability Pool is greater than the debt of the Trove, all the Trove's debt is cancelled, and all its FIL is shared between depositors. This is a **pure offset**.

It can happen that the USDFC in the Stability Pool is less than the debt of a Trove. In this case, the whole Stability Pool will be used to offset a fraction of the Trove’s debt, and an equal fraction of the Trove’s FIL collateral will be assigned to Stability Providers. The remainder of the Trove’s debt and FIL gets redistributed to active Troves. This is a **mixed offset and redistribution**.

Because the FIL collateral fraction matches the offset debt fraction, the effective ICR of the collateral and debt that is offset, is equal to the ICR of the Trove. So, for depositors, the ROI per liquidation depends only on the ICR of the liquidated Trove.

### Stability Pool deposit losses and FIL gains - implementation

Deposit functionality is handled by `StabilityPool.sol` (`provideToSP`, `withdrawFromSP`, etc). StabilityPool also handles the liquidation calculation, and holds the USDFC and FIL balances.

When a liquidation is offset with the Stability Pool, debt from the liquidation is cancelled with an equal amount of USDFC in the pool, which is burned.

Individual deposits absorb the debt from the liquidated Trove in proportion to their deposit as a share of total deposits.

Similarly the liquidated Trove’s FIL is assigned to depositors in the same proportion.

For example: a liquidation that empties 30% of the Stability Pool will reduce each deposit by 30%, no matter the size of the deposit.

### Stability Pool example

Here’s an example of the Stability Pool absorbing liquidations. The Stability Pool contains 3 depositors, A, B and C, and the FIL:USD price is 100.

There are two Troves to be liquidated, T1 and T2:

|     | Trove | Collateral (FIL) | Debt (USDFC) | ICR         | $(FIL) ($) | Collateral surplus ($) |
| --- | ----- | ---------------- | ------------ | ----------- | ---------- | ---------------------- |
|     | T1    | 1.6              | 150          | 1.066666667 | 160        | 10                     |
|     | T2    | 2.45             | 225          | 1.088888889 | 245        | 20                     |

Here are the deposits, before any liquidations occur:

| Depositor | Deposit | Share  |
| --------- | ------- | ------ |
| A         | 100     | 0.1667 |
| B         | 200     | 0.3333 |
| C         | 300     | 0.5    |
| Total     | 600     | 1      |

Now, the first liquidation T1 is absorbed by the Pool: 150 debt is cancelled with 150 Pool USDFC, and its 1.6 FIL is split between depositors. We see the gains earned by A, B, C, are in proportion to their share of the total USDFC in the Stability Pool:

| Deposit | Debt absorbed from T1 | Deposit after | Total FIL gained | $(deposit + FIL gain) ($) | Current ROI   |
| ------- | --------------------- | ------------- | ---------------- | ------------------------- | ------------- |
| A       | 25                    | 75            | 0.2666666667     | 101.6666667               | 0.01666666667 |
| B       | 50                    | 150           | 0.5333333333     | 203.3333333               | 0.01666666667 |
| C       | 75                    | 225           | 0.8              | 305                       | 0.01666666667 |
| Total   | 150                   | 450           | 1.6              | 610                       | 0.01666666667 |

And now the second liquidation, T2, occurs: 225 debt is cancelled with 225 Pool USDFC, and 2.45 FIL is split between depositors. The accumulated FIL gain includes all FIL gain from T1 and T2.

| Depositor | Debt absorbed from T2 | Deposit after | Accumulated FIL | $(deposit + FIL gain) ($) | Current ROI |
| --------- | --------------------- | ------------- | --------------- | ------------------------- | ----------- |
| A         | 37.5                  | 37.5          | 0.675           | 105                       | 0.05        |
| B         | 75                    | 75            | 1.35            | 210                       | 0.05        |
| C         | 112.5                 | 112.5         | 2.025           | 315                       | 0.05        |
| Total     | 225                   | 225           | 4.05            | 630                       | 0.05        |

It’s clear that:

- Each depositor gets the same ROI from a given liquidation
- Depositors’ return increases over time, as the deposits absorb liquidations with a positive collateral surplus

Eventually, a deposit can be fully “used up” in absorbing debt, and reduced to 0. This happens whenever a liquidation occurs that empties the Stability Pool. A deposit stops earning FIL gains when it has been reduced to 0.

### Stability Pool implementation

A depositor obtains their compounded deposits and corresponding FIL gain in a “pull-based” manner. The system calculates the depositor’s compounded deposit and accumulated FIL gain when the depositor makes an operation that changes their FIL deposit.

Depositors deposit USDFC via `provideToSP`, and withdraw with `withdrawFromSP`. Their accumulated FIL gain is paid out every time they make a deposit operation - so FIL payout is triggered by both deposit withdrawals and top-ups.

### How deposits and FIL gains are tracked

We use a highly scalable method of tracking deposits and FIL gains that has O(1) complexity.

When a liquidation occurs, rather than updating each depositor’s deposit and FIL gain, we simply update two intermediate variables: a product `P`, and a sum `S`.

A mathematical manipulation allows us to factor out the initial deposit, and accurately track all depositors’ compounded deposits and accumulated FIL gains over time, as liquidations occur, using just these two variables. When depositors join the Pool, they get a snapshot of `P` and `S`.

The formula for a depositor’s accumulated FIL gain is derived here:

[Scalable reward distribution for compounding, decreasing stake](https://github.com/liquity/dev/blob/main/papers/Scalable_Reward_Distribution_with_Compounding_Stakes.pdf)

Each liquidation updates `P` and `S`. After a series of liquidations, a compounded deposit and corresponding FIL gain can be calculated using the initial deposit, the depositor’s snapshots, and the current values of `P` and `S`.

Any time a depositor updates their deposit (withdrawal, top-up) their FIL gain is paid out, and they receive new snapshots of `P` and `S`.

This is similar in spirit to the simpler [Scalable Reward Distribution on the Ethereum Network by Bogdan Batog et al](http://batog.info/papers/scalable-reward-distribution.pdf), however, the mathematics is more involved as we handle a compounding, decreasing stake, and a corresponding FIL reward.

## SFC Issuance to Stability Providers

Stability Providers earn SFC tokens continuously over time, in proportion to the size of their deposit. This is known as “Community Issuance”, and is handled by `CommunityIssuance.sol`.

Upon system deployment and activation, `CommunityIssuance` holds an initial SFC supply, currently (provisionally) set at 32 million SFC tokens.

Each Stability Pool deposit is tagged with a front end tag - the Filecoin address of the front end through which the deposit was made. Stability deposits made directly with the protocol (no front end) are tagged with the zero address.

When a deposit earns SFC, it is split between the depositor, and the front end through which the deposit was made. Upon registering as a front end, a front end chooses a “kickback rate”: this is the percentage of SFC earned by a tagged deposit, to allocate to the depositor. Thus, the total SFC received by a depositor is the total SFC earned by their deposit, multiplied by `kickbackRate`. The front end takes a cut of `1-kickbackRate` of the SFC earned by the deposit.

### SFC Issuance schedule

The overall community issuance schedule for SFC is sub-linear and monotonic. We currently (provisionally) implement a yearly “halving” schedule, described by the cumulative issuance function:

`supplyCap * (1 - 0.5^t)`

where `t` is year and `supplyCap` is (provisionally) set to represent 32 million SFC tokens.

It results in the following cumulative issuance schedule for the community SFC supply:

| Year | Total community SFC issued |
| ---- | -------------------------- |
| 0    | 0%                         |
| 1    | 50%                        |
| 2    | 75%                        |
| 3    | 87.5%                      |
| 4    | 93.75%                     |
| 5    | 96.88%                     |

The shape of the SFC issuance curve is intended to incentivize both early depositors, and long-term deposits.

Although the SFC issuance curve follows a yearly halving schedule, in practice the `CommunityIssuance` contract uses time intervals of one minute, for more fine-grained reward calculations.

### SFC Issuance implementation

The continuous time-based SFC issuance is chunked into discrete reward events, that occur at every deposit change (new deposit, top-up, withdrawal), and every liquidation, before other state changes are made.

In a SFC reward event, the SFC to be issued is calculated based on time passed since the last reward event, `block.timestamp - lastSFCIssuanceTime`, and the cumulative issuance function.

The SFC produced in this issuance event is shared between depositors, in proportion to their deposit sizes.

To efficiently and accurately track SFC gains for depositors and front ends as deposits decrease over time from liquidations, we re-use the [=algorithm for rewards from a compounding, decreasing stake. It is the same algorithm used for the FIL gain from liquidations.

The same product `P` is used, and a sum `G` is used to track SFC rewards, and each deposit gets a new snapshot of `P` and `G` when it is updated.

### Handling the front end SFC gain

As mentioned in [SFC Issuance to Stability Providers](#sfc-issuance-to-stability-providers), in a SFC reward event generating `SFC_d` for a deposit `d` made through a front end with kickback rate `k`, the front end receives `(1-k) * SFC_d` and the depositor receives `k * SFC_d`.

The front end should earn a cut of SFC gains for all deposits tagged with its front end.

Thus, we use a virtual stake for the front end, equal to the sum of all its tagged deposits. The front end’s accumulated SFC gain is calculated in the same way as an individual deposit, using the product `P` and sum `G`.

Also, whenever one of the front end’s depositors tops or withdraws their deposit, the same change is applied to the front-end’s stake.

### SFC reward events and payouts

When a deposit is changed (top-up, withdrawal):

- A SFC reward event occurs, and `G` is updated
- Its FIL and SFC gains are paid out
- Its tagged front end’s SFC gains are paid out to that front end
- The deposit is updated, with new snapshots of `P`, `S` and `G`
- The front end’s stake updated, with new snapshots of `P` and `G`

When a liquidation occurs:

- A SFC reward event occurs, and `G` is updated

## SFC issuance to usdfc providers

On deployment a new Uniswap pool will be created for the pair USDFC/FIL and a Staking rewards contract will be deployed. The contract is based on [Unipool by Synthetix](https://github.com/Synthetixio/Unipool/blob/master/contracts/Unipool.sol). More information about their liquidity rewards program can be found in the [original SIP 31](https://sips.synthetix.io/sips/sip-31) and in [their blog](https://blog.synthetix.io/new-uniswap-seth-lp-reward-system/).

Essentially the way it works is:

- Liqudity providers add funds to the Uniswap pool, and get UNIv2 tokens in exchange
- Liqudity providers stake those UNIv2 tokens into Unipool rewards contract
- Liqudity providers accrue rewards, proportional to the amount of staked tokens and staking time
- Liqudity providers can claim their rewards when they want
- Liqudity providers can unstake UNIv2 tokens to exit the program (i.e., stop earning rewards) when they want

If at some point the total amount of staked tokens is zero, the clock will be “stopped”, so the period will be extended by the time during which the staking pool is empty, in order to avoid getting SFC tokens locked. That also means that the start time for the program will be the event that occurs first: either SFC token contract is deployed, and therefore SFC tokens are minted to Unipool contract, or first liquidity provider stakes UNIv2 tokens into it.

## USDFC System Fees

USDFC protocol generates fee revenue from certain operations. Fees are captured by the SFC token.

A SFC holder may stake their SFC, and earn a share of all system fees, proportional to their share of the total SFC staked.

USDFC protocol generates revenue in two ways: redemptions, and issuance of new USDFC tokens.

Redemptions fees are paid in FIL. Issuance fees (when a user opens a Trove, or issues more USDFC from their existing Trove) are paid in USDFC.

### Redemption Fee

The redemption fee is taken as a cut of the total FIL drawn from the system in a redemption. It is based on the current redemption rate.

In the `TroveManager`, `redeemCollateral` calculates the FIL fee and transfers it to the staking contract, `ProtocolTokenStaking.sol`

### Issuance fee

The issuance fee is charged on the USDFC drawn by the user and is added to the Trove's USDFC debt. It is based on the current borrowing rate.

When new USDFC are drawn via one of the `BorrowerOperations` functions `openTrove`, `withdrawDebtToken` or `adjustTrove`, an extra amount `USDFCFee` is minted, and an equal amount of debt is added to the user’s Trove. The `USDFCFee` is transferred to the staking contract, `ProtocolTokenStaking.sol`.

### Fee Schedule

Redemption and issuance fees are based on the `baseRate` state variable in TroveManager, which is dynamically updated. The `baseRate` increases with each redemption, and decays according to time passed since the last fee event - i.e. the last redemption or issuance of USDFC.

The current fee schedule:

Upon each redemption:

- `baseRate` is decayed based on time passed since the last fee event
- `baseRate` is incremented by an amount proportional to the fraction of the total USDFC supply that was redeemed
- The redemption rate is given by `min{REDEMPTION_FEE_FLOOR + baseRate * FILdrawn, DECIMAL_PRECISION}`

Upon each debt issuance:

- `baseRate` is decayed based on time passed since the last fee event
- The borrowing rate is given by `min{BORROWING_FEE_FLOOR + baseRate * newDebtIssued, MAX_BORROWING_FEE}`

`REDEMPTION_FEE_FLOOR` and `BORROWING_FEE_FLOOR` are both set to 0.5%, while `MAX_BORROWING_FEE` is 5% and `DECIMAL_PRECISION` is 100%.

### Intuition behind fees

The larger the redemption volume, the greater the fee percentage.

The longer the time delay since the last operation, the more the `baseRate` decreases.

The intent is to throttle large redemptions with higher fees, and to throttle borrowing directly after large redemption volumes. The `baseRate` decay over time ensures that the fee for both borrowers and redeemers will “cool down”, while redemptions volumes are low.

Furthermore, the fees cannot become smaller than 0.5%, which in the case of redemptions protects the redemption facility from being front-run by arbitrageurs that are faster than the price feed. The 5% maximum on the issuance is meant to keep the system (somewhat) attractive for new borrowers even in phases where the monetary is contracting due to redemptions.

### Fee decay Implementation

Time is measured in units of minutes. The `baseRate` decay is based on `block.timestamp - lastFeeOpTime`. If less than a minute has passed since the last fee event, then `lastFeeOpTime` is not updated. This prevents “base rate griefing”: i.e. it prevents an attacker stopping the `baseRate` from decaying by making a series of redemptions or issuing USDFC with time intervals of < 1 minute.

The decay parameter is tuned such that the fee changes by a factor of 0.99 per hour, i.e. it loses 1% of its current value per hour. At that rate, after one week, the baseRate decays to 18% of its prior value. The exact decay parameter is subject to change, and will be fine-tuned via economic modelling.

### Staking SFC and earning fees

SFC holders may `stake` and `unstake` their SFC in the `ProtocolTokenStaking.sol` contract.

When a fee event occurs, the fee in USDFC or FIL is sent to the staking contract, and a reward-per-unit-staked sum (`F_FIL`, or `F_DebtToken`) is incremented. A SFC stake earns a share of the fee equal to its share of the total SFC staked, at the instant the fee occurred.

This staking formula and implementation follows the basic [“Batog” pull-based reward distribution](http://batog.info/papers/scalable-reward-distribution.pdf).

## Redistributions and Corrected Stakes

When a liquidation occurs and the Stability Pool is empty or smaller than the liquidated debt, the redistribution mechanism should distribute the remaining collateral and debt of the liquidated Trove, to all active Troves in the system, in proportion to their collateral.

For two Troves A and B with collateral `A.coll > B.coll`, Trove A should earn a bigger share of the liquidated collateral and debt.

In USDFC protocol it is important that all active Troves remain ordered by their ICR. We have proven that redistribution of the liquidated debt and collateral proportional to active Troves’ collateral, preserves the ordering of active Troves by ICR, as liquidations occur over time.

However, when it comes to implementation, Filecoin gas costs make it too expensive to loop over all Troves and write new data to storage for each one. When a Trove receives redistribution rewards, the system does not update the Trove's collateral and debt properties - instead, the Trove’s rewards remain "pending" until the borrower's next operation.

These “pending rewards” can not be accounted for in future reward calculations in a scalable way.

However: the ICR of a Trove is always calculated as the ratio of its total collateral to its total debt. So, a Trove’s ICR calculation **does** include all its previous accumulated rewards.

**This causes a problem: redistributions proportional to initial collateral can break trove ordering.**

Consider the case where new Trove is created after all active Troves have received a redistribution from a liquidation. This “fresh” Trove has then experienced fewer rewards than the older Troves, and thus, it receives a disproportionate share of subsequent rewards, relative to its total collateral.

The fresh trove would earns rewards based on its **entire** collateral, whereas old Troves would earn rewards based only on **some portion** of their collateral - since a part of their collateral is pending, and not included in the Trove’s `coll` property.

This can break the ordering of Troves by ICR.

### Corrected Stake Solution

We use a corrected stake to account for this discrepancy, and ensure that newer Troves earn the same liquidation rewards per unit of total collateral, as do older Troves with pending rewards. Thus the corrected stake ensures the sorted list remains ordered by ICR, as liquidation events occur over time.

When a Trove is opened, its stake is calculated based on its collateral, and snapshots of the entire system collateral and debt which were taken immediately after the last liquidation.

A Trove’s stake is given by:

```
stake = _coll.mul(totalStakesSnapshot).div(totalCollateralSnapshot)
```

It then earns redistribution rewards based on this corrected stake. A newly opened Trove’s stake will be less than its raw collateral, if the system contains active Troves with pending redistribution rewards when it was made.

Whenever a borrower adjusts their Trove’s collateral, their pending rewards are applied, and a fresh corrected stake is computed.

## Math Proofs

The USDFC protocol implementation relies on some important system properties and mathematical derivations.

In particular, we have:

- Proofs that Trove ordering is maintained throughout a series of liquidations and new Trove openings
- A derivation of a formula and implementation for a highly scalable (O(1) complexity) reward distribution in the Stability Pool, involving compounding and decreasing stakes.

PDFs of these can be found in https://github.com/liquity/dev/blob/main/papers

## Definitions

_**Trove:**_ a collateralized debt position, bound to a single Filecoin address. Also referred to as a “CDP” in similar protocols.

_**USDFC**_: The stablecoin that may be issued from a user's collateralized debt position and freely transferred/traded to any Filecoin address. Intended to maintain parity with the US dollar, and can always be redeemed directly with the system: 1 USDFC is always exchangeable for $1 USD worth of FIL.

_**Active Trove:**_ an Filecoin address owns an “active Trove” if there is a node in the `SortedTroves` list with ID equal to the address, and non-zero collateral is recorded on the Trove struct for that address.

_**Closed Trove:**_ a Trove that was once active, but now has zero debt and zero collateral recorded on its struct, and there is no node in the `SortedTroves` list with ID equal to the owning address.

_**Active collateral:**_ the amount of FIL collateral recorded on a Trove’s struct

_**Active debt:**_ the amount of USDFC debt recorded on a Trove’s struct

_**Entire collateral:**_ the sum of a Trove’s active collateral plus its pending collateral rewards accumulated from distributions

_**Entire debt:**_ the sum of a Trove’s active debt plus its pending debt rewards accumulated from distributions

_**Individual collateralization ratio (ICR):**_ a Trove's ICR is the ratio of the dollar value of its entire collateral at the current FIL:USD price, to its entire debt

_**Nominal collateralization ratio (nominal ICR, NICR):**_ a Trove's nominal ICR is its entire collateral (in FIL) multiplied by 100e18 and divided by its entire debt.

_**Total active collateral:**_ the sum of active collateral over all Troves. Equal to the FIL in the ActivePool.

_**Total active debt:**_ the sum of active debt over all Troves. Equal to the USDFC in the ActivePool.

_**Total defaulted collateral:**_ the total FIL collateral in the DefaultPool

_**Total defaulted debt:**_ the total USDFC debt in the DefaultPool

_**Entire system collateral:**_ the sum of the collateral in the ActivePool and DefaultPool

_**Entire system debt:**_ the sum of the debt in the ActivePool and DefaultPool

_**Total collateralization ratio (TCR):**_ the ratio of the dollar value of the entire system collateral at the current FIL:USD price, to the entire system debt

_**Critical collateralization ratio (CCR):**_ 150%. When the TCR is below the CCR, the system enters Recovery Mode.

_**Borrower:**_ an externally owned account or contract that locks collateral in a Trove and issues USDFC tokens to their own address. They “borrow” USDFC tokens against their FIL collateral.

_**Depositor:**_ an externally owned account or contract that has assigned USDFC tokens to the Stability Pool, in order to earn returns from liquidations, and receive SFC token issuance.

_**Redemption:**_ the act of swapping USDFC tokens with the system, in return for an equivalent value of FIL. Any account with a USDFC token balance may redeem them, whether or not they are a borrower.

When USDFC is redeemed for FIL, the FIL is always withdrawn from the lowest collateral Troves, in ascending order of their collateralization ratio. A redeemer can not selectively target Troves with which to swap USDFC for FIL.

_**Repayment:**_ when a borrower sends USDFC tokens to their own Trove, reducing their debt, and increasing their collateralization ratio.

_**Retrieval:**_ when a borrower with an active Trove withdraws some or all of their FIL collateral from their own trove, either reducing their collateralization ratio, or closing their Trove (if they have zero debt and withdraw all their FIL)

_**Liquidation:**_ the act of force-closing an undercollateralized Trove and redistributing its collateral and debt. When the Stability Pool is sufficiently large, the liquidated debt is offset with the Stability Pool, and the FIL distributed to depositors. If the liquidated debt can not be offset with the Pool, the system redistributes the liquidated collateral and debt directly to the active Troves with >110% collateralization ratio.

Liquidation functionality is permissionless and publicly available - anyone may liquidate an undercollateralized Trove, or batch liquidate Troves in ascending order of collateralization ratio.

_**Collateral Surplus**_: The difference between the dollar value of a Trove's FIL collateral, and the dollar value of its USDFC debt. In a full liquidation, this is the net gain earned by the recipients of the liquidation.

_**Offset:**_ cancellation of liquidated debt with USDFC in the Stability Pool, and assignment of liquidated collateral to Stability Pool depositors, in proportion to their deposit.

_**Redistribution:**_ assignment of liquidated debt and collateral directly to active Troves, in proportion to their collateral.

_**Pure offset:**_ when a Trove's debt is entirely cancelled with USDFC in the Stability Pool, and all of it's liquidated FIL collateral is assigned to Stability Providers.

_**Mixed offset and redistribution:**_ When the Stability Pool USDFC only covers a fraction of the liquidated Trove's debt. This fraction of debt is cancelled with USDFC in the Stability Pool, and an equal fraction of the Trove's collateral is assigned to depositors. The remaining collateral & debt is redistributed directly to active Troves.

_**Gas compensation:**_ A refund, in USDFC and FIL, automatically paid to the caller of a liquidation function, intended to at least cover the gas cost of the transaction. Designed to ensure that liquidators are not dissuaded by potentially high gas costs.

## Development

This monorepo is based on npm's feature. You might be able to install some of the packages individually with npm, but to make all interdependent packages see each other, you'll need to use npm.

In addition, some package scripts require Docker to be installed (Docker Desktop on Windows and Mac, Docker Engine on Linux).

### Prerequisites

You'll need to install the following:

- [Git](https://help.github.com/en/github/getting-started-with-github/set-up-git) (of course)
- [Node v20.x](https://nodejs.org/dist/latest-v20.x/)
- [Docker](https://docs.docker.com/get-docker/)

#### Making node-gyp work

USDFC protocol indirectly depends on some packages with native addons. To make sure these can be built, you'll have to take some additional steps. Refer to the subsection of [Installation](https://github.com/nodejs/node-gyp#installation) in node-gyp's README that corresponds to your operating system.

Note: you can skip the manual installation of node-gyp itself (`npm install -g node-gyp`), but you will need to install its prerequisites to make sure USDFC protocol can be installed.

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

#### Deploy contracts to a testnet

E.g.:

```
npm run deploy --network testnet
```

Supported networks are currently: testnet. The above command will deploy into the default channel (the one that's used by the public dev-frontend). To deploy into the internal channel instead:

```
npm run deploy --network testnet --channel internal
```

You can optionally specify an explicit gas price too:

```
npm run deploy --network testnet --gas-price 20
```

After a successful deployment, the addresses of the newly deployed contracts will be written to a version-controlled JSON file under `packages/lib-ethers/deployments/default`.

To publish a new deployment, you must execute the above command for all of the following combinations:

| Network | Channel |
| ------- | ------- |
| testnet | default |

At some point in the future, we will make this process automatic. Once you're done deploying to all the networks, execute the following command:

```
npm run save-live-version
```

This copies the contract artifacts to a version controlled area (`packages/lib/live`) then checks that you really did deploy to all the networks. Next you need to commit and push all changed files. The repo's GitHub workflow will then build a new Docker image of the frontend interfacing with the new addresses.

#### Start a local blockchain and deploy the contracts

TBD

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

In case of a redemption, the “last” trove affected by the transaction may end up being only partially redeemed from, which means that its ICR will change so that it needs to be reinserted at a different place in the sorted trove list (note that this is not the case for partial liquidations in recovery mode, which preserve the ICR). A special ICR hint therefore needs to be provided by the transaction sender for that matter, which may become incorrect if another transaction changes the order before the redemption is processed. The protocol gracefully handles this by terminating the redemption sequence at the last fully redeemed trove (see [here](#hints-for-redeemcollateral)).

An attacker trying to DoS redemptions could be bypassed by redeeming an amount that exactly corresponds to the debt of the affected trove(s).

The attack can be aggravated if a big trove is placed first in the queue, so that any incoming redemption is smaller than its debt, as no USDFC would be redeemed if the hint for that trove fails. But that attack would be very expensive and quite risky (risk of being redeemed if the strategy fails and of being liquidated as it may have a low CR).

Finally, this DoS could be avoided if the initial transaction avoids the public gas auction entirely and is sent direct-to-miner, via (for example) Flashbots.

## Disclaimer

The content of this readme document (“Readme”) is of purely informational nature. In particular, none of the content of the Readme shall be understood as advice provided by Secured Finance AG, any USDFC Project Team member or other contributor to the Readme, nor does any of these persons warrant the actuality and accuracy of the Readme.

Please read this Disclaimer carefully before accessing, interacting with, or using the USDFC protocol Software, consisting of the USDFC protocol technology stack as well as any other USDFC technology such as e.g., the launch kit for frontend operators (together the “USDFC protocol Software”).

While Secured Finance AG developed the USDFC protocol Software, the USDFC protocol Software runs in a fully decentralized and autonomous manner on the Filecoin network. Secured Finance AG is not involved in the operation of the USDFC protocol Software nor has it any control over transactions made using its smart contracts. Further, Secured Finance AG does neither enter into any relationship with users of the USDFC protocol Software and/or frontend operators, nor does it operate an own frontend. Any and all functionalities of the USDFC protocol Software, including the USDFC and the SFC, are of purely technical nature and there is no claim towards any private individual or legal entity in this regard.

SECURED FINANCE AG IS NOT LIABLE TO ANY USER FOR DAMAGES, INCLUDING ANY GENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE USE, IN CONNECTION WITH THE USE OR INABILITY TO USE THE USDFC PROTOCOL SOFTWARE (INCLUDING BUT NOT LIMITED TO LOSS OF FIL, USDFC OR SFC, NON-ALLOCATION OF TECHNICAL FEES TO SFC HOLDERS, LOSS OF DATA, BUSINESS INTERRUPTION, DATA BEING RENDERED INACCURATE OR OTHER LOSSES SUSTAINED BY A USER OR THIRD PARTIES AS A RESULT OF THE USDFC PROTOCOL SOFTWARE AND/OR ANY ACTIVITY OF A FRONTEND OPERATOR OR A FAILURE OF THE USDFC PROTOCOL SOFTWARE TO OPERATE WITH ANY OTHER SOFTWARE).

The USDFC protocol Software has been developed and published under the GNU GPL v3 open-source license, which forms an integral part of this disclaimer.

THE USDFC PROTOCOL SOFTWARE HAS BEEN PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. THE USDFC PROTOCOL SOFTWARE IS HIGHLY EXPERIMENTAL AND ANY REAL FIL AND/OR USDFC AND/OR SFC SENT, STAKED OR DEPOSITED TO THE USDFC PROTOCOL SOFTWARE ARE AT RISK OF BEING LOST INDEFINITELY, WITHOUT ANY KIND OF CONSIDERATION.

There are no official frontend operators, and the use of any frontend is made by users at their own risk. To assess the trustworthiness of a frontend operator lies in the sole responsibility of the users and must be made carefully.

User is solely responsible for complying with applicable law when interacting (in particular, when using FIL, USDFC, SFC or other Token) with the USDFC protocol Software whatsoever.
