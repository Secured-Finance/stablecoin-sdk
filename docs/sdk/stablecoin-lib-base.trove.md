<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-base](./stablecoin-lib-base.md) &gt; [Trove](./stablecoin-lib-base.trove.md)

## Trove class

A combination of collateral and debt.

**Signature:**

```typescript
export declare class Trove 
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Trove` class.

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

[collateral](./stablecoin-lib-base.trove.collateral.md)


</td><td>


</td><td>

[Decimal](./stablecoin-lib-base.decimal.md)


</td><td>

Amount of native currency (e.g. Ether) collateralized.


</td></tr>
<tr><td>

[debt](./stablecoin-lib-base.trove.debt.md)


</td><td>


</td><td>

[Decimal](./stablecoin-lib-base.decimal.md)


</td><td>

Amount of DebtToken owed.


</td></tr>
<tr><td>

[isEmpty](./stablecoin-lib-base.trove.isempty.md)


</td><td>


</td><td>

boolean


</td><td>


</td></tr>
<tr><td>

[netDebt](./stablecoin-lib-base.trove.netdebt.md)


</td><td>


</td><td>

[Decimal](./stablecoin-lib-base.decimal.md)


</td><td>

Amount of DebtToken that must be repaid to close this Trove.


</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method


</th><th>

Modifiers


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[add(that)](./stablecoin-lib-base.trove.add.md)


</td><td>


</td><td>


</td></tr>
<tr><td>

[addCollateral(collateral)](./stablecoin-lib-base.trove.addcollateral.md)


</td><td>


</td><td>


</td></tr>
<tr><td>

[addDebt(debt)](./stablecoin-lib-base.trove.adddebt.md)


</td><td>


</td><td>


</td></tr>
<tr><td>

[adjust(params, borrowingRate)](./stablecoin-lib-base.trove.adjust.md)


</td><td>


</td><td>

Calculate the result of an [adjustTrove()](./stablecoin-lib-base.transactableprotocol.adjusttrove.md) transaction on this Trove.


</td></tr>
<tr><td>

[adjustTo(that, borrowingRate)](./stablecoin-lib-base.trove.adjustto.md)


</td><td>


</td><td>

Calculate the parameters of an [adjustTrove()](./stablecoin-lib-base.transactableprotocol.adjusttrove.md) transaction that will change this Trove into the given Trove.


</td></tr>
<tr><td>

[apply(change, borrowingRate)](./stablecoin-lib-base.trove.apply.md)


</td><td>


</td><td>

Make a new Trove by applying a [TroveChange](./stablecoin-lib-base.trovechange.md) to this Trove.


</td></tr>
<tr><td>

[collateralRatio(price)](./stablecoin-lib-base.trove.collateralratio.md)


</td><td>


</td><td>

Calculate the Trove's collateralization ratio at a given price.


</td></tr>
<tr><td>

[collateralRatioIsBelowCritical(price)](./stablecoin-lib-base.trove.collateralratioisbelowcritical.md)


</td><td>


</td><td>

Whether the collateralization ratio is less than the [CRITICAL\_COLLATERAL\_RATIO](./stablecoin-lib-base.critical_collateral_ratio.md) at a given price.


</td></tr>
<tr><td>

[collateralRatioIsBelowMinimum(price)](./stablecoin-lib-base.trove.collateralratioisbelowminimum.md)


</td><td>


</td><td>

Whether the Trove is undercollateralized at a given price.


</td></tr>
<tr><td>

[create(params, borrowingRate)](./stablecoin-lib-base.trove.create.md)


</td><td>

`static`


</td><td>

Calculate the result of an [openTrove()](./stablecoin-lib-base.transactableprotocol.opentrove.md) transaction.


</td></tr>
<tr><td>

[equals(that)](./stablecoin-lib-base.trove.equals.md)


</td><td>


</td><td>


</td></tr>
<tr><td>

[isOpenableInRecoveryMode(price)](./stablecoin-lib-base.trove.isopenableinrecoverymode.md)


</td><td>


</td><td>

Whether the Trove is sufficiently collateralized to be opened during recovery mode.


</td></tr>
<tr><td>

[multiply(multiplier)](./stablecoin-lib-base.trove.multiply.md)


</td><td>


</td><td>


</td></tr>
<tr><td>

[recreate(that, borrowingRate)](./stablecoin-lib-base.trove.recreate.md)


</td><td>

`static`


</td><td>

Calculate the parameters of an [openTrove()](./stablecoin-lib-base.transactableprotocol.opentrove.md) transaction that will result in the given Trove.


</td></tr>
<tr><td>

[setCollateral(collateral)](./stablecoin-lib-base.trove.setcollateral.md)


</td><td>


</td><td>


</td></tr>
<tr><td>

[setDebt(debt)](./stablecoin-lib-base.trove.setdebt.md)


</td><td>


</td><td>


</td></tr>
<tr><td>

[subtract(that)](./stablecoin-lib-base.trove.subtract.md)


</td><td>


</td><td>


</td></tr>
<tr><td>

[subtractCollateral(collateral)](./stablecoin-lib-base.trove.subtractcollateral.md)


</td><td>


</td><td>


</td></tr>
<tr><td>

[subtractDebt(debt)](./stablecoin-lib-base.trove.subtractdebt.md)


</td><td>


</td><td>


</td></tr>
<tr><td>

[whatChanged(that, borrowingRate)](./stablecoin-lib-base.trove.whatchanged.md)


</td><td>


</td><td>

Calculate the difference between this Trove and another.


</td></tr>
</tbody></table>
