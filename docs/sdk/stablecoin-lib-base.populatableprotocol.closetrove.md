<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-base](./stablecoin-lib-base.md) &gt; [PopulatableProtocol](./stablecoin-lib-base.populatableprotocol.md) &gt; [closeTrove](./stablecoin-lib-base.populatableprotocol.closetrove.md)

## PopulatableProtocol.closeTrove() method

Close existing Trove by repaying all debt and withdrawing all collateral.

**Signature:**

```typescript
closeTrove(): Promise<PopulatedTransactionInterface<P, SentProtocolTransaction<S, ProtocolReceipt<R, TroveClosureDetails>>>>;
```
**Returns:**

Promise&lt;[PopulatedTransactionInterface](./stablecoin-lib-base.populatedtransactioninterface.md)<!-- -->&lt;P, [SentProtocolTransaction](./stablecoin-lib-base.sentprotocoltransaction.md)<!-- -->&lt;S, [ProtocolReceipt](./stablecoin-lib-base.protocolreceipt.md)<!-- -->&lt;R, [TroveClosureDetails](./stablecoin-lib-base.troveclosuredetails.md)<!-- -->&gt;&gt;&gt;&gt;

