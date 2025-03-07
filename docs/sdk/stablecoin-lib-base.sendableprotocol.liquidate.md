<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-base](./stablecoin-lib-base.md) &gt; [SendableProtocol](./stablecoin-lib-base.sendableprotocol.md) &gt; [liquidate](./stablecoin-lib-base.sendableprotocol.liquidate.md)

## SendableProtocol.liquidate() method

Liquidate one or more undercollateralized Troves.

**Signature:**

```typescript
liquidate(address: string | string[]): Promise<SentProtocolTransaction<S, ProtocolReceipt<R, LiquidationDetails>>>;
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

address


</td><td>

string \| string\[\]


</td><td>

Address or array of addresses whose Troves to liquidate.


</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[SentProtocolTransaction](./stablecoin-lib-base.sentprotocoltransaction.md)<!-- -->&lt;S, [ProtocolReceipt](./stablecoin-lib-base.protocolreceipt.md)<!-- -->&lt;R, [LiquidationDetails](./stablecoin-lib-base.liquidationdetails.md)<!-- -->&gt;&gt;&gt;

