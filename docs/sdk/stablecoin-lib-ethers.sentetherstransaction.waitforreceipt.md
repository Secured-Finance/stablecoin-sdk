<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-ethers](./stablecoin-lib-ethers.md) &gt; [SentEthersTransaction](./stablecoin-lib-ethers.sentetherstransaction.md) &gt; [waitForReceipt](./stablecoin-lib-ethers.sentetherstransaction.waitforreceipt.md)

## SentEthersTransaction.waitForReceipt() method

Wait for the transaction to be mined, and check whether it was successful.

**Signature:**

```typescript
waitForReceipt(): Promise<MinedReceipt<EthersTransactionReceipt, T>>;
```
**Returns:**

Promise&lt;[MinedReceipt](./stablecoin-lib-base.minedreceipt.md)<!-- -->&lt;[EthersTransactionReceipt](./stablecoin-lib-ethers.etherstransactionreceipt.md)<!-- -->, T&gt;&gt;

Either a [FailedReceipt](./stablecoin-lib-base.failedreceipt.md) or a [SuccessfulReceipt](./stablecoin-lib-base.successfulreceipt.md)<!-- -->.

## Exceptions

Throws [EthersTransactionCancelledError](./stablecoin-lib-ethers.etherstransactioncancellederror.md) if the transaction is cancelled or replaced.

