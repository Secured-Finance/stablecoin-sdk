<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-base](./stablecoin-lib-base.md) &gt; [TransactableProtocol](./stablecoin-lib-base.transactableprotocol.md) &gt; [unstakeUniTokens](./stablecoin-lib-base.transactableprotocol.unstakeunitokens.md)

## TransactableProtocol.unstakeUniTokens() method

Withdraw Uniswap FIL/DebtToken LP tokens from liquidity mining.

**Signature:**

```typescript
unstakeUniTokens(amount: Decimalish): Promise<void>;
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

Amount of LP tokens to withdraw.


</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Exceptions

Throws [TransactionFailedError](./stablecoin-lib-base.transactionfailederror.md) in case of transaction failure.

