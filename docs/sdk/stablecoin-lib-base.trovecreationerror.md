<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-base](./stablecoin-lib-base.md) &gt; [TroveCreationError](./stablecoin-lib-base.trovecreationerror.md)

## TroveCreationError type

Describes why a Trove could not be created.

**Signature:**

```typescript
export type TroveCreationError = "missingLiquidationReserve";
```

## Remarks

See [TroveChange](./stablecoin-lib-base.trovechange.md)<!-- -->.

<h2>Possible values</h2>

<table>

<tr> <th> Value </th> <th> Reason </th> </tr>

<tr> <td> "missingLiquidationReserve" </td> <td> A Trove's debt cannot be less than the liquidation reserve. </td> </tr>

</table>

More errors may be added in the future.

