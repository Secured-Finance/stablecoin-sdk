<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-ethers](./stablecoin-lib-ethers.md) &gt; [PopulatedEthersTransaction](./stablecoin-lib-ethers.populatedetherstransaction.md)

## PopulatedEthersTransaction class

A transaction that has been prepared for sending.

**Signature:**

```typescript
export declare class PopulatedEthersTransaction<T = unknown> implements PopulatedTransactionInterface<EthersPopulatedTransaction, SentEthersTransaction<T>> 
```
**Implements:** [PopulatedTransactionInterface](./stablecoin-lib-base.populatedtransactioninterface.md)<!-- -->&lt;[EthersPopulatedTransaction](./stablecoin-lib-ethers.etherspopulatedtransaction.md)<!-- -->, [SentEthersTransaction](./stablecoin-lib-ethers.sentetherstransaction.md)<!-- -->&lt;T&gt;&gt;

## Remarks

Returned by [PopulatableEthers](./stablecoin-lib-ethers.populatableethers.md) functions.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `PopulatedEthersTransaction` class.

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

[gasHeadroom?](./stablecoin-lib-ethers.populatedetherstransaction.gasheadroom.md)


</td><td>


</td><td>

number


</td><td>

_(Optional)_ Extra gas added to the transaction's `gasLimit` on top of the estimated minimum requirement.


</td></tr>
<tr><td>

[rawPopulatedTransaction](./stablecoin-lib-ethers.populatedetherstransaction.rawpopulatedtransaction.md)


</td><td>


</td><td>

[EthersPopulatedTransaction](./stablecoin-lib-ethers.etherspopulatedtransaction.md)


</td><td>

Unsigned transaction object populated by Ethers.


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

[send()](./stablecoin-lib-ethers.populatedetherstransaction.send.md)


</td><td>


</td><td>

Send the transaction.


</td></tr>
</tbody></table>
