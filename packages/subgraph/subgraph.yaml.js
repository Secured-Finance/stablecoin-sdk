const fs = require("fs");

const network = process.argv[2] || "mainnet";
const {
  addresses,
  startBlock
} = require(`@secured-finance/stablecoin-lib-ethers/deployments/${network}.json`);

console.log(`Preparing subgraph manifest for network "${network}"`);

const yaml = (strings, ...keys) =>
  strings
    .flatMap((string, i) => [string, Array.isArray(keys[i]) ? keys[i].join("") : keys[i]])
    .join("")
    .substring(1); // Skip initial newline

const manifest = yaml`
specVersion: 0.0.2
description: This protocol is a decentralized borrowing protocol offering interest-free liquidity against collateral in Filecoin.
repository: https://github.com/Secured-Finance/stablecoin-sdk/tree/main/packages/subgraph
schema:
  file: ./schema.graphql
dataSources:
  - name: TroveManager
    kind: ethereum/contract
    network: mainnet
    source:
      abi: TroveManager
      address: "${addresses.troveManager}"
      startBlock: ${startBlock}
    mapping:
      file: ./src/mappings/TroveManager.ts
      language: wasm/assemblyscript
      kind: ethereum/events
      apiVersion: 0.0.5
      entities:
        - Global
        - User
        - Transaction
        - Trove
        - TroveChange
        - Redemption
        - Liquidation
        - SystemState
      abis:
        - name: TroveManager
          file: ../lib-ethers/abi/TroveManager.json
      eventHandlers:
        - event: TroveUpdated(indexed address,uint256,uint256,uint256,uint8)
          handler: handleTroveUpdated
        - event: TroveLiquidated(indexed address,uint256,uint256,uint8)
          handler: handleTroveLiquidated
        - event: Liquidation(uint256,uint256,uint256,uint256)
          handler: handleLiquidation
        - event: Redemption(uint256,uint256,uint256,uint256)
          handler: handleRedemption
        - event: LTermsUpdated(uint256,uint256)
          handler: handleLTermsUpdated
  - name: BorrowerOperations
    kind: ethereum/contract
    network: mainnet
    source:
      abi: BorrowerOperations
      address: "${addresses.borrowerOperations}"
      startBlock: ${startBlock}
    mapping:
      file: ./src/mappings/BorrowerOperations.ts
      language: wasm/assemblyscript
      kind: ethereum/events
      apiVersion: 0.0.5
      entities:
        - Global
        - User
        - Transaction
        - Trove
        - TroveChange
        - SystemState
      abis:
        - name: BorrowerOperations
          file: ../lib-ethers/abi/BorrowerOperations.json
      eventHandlers:
        - event: TroveUpdated(indexed address,uint256,uint256,uint256,uint8)
          handler: handleTroveUpdated
        - event: DebtTokenBorrowingFeePaid(indexed address,uint256)
          handler: handleDebtTokenBorrowingFeePaid
  - name: PriceFeed
    kind: ethereum/contract
    network: mainnet
    source:
      abi: PriceFeed
      address: "${addresses.priceFeed}"
      startBlock: ${startBlock}
    mapping:
      file: ./src/mappings/PriceFeed.ts
      language: wasm/assemblyscript
      kind: ethereum/events
      apiVersion: 0.0.5
      entities:
        - Global
        - Transaction
        - PriceChange
        - SystemState
      abis:
        - name: PriceFeed
          file: ../lib-ethers/abi/PriceFeed.json
      eventHandlers:
        - event: LastGoodPriceUpdated(uint256)
          handler: handleLastGoodPriceUpdated
  - name: StabilityPool
    kind: ethereum/contract
    network: mainnet
    source:
      abi: StabilityPool
      address: "${addresses.stabilityPool}"
      startBlock: ${startBlock}
    mapping:
      file: ./src/mappings/StabilityPool.ts
      language: wasm/assemblyscript
      kind: ethereum/events
      apiVersion: 0.0.5
      entities:
        - Global
        - User
        - Transaction
        - StabilityDeposit
        - StabilityDepositChange
        - SystemState
        - Frontend
      abis:
        - name: StabilityPool
          file: ../lib-ethers/abi/StabilityPool.json
      eventHandlers:
        - event: UserDepositChanged(indexed address,uint256)
          handler: handleUserDepositChanged
        - event: FILGainWithdrawn(indexed address,uint256,uint256)
          handler: handleFILGainWithdrawn
        - event: FrontEndRegistered(indexed address,uint256)
          handler: handleFrontendRegistered
        - event: FrontEndTagSet(indexed address,indexed address)
          handler: handleFrontendTagSet
  - name: CollSurplusPool
    kind: ethereum/contract
    network: mainnet
    source:
      abi: CollSurplusPool
      address: "${addresses.collSurplusPool}"
      startBlock: ${startBlock}
    mapping:
      file: ./src/mappings/CollSurplusPool.ts
      language: wasm/assemblyscript
      kind: ethereum/events
      apiVersion: 0.0.5
      entities:
        - Global
        - User
        - Transaction
        - Trove
        - CollSurplusChange
        - SystemState
      abis:
        - name: CollSurplusPool
          file: ../lib-ethers/abi/CollSurplusPool.json
      eventHandlers:
        - event: CollBalanceUpdated(indexed address,uint256)
          handler: handleCollSurplusBalanceUpdated
  - name: ProtocolTokenStaking
    kind: ethereum/contract
    network: mainnet
    source:
      abi: ProtocolTokenStaking
      address: "${addresses.protocolTokenStaking}"
      startBlock: ${startBlock}
    mapping:
      file: ./src/mappings/ProtocolTokenStake.ts
      language: wasm/assemblyscript
      kind: ethereum/events
      apiVersion: 0.0.5
      entities:
        - Global
        - User
        - Transaction
        - ProtocolTokenStake
        - ProtocolTokenStakeChange
      abis:
        - name: ProtocolTokenStaking
          file: ../lib-ethers/abi/ProtocolTokenStaking.json
      eventHandlers:
        - event: StakeChanged(indexed address,uint256)
          handler: handleStakeChanged
        - event: StakingGainsWithdrawn(indexed address,uint256,uint256)
          handler: handleStakeGainsWithdrawn
${[
  ["DebtToken", addresses.debtToken],
  ["ProtocolToken", addresses.protocolToken]
].map(
  ([name, address]) => yaml`
  - name: ${name}
    kind: ethereum/contract
    network: mainnet
    source:
      abi: ERC20
      address: "${address}"
      startBlock: ${startBlock}
    mapping:
      file: ./src/mappings/Token.ts
      language: wasm/assemblyscript
      kind: ethereum/events
      apiVersion: 0.0.5
      entities:
        - Global
        - User
        - Transaction
        - Token
      abis:
        - name: ERC20
          file: ./abi/ERC20.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,uint256)
          handler: handleTokenTransfer
        - event: Approval(indexed address,indexed address,uint256)
          handler: handleTokenApproval
`
)}`;

fs.writeFileSync("subgraph.yaml", manifest);
