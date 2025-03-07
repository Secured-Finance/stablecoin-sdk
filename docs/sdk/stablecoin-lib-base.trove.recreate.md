<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-base](./stablecoin-lib-base.md) &gt; [Trove](./stablecoin-lib-base.trove.md) &gt; [recreate](./stablecoin-lib-base.trove.recreate.md)

## Trove.recreate() method

Calculate the parameters of an [openTrove()](./stablecoin-lib-base.transactableprotocol.opentrove.md) transaction that will result in the given Trove.

**Signature:**

```typescript
static recreate(that: Trove, borrowingRate?: Decimalish): TroveCreationParams<Decimal>;
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

that


</td><td>

[Trove](./stablecoin-lib-base.trove.md)


</td><td>

The Trove to recreate.


</td></tr>
<tr><td>

borrowingRate


</td><td>

[Decimalish](./stablecoin-lib-base.decimalish.md)


</td><td>

Current borrowing rate.


</td></tr>
</tbody></table>
**Returns:**

[TroveCreationParams](./stablecoin-lib-base.trovecreationparams.md)<!-- -->&lt;[Decimal](./stablecoin-lib-base.decimal.md)<!-- -->&gt;

