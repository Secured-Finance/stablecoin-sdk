<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@secured-finance/stablecoin-lib-base](./stablecoin-lib-base.md) &gt; [ProtocolTokenStakeChange](./stablecoin-lib-base.protocoltokenstakechange.md)

## ProtocolTokenStakeChange type

Represents the change between two states of an ProtocolToken Stake.

**Signature:**

```typescript
export type ProtocolTokenStakeChange<T> = {
    stakeProtocolToken: T;
    unstakeProtocolToken?: undefined;
} | {
    stakeProtocolToken?: undefined;
    unstakeProtocolToken: T;
    unstakeAllProtocolToken: boolean;
};
```
