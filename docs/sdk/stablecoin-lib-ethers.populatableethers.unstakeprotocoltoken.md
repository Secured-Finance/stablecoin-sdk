<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-ethers](./stablecoin-lib-ethers.md) &gt; [PopulatableEthers](./stablecoin-lib-ethers.populatableethers.md) &gt; [unstakeProtocolToken](./stablecoin-lib-ethers.populatableethers.unstakeprotocoltoken.md)

## PopulatableEthers.unstakeProtocolToken() method

Withdraw ProtocolToken from staking.

**Signature:**

```typescript
unstakeProtocolToken(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersTransaction<void>>;
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

Amount of ProtocolToken to withdraw.


</td></tr>
<tr><td>

overrides


</td><td>

[EthersTransactionOverrides](./stablecoin-lib-ethers.etherstransactionoverrides.md)


</td><td>


</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[PopulatedEthersTransaction](./stablecoin-lib-ethers.populatedetherstransaction.md)<!-- -->&lt;void&gt;&gt;

## Remarks

As a side-effect, the transaction will also pay out the ProtocolToken stake's [collateral gain](./stablecoin-lib-base.protocoltokenstake.collateralgain.md) and [DebtToken gain](./stablecoin-lib-base.protocoltokenstake.debttokengain.md)<!-- -->.

