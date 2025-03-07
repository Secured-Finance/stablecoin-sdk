<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-base](./stablecoin-lib-base.md) &gt; [TransactableProtocol](./stablecoin-lib-base.transactableprotocol.md) &gt; [stakeProtocolToken](./stablecoin-lib-base.transactableprotocol.stakeprotocoltoken.md)

## TransactableProtocol.stakeProtocolToken() method

Stake ProtocolToken to start earning fee revenue or increase existing stake.

**Signature:**

```typescript
stakeProtocolToken(amount: Decimalish): Promise<void>;
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

Amount of ProtocolToken to add to new or existing stake.


</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Exceptions

Throws [TransactionFailedError](./stablecoin-lib-base.transactionfailederror.md) in case of transaction failure.

## Remarks

As a side-effect, the transaction will also pay out an existing ProtocolToken stake's [collateral gain](./stablecoin-lib-base.protocoltokenstake.collateralgain.md) and [DebtToken gain](./stablecoin-lib-base.protocoltokenstake.debttokengain.md)<!-- -->.

