<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-ethers](./stablecoin-lib-ethers.md) &gt; [EthersSfStablecoin](./stablecoin-lib-ethers.etherssfstablecoin.md) &gt; [closeTrove](./stablecoin-lib-ethers.etherssfstablecoin.closetrove.md)

## EthersSfStablecoin.closeTrove() method

Close existing Trove by repaying all debt and withdrawing all collateral.

**Signature:**

```typescript
closeTrove(overrides?: EthersTransactionOverrides): Promise<TroveClosureDetails>;
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

Promise&lt;[TroveClosureDetails](./stablecoin-lib-base.troveclosuredetails.md)<!-- -->&gt;

## Exceptions

Throws [EthersTransactionFailedError](./stablecoin-lib-ethers.etherstransactionfailederror.md) in case of transaction failure. Throws [EthersTransactionCancelledError](./stablecoin-lib-ethers.etherstransactioncancellederror.md) if the transaction is cancelled or replaced.

