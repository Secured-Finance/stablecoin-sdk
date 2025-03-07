<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-base](./stablecoin-lib-base.md) &gt; [SfStablecoinStore](./stablecoin-lib-base.sfstablecoinstore.md)

## SfStablecoinStore class

Abstract base class of protocol data store implementations.

**Signature:**

```typescript
export declare abstract class SfStablecoinStore<T = unknown> 
```

## Remarks

The type parameter `T` may be used to type extra state added to [SfStablecoinStoreState](./stablecoin-lib-base.sfstablecoinstorestate.md) by the subclass.

Implemented by [BlockPolledSfStablecoinStore](./stablecoin-lib-ethers.blockpolledsfstablecoinstore.md)<!-- -->.

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

[logging](./stablecoin-lib-base.sfstablecoinstore.logging.md)


</td><td>


</td><td>

boolean


</td><td>

Turn console logging on/off.


</td></tr>
<tr><td>

[onLoaded?](./stablecoin-lib-base.sfstablecoinstore.onloaded.md)


</td><td>


</td><td>

() =&gt; void


</td><td>

_(Optional)_ Called after the state is fetched for the first time.


</td></tr>
<tr><td>

[state](./stablecoin-lib-base.sfstablecoinstore.state.md)


</td><td>


</td><td>

[SfStablecoinStoreState](./stablecoin-lib-base.sfstablecoinstorestate.md)<!-- -->&lt;T&gt;


</td><td>

The current store state.


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

[start()](./stablecoin-lib-base.sfstablecoinstore.start.md)


</td><td>


</td><td>

Start monitoring the blockchain for protocol state changes.


</td></tr>
<tr><td>

[subscribe(listener)](./stablecoin-lib-base.sfstablecoinstore.subscribe.md)


</td><td>


</td><td>

Register a state change listener.


</td></tr>
</tbody></table>
