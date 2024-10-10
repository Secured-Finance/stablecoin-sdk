import {
  BLUSDLPZap,
  BLUSDLPZap__factory,
  BLUSDToken,
  BLUSDToken__factory,
  BondNFT,
  BondNFT__factory,
  ChickenBondManager,
  ChickenBondManager__factory,
  ERC20Faucet,
  ERC20Faucet__factory
} from "@liquity/chicken-bonds/lusd/types";
import {
  CurveCryptoSwap2ETH,
  CurveCryptoSwap2ETH__factory,
  CurveLiquidityGaugeV5__factory
} from "@liquity/chicken-bonds/lusd/types/external";
import type { CurveLiquidityGaugeV5 } from "@liquity/chicken-bonds/lusd/types/external/CurveLiquidityGaugeV5";
import { Decimal } from "@secured-finance/lib-base";
import DebtTokenAbi from "@secured-finance/lib-ethers/abi/DebtToken.json";
import type { DebtToken } from "@secured-finance/lib-ethers/dist/types";
import { useCallback } from "react";
import { useChainId } from "wagmi";
import { useLiquity } from "../../../hooks/LiquityContext";
import { useContract } from "../../../hooks/useContract";
import type { BondsApi } from "./api";
import { useBondAddresses } from "./BondAddressesContext";
import type { Addresses, BLusdLpRewards, Bond, ProtocolInfo, Stats } from "./transitions";
import { BLusdAmmTokenIndex } from "./transitions";

type BondsInformation = {
  protocolInfo: ProtocolInfo;
  bonds: Bond[];
  stats: Stats;
  bLusdBalance: Decimal;
  debtTokenBalance: Decimal;
  lpTokenBalance: Decimal;
  stakedLpTokenBalance: Decimal;
  lpTokenSupply: Decimal;
  bLusdAmmBLusdBalance: Decimal;
  bLusdAmmLusdBalance: Decimal;
  lpRewards: BLusdLpRewards;
};

type BondContracts = {
  addresses: Addresses;
  debtToken: DebtToken | undefined;
  bLusdToken: BLUSDToken | undefined;
  bondNft: BondNFT | undefined;
  chickenBondManager: ChickenBondManager | undefined;
  bLusdAmm: CurveCryptoSwap2ETH | undefined;
  bLusdAmmZapper: BLUSDLPZap | undefined;
  bLusdGauge: CurveLiquidityGaugeV5 | undefined;
  hasFoundContracts: boolean;
  getLatestData: (account: string, api: BondsApi) => Promise<BondsInformation | undefined>;
};

