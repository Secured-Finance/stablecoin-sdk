<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-ethers](./stablecoin-lib-ethers.md) &gt; [EthersSfStablecoin](./stablecoin-lib-ethers.etherssfstablecoin.md) &gt; [claimCollateralSurplus](./stablecoin-lib-ethers.etherssfstablecoin.claimcollateralsurplus.md)

## EthersSfStablecoin.claimCollateralSurplus() method

Claim leftover collateral after a liquidation or redemption.

**Signature:**

```typescript
claimCollateralSurplus(overrides?: EthersTransactionOverrides): Promise<void>;
```

## Parameters

<table><thead><tr><th>

Parameter


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

overrides


</td><td>

[EthersTransactionOverrides](./stablecoin-lib-ethers.etherstransactionoverrides.md)


</td><td>


</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Exceptions

Throws [EthersTransactionFailedError](./stablecoin-lib-ethers.etherstransactionfailederror.md) in case of transaction failure. Throws [EthersTransactionCancelledError](./stablecoin-lib-ethers.etherstransactioncancellederror.md) if the transaction is cancelled or replaced.

## Remarks

Use [getCollateralSurplusBalance()](./stablecoin-lib-base.readableprotocol.getcollateralsurplusbalance.md) to check the amount of collateral available for withdrawal.

