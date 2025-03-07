<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-base](./stablecoin-lib-base.md) &gt; [RedemptionDetails](./stablecoin-lib-base.redemptiondetails.md)

## RedemptionDetails interface

Details of a [redeemDebtToken()](./stablecoin-lib-base.transactableprotocol.redeemdebttoken.md) transaction.

**Signature:**

```typescript
export interface RedemptionDetails 
```

## Properties

<table><thead><tr><th>

Property


</th><th>

Modifiers


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[actualDebtTokenAmount](./stablecoin-lib-base.redemptiondetails.actualdebttokenamount.md)


</td><td>


</td><td>

[Decimal](./stablecoin-lib-base.decimal.md)


</td><td>

Amount of DebtToken that was actually redeemed by the transaction.


</td></tr>
<tr><td>

[attemptedDebtTokenAmount](./stablecoin-lib-base.redemptiondetails.attempteddebttokenamount.md)


</td><td>


</td><td>

[Decimal](./stablecoin-lib-base.decimal.md)


</td><td>

Amount of DebtToken the redeemer tried to redeem.


</td></tr>
<tr><td>

[collateralTaken](./stablecoin-lib-base.redemptiondetails.collateraltaken.md)


</td><td>


</td><td>

[Decimal](./stablecoin-lib-base.decimal.md)


</td><td>

Amount of collateral (e.g. Ether) taken from Troves by the transaction.


</td></tr>
<tr><td>

[fee](./stablecoin-lib-base.redemptiondetails.fee.md)


</td><td>


</td><td>

[Decimal](./stablecoin-lib-base.decimal.md)


</td><td>

Amount of native currency (e.g. Ether) deducted as fee from collateral taken.


</td></tr>
</tbody></table>