export const useBondContracts = (): BondContracts => {
  const { liquity } = useLiquity();
  const chainId = useChainId();
  const isMainnet = chainId === 1;

  const addresses = useBondAddresses();

  const {
    BLUSD_AMM_ADDRESS,
    BLUSD_TOKEN_ADDRESS,
    BOND_NFT_ADDRESS,
    CHICKEN_BOND_MANAGER_ADDRESS,
    LUSD_OVERRIDE_ADDRESS,
    BLUSD_LP_ZAP_ADDRESS,
    BLUSD_AMM_STAKING_ADDRESS
  } = addresses;

  const [debtTokenDefault, debtTokenDefaultStatus] = useContract<DebtToken>(
    liquity.connection.addresses.debtToken,
    DebtTokenAbi
  );

  const [debtTokenOverride, debtTokenOverrideStatus] = useContract<ERC20Faucet>(
    LUSD_OVERRIDE_ADDRESS,
    ERC20Faucet__factory.abi
  );

  const [debtToken, debtTokenStatus] =
    LUSD_OVERRIDE_ADDRESS === null
      ? [debtTokenDefault, debtTokenDefaultStatus]
      : [debtTokenOverride as unknown as DebtToken, debtTokenOverrideStatus];

  const [bLusdToken, bLusdTokenStatus] = useContract<BLUSDToken>(
    BLUSD_TOKEN_ADDRESS,
    BLUSDToken__factory.abi
  );

  const [bondNft, bondNftStatus] = useContract<BondNFT>(BOND_NFT_ADDRESS, BondNFT__factory.abi);
  const [chickenBondManager, chickenBondManagerStatus] = useContract<ChickenBondManager>(
    CHICKEN_BOND_MANAGER_ADDRESS,
    ChickenBondManager__factory.abi
  );

  const [bLusdAmm, bLusdAmmStatus] = useContract<CurveCryptoSwap2ETH>(
    BLUSD_AMM_ADDRESS,
    CurveCryptoSwap2ETH__factory.abi
  );

  const [bLusdAmmZapper, bLusdAmmZapperStatus] = useContract<BLUSDLPZap>(
    BLUSD_LP_ZAP_ADDRESS,
    BLUSDLPZap__factory.abi
  );

  const [bLusdGauge, bLusdGaugeStatus] = useContract<CurveLiquidityGaugeV5>(
    BLUSD_AMM_STAKING_ADDRESS,
    CurveLiquidityGaugeV5__factory.abi
  );

  const hasFoundContracts =
    [
      debtTokenStatus,
      bondNftStatus,
      chickenBondManagerStatus,
      bLusdTokenStatus,
      bLusdAmmStatus,
      ...(isMainnet ? [bLusdAmmZapperStatus] : []),
      bLusdGaugeStatus
    ].find(status => status === "FAILED") === undefined;

  const getLatestData = useCallback(
    async (account: string, api: BondsApi): Promise<BondsInformation | undefined> => {
      if (
        debtToken === undefined ||
        bondNft === undefined ||
        chickenBondManager === undefined ||
        bLusdToken === undefined ||
        bLusdAmm === undefined ||
        bLusdGauge === undefined
      ) {
        return undefined;
      }

      const protocolInfoPromise = api.getProtocolInfo(
        bLusdToken,
        bLusdAmm,
        chickenBondManager,
        isMainnet
      );

      const bondsPromise = api.getAccountBonds(
        account,
        bondNft,
        chickenBondManager,
        await protocolInfoPromise
      );

      const [protocolInfo, stats, lpToken] = await Promise.all([
        protocolInfoPromise,
        api.getStats(chickenBondManager),
        api.getLpToken(bLusdAmm)
      ]);

      const [
        bLusdBalance,
        debtTokenBalance,
        lpTokenBalance,
        stakedLpTokenBalance,
        lpTokenSupply,
        bLusdAmmCoinBalances,
        lpRewards
      ] = await Promise.all([
        api.getTokenBalance(account, bLusdToken),
        api.getTokenBalance(account, debtToken),
        api.getTokenBalance(account, lpToken),
        isMainnet ? api.getTokenBalance(account, bLusdGauge) : Decimal.ZERO,
        api.getTokenTotalSupply(lpToken),
        api.getCoinBalances(bLusdAmm),
        isMainnet ? api.getLpRewards(account, bLusdGauge) : []
      ]);

      const bonds = await bondsPromise;

      return {
        protocolInfo,
        bonds,
        stats,
        bLusdBalance,
        debtTokenBalance,
        lpTokenBalance,
        stakedLpTokenBalance,
        lpTokenSupply,
        bLusdAmmBLusdBalance: bLusdAmmCoinBalances[BLusdAmmTokenIndex.BLUSD],
        bLusdAmmLusdBalance: bLusdAmmCoinBalances[BLusdAmmTokenIndex.LUSD],
        lpRewards
      };
    },
    [chickenBondManager, bondNft, bLusdToken, debtToken, bLusdAmm, isMainnet, bLusdGauge]
  );

  return {
    addresses,
    debtToken,
    bLusdToken,
    bondNft,
    chickenBondManager,
    bLusdAmm,
    bLusdAmmZapper,
    bLusdGauge,
    getLatestData,
    hasFoundContracts
  };
};
