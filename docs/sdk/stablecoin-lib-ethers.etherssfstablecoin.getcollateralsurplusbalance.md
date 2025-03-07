<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-ethers](./stablecoin-lib-ethers.md) &gt; [EthersSfStablecoin](./stablecoin-lib-ethers.etherssfstablecoin.md) &gt; [getCollateralSurplusBalance](./stablecoin-lib-ethers.etherssfstablecoin.getcollateralsurplusbalance.md)

## EthersSfStablecoin.getCollateralSurplusBalance() method

Get the amount of leftover collateral available for withdrawal by an address.

**Signature:**

```typescript
getCollateralSurplusBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
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


</td></tr>
<tr><td>

overrides


</td><td>

[EthersCallOverrides](./stablecoin-lib-ethers.etherscalloverrides.md)


</td><td>


</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[Decimal](./stablecoin-lib-base.decimal.md)<!-- -->&gt;

## Remarks

When a Trove gets liquidated or redeemed, any collateral it has above 110% (in case of liquidation) or 100% collateralization (in case of redemption) gets sent to a pool, where it can be withdrawn from using [claimCollateralSurplus()](./stablecoin-lib-base.transactableprotocol.claimcollateralsurplus.md)<!-- -->.

