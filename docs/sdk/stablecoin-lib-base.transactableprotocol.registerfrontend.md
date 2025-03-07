<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-base](./stablecoin-lib-base.md) &gt; [TransactableProtocol](./stablecoin-lib-base.transactableprotocol.md) &gt; [registerFrontend](./stablecoin-lib-base.transactableprotocol.registerfrontend.md)

## TransactableProtocol.registerFrontend() method

Register current wallet address as a frontend.

**Signature:**

```typescript
registerFrontend(kickbackRate: Decimalish): Promise<void>;
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

kickbackRate


</td><td>

[Decimalish](./stablecoin-lib-base.decimalish.md)


</td><td>

The portion of ProtocolToken rewards to pass onto users of the frontend (between 0 and 1).


</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Exceptions

Throws [TransactionFailedError](./stablecoin-lib-base.transactionfailederror.md) in case of transaction failure.

