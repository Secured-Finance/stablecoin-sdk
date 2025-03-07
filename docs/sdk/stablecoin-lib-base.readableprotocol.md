<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-base](./stablecoin-lib-base.md) &gt; [ReadableProtocol](./stablecoin-lib-base.readableprotocol.md)

## ReadableProtocol interface

Read the state of the protocol.

**Signature:**

```typescript
export interface ReadableProtocol 
```

## Remarks

Implemented by [EthersSfStablecoin](./stablecoin-lib-ethers.etherssfstablecoin.md)<!-- -->.

## Methods

<table><thead><tr><th>

Method


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[findHintsForNominalCollateralRatio(nominalCollateralRatio)](./stablecoin-lib-base.readableprotocol.findhintsfornominalcollateralratio.md)


</td><td>

Find the hints for a given nominal collateral ratio.


</td></tr>
<tr><td>

[findRedemptionHints(amount)](./stablecoin-lib-base.readableprotocol.findredemptionhints.md)


</td><td>

Find the redemption hints for a given address.


</td></tr>
<tr><td>

[getCollateralSurplusBalance(address)](./stablecoin-lib-base.readableprotocol.getcollateralsurplusbalance.md)


</td><td>

Get the amount of leftover collateral available for withdrawal by an address.


</td></tr>
<tr><td>

[getDebtTokenBalance(address)](./stablecoin-lib-base.readableprotocol.getdebttokenbalance.md)


</td><td>

Get the amount of DebtToken held by an address.


</td></tr>
<tr><td>

[getDebtTokenInStabilityPool()](./stablecoin-lib-base.readableprotocol.getdebttokeninstabilitypool.md)


</td><td>

Get the total amount of DebtToken currently deposited in the Stability Pool.


</td></tr>
<tr><td>

[getFees()](./stablecoin-lib-base.readableprotocol.getfees.md)


</td><td>

Get a calculator for current fees.


</td></tr>
<tr><td>

[getFrontendStatus(address)](./stablecoin-lib-base.readableprotocol.getfrontendstatus.md)


</td><td>

Check whether an address is registered as a frontend, and what its kickback rate is.


</td></tr>
<tr><td>

[getLiquidityMiningProtocolTokenReward(address)](./stablecoin-lib-base.readableprotocol.getliquidityminingprotocoltokenreward.md)


</td><td>

Get the amount of ProtocolToken earned by an address through mining liquidity.


</td></tr>
<tr><td>

[getLiquidityMiningStake(address)](./stablecoin-lib-base.readableprotocol.getliquidityminingstake.md)


</td><td>

Get the amount of Uniswap FIL/DebtToken LP tokens currently staked by an address in liquidity mining.


</td></tr>
<tr><td>

[getNumberOfTroves()](./stablecoin-lib-base.readableprotocol.getnumberoftroves.md)


</td><td>

Get number of Troves that are currently open.


</td></tr>
<tr><td>

[getPrice()](./stablecoin-lib-base.readableprotocol.getprice.md)


</td><td>

Get the current price of the native currency (e.g. Ether) in USD.


</td></tr>
<tr><td>

[getProtocolTokenBalance(address)](./stablecoin-lib-base.readableprotocol.getprotocoltokenbalance.md)


</td><td>

Get the amount of ProtocolToken held by an address.


</td></tr>
<tr><td>

[getProtocolTokenStake(address)](./stablecoin-lib-base.readableprotocol.getprotocoltokenstake.md)


</td><td>

Get the current state of an ProtocolToken Stake.


</td></tr>
<tr><td>

[getRemainingProtocolMiningProtocolTokenReward()](./stablecoin-lib-base.readableprotocol.getremainingprotocolminingprotocoltokenreward.md)


</td><td>

Get the remaining ProtocolToken that will be collectively rewarded to liquidity miners.


</td></tr>
<tr><td>

[getRemainingStabilityPoolProtocolTokenReward()](./stablecoin-lib-base.readableprotocol.getremainingstabilitypoolprotocoltokenreward.md)


</td><td>

Get the remaining ProtocolToken that will be collectively rewarded to stability depositors.


</td></tr>
<tr><td>

[getStabilityDeposit(address)](./stablecoin-lib-base.readableprotocol.getstabilitydeposit.md)


</td><td>

Get the current state of a Stability Deposit.


</td></tr>
<tr><td>

[getTotal()](./stablecoin-lib-base.readableprotocol.gettotal.md)


</td><td>

Get the total amount of collateral and debt in the system.


</td></tr>
<tr><td>

[getTotalRedistributed()](./stablecoin-lib-base.readableprotocol.gettotalredistributed.md)


</td><td>

Get the total collateral and debt per stake that has been liquidated through redistribution.


</td></tr>
<tr><td>

[getTotalStakedProtocolToken()](./stablecoin-lib-base.readableprotocol.gettotalstakedprotocoltoken.md)


</td><td>

Get the total amount of ProtocolToken currently staked.


</td></tr>
<tr><td>

[getTotalStakedUniTokens()](./stablecoin-lib-base.readableprotocol.gettotalstakedunitokens.md)


</td><td>

Get the total amount of Uniswap FIL/DebtToken LP tokens currently staked in liquidity mining.


</td></tr>
<tr><td>

[getTrove(address)](./stablecoin-lib-base.readableprotocol.gettrove.md)


</td><td>

Get the current state of a Trove.


</td></tr>
<tr><td>

[getTroveBeforeRedistribution(address)](./stablecoin-lib-base.readableprotocol.gettrovebeforeredistribution.md)


</td><td>

Get a Trove in its state after the last direct modification.


</td></tr>
<tr><td>

[getTroves(params)](./stablecoin-lib-base.readableprotocol.gettroves_1.md)


</td><td>

Get a slice from the list of Troves.


</td></tr>
<tr><td>

[getUniTokenAllowance(address)](./stablecoin-lib-base.readableprotocol.getunitokenallowance.md)


</td><td>

Get the liquidity mining contract's allowance of a holder's Uniswap FIL/DebtToken LP tokens.


</td></tr>
<tr><td>

[getUniTokenBalance(address)](./stablecoin-lib-base.readableprotocol.getunitokenbalance.md)


</td><td>

Get the amount of Uniswap FIL/DebtToken LP tokens held by an address.


</td></tr>
</tbody></table>
