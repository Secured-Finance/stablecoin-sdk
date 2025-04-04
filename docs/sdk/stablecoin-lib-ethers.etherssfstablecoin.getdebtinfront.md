<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-ethers](./stablecoin-lib-ethers.md) &gt; [EthersSfStablecoin](./stablecoin-lib-ethers.etherssfstablecoin.md) &gt; [getDebtInFront](./stablecoin-lib-ethers.etherssfstablecoin.getdebtinfront.md)

## EthersSfStablecoin.getDebtInFront() method

Get the Debt in front of a given address.

**Signature:**

```typescript
getDebtInFront(address: string, iterations: number, overrides?: EthersCallOverrides): Promise<[debt: Decimal, next: string]>;
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

string


</td><td>

The address to get the Debt in front of.


</td></tr>
<tr><td>

iterations


</td><td>

number


</td><td>

The number of iterations to run the calculation for.


</td></tr>
<tr><td>

overrides


</td><td>

[EthersCallOverrides](./stablecoin-lib-ethers.etherscalloverrides.md)


</td><td>


</td></tr>
</tbody></table>
**Returns:**

Promise&lt;\[debt: [Decimal](./stablecoin-lib-base.decimal.md)<!-- -->, next: string\]&gt;

