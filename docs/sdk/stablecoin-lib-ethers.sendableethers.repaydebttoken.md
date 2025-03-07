<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-ethers](./stablecoin-lib-ethers.md) &gt; [SendableEthers](./stablecoin-lib-ethers.sendableethers.md) &gt; [repayDebtToken](./stablecoin-lib-ethers.sendableethers.repaydebttoken.md)

## SendableEthers.repayDebtToken() method

Adjust existing Trove by repaying some of its debt.

**Signature:**

```typescript
repayDebtToken(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<TroveAdjustmentDetails>>;
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

amount


</td><td>

[Decimalish](./stablecoin-lib-base.decimalish.md)


</td><td>

The amount of DebtToken to repay.


</td></tr>
<tr><td>

overrides


</td><td>

[EthersTransactionOverrides](./stablecoin-lib-ethers.etherstransactionoverrides.md)


</td><td>


</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[SentEthersTransaction](./stablecoin-lib-ethers.sentetherstransaction.md)<!-- -->&lt;[TroveAdjustmentDetails](./stablecoin-lib-base.troveadjustmentdetails.md)<!-- -->&gt;&gt;

## Remarks

Equivalent to:

```typescript
adjustTrove({ repayDebtToken: amount })
```

