<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-ethers](./stablecoin-lib-ethers.md) &gt; [SendableEthers](./stablecoin-lib-ethers.sendableethers.md) &gt; [openTrove](./stablecoin-lib-ethers.sendableethers.opentrove.md)

## SendableEthers.openTrove() method

Open a new Trove by depositing collateral and borrowing DebtToken.

**Signature:**

```typescript
openTrove(params: TroveCreationParams<Decimalish>, maxBorrowingRateOrOptionalParams?: Decimalish | BorrowingOperationOptionalParams, overrides?: EthersTransactionOverrides): Promise<SentEthersTransaction<TroveCreationDetails>>;
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

params


</td><td>

[TroveCreationParams](./stablecoin-lib-base.trovecreationparams.md)<!-- -->&lt;[Decimalish](./stablecoin-lib-base.decimalish.md)<!-- -->&gt;


</td><td>

How much to deposit and borrow.


</td></tr>
<tr><td>

maxBorrowingRateOrOptionalParams


</td><td>

[Decimalish](./stablecoin-lib-base.decimalish.md) \| [BorrowingOperationOptionalParams](./stablecoin-lib-ethers.borrowingoperationoptionalparams.md)


</td><td>


</td></tr>
<tr><td>

overrides


</td><td>

[EthersTransactionOverrides](./stablecoin-lib-ethers.etherstransactionoverrides.md)


</td><td>


</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[SentEthersTransaction](./stablecoin-lib-ethers.sentetherstransaction.md)<!-- -->&lt;[TroveCreationDetails](./stablecoin-lib-base.trovecreationdetails.md)<!-- -->&gt;&gt;

## Remarks

If `maxBorrowingRate` is omitted, the current borrowing rate plus 0.5% is used as maximum acceptable rate.

