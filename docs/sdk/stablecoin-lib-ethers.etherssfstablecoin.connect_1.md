<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-ethers](./stablecoin-lib-ethers.md) &gt; [EthersSfStablecoin](./stablecoin-lib-ethers.etherssfstablecoin.md) &gt; [connect](./stablecoin-lib-ethers.etherssfstablecoin.connect_1.md)

## EthersSfStablecoin.connect() method

Connect to the protocol and create an `EthersSfStablecoin` object.

**Signature:**

```typescript
static connect(signerOrProvider: EthersSigner | EthersProvider, optionalParams?: EthersConnectionOptionalParams): Promise<EthersSfStablecoin>;
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

signerOrProvider


</td><td>

[EthersSigner](./stablecoin-lib-ethers.etherssigner.md) \| [EthersProvider](./stablecoin-lib-ethers.ethersprovider.md)


</td><td>

Ethers `Signer` or `Provider` to use for connecting to the Ethereum network.


</td></tr>
<tr><td>

optionalParams


</td><td>

[EthersConnectionOptionalParams](./stablecoin-lib-ethers.ethersconnectionoptionalparams.md)


</td><td>

Optional parameters that can be used to customize the connection.


</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[EthersSfStablecoin](./stablecoin-lib-ethers.etherssfstablecoin.md)<!-- -->&gt;

