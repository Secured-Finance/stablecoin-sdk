import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber } from "@ethersproject/bignumber";
import { AddressZero } from "@ethersproject/constants";
import chai, { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import chaiSpies from "chai-spies";
import { deployProtocol, ethers, network } from "hardhat";

import {
  Decimal,
  Decimalish,
  Fees,
  LIQUIDATION_RESERVE,
  MAXIMUM_BORROWING_RATE,
  MINIMUM_BORROWING_RATE,
  MINIMUM_DEBT,
  MINIMUM_NET_DEBT,
  ProtocolReceipt,
  SentProtocolTransaction,
  StabilityDeposit,
  SuccessfulReceipt,
  Trove,
  TroveCreationParams
} from "@secured-finance/stablecoin-lib-base";

import { HintHelpers } from "../types";

import { PopulatableEthers, PopulatedEthersTransaction } from "../src/PopulatableEthers";

import { _ProtocolDeploymentJSON } from "../src/contracts";
import { _connectToDeployment, EthersConnection } from "../src/EthersConnection";
import { EthersSfStablecoin } from "../src/EthersSfStablecoin";
import { ReadableEthers, redeemMaxIterations } from "../src/ReadableEthers";
import { EthersTransactionReceipt } from "../src/types";

const provider = ethers.provider;

chai.use(chaiAsPromised);
chai.use(chaiSpies);

const STARTING_BALANCE = Decimal.from(100);

// Extra FIL sent to users to be spent on gas
const GAS_BUDGET = Decimal.from(0.1); // FIL

const getGasCost = (tx: EthersTransactionReceipt) => tx.gasUsed.mul(tx.effectiveGasPrice);

const connectToDeployment = async (
  deployment: _ProtocolDeploymentJSON,
  signer: Signer,
  frontendTag?: string
) =>
  EthersSfStablecoin._from(
    _connectToDeployment(deployment, signer, {
      userAddress: await signer.getAddress(),
      frontendTag
    })
  );

const increaseTime = async (timeJumpSeconds: number) => {
  await provider.send("evm_increaseTime", [timeJumpSeconds]);
};

function assertStrictEqual<T, U extends T>(
  actual: T,
  expected: U,
  message?: string
): asserts actual is U {
  assert.strictEqual(actual, expected, message);
}

function assertDefined<T>(actual: T | undefined): asserts actual is T {
  assert(actual !== undefined);
}

const waitForSuccess = async <T extends ProtocolReceipt>(
  tx: Promise<SentProtocolTransaction<unknown, T>>
) => {
  const receipt = await (await tx).waitForReceipt();
  assertStrictEqual(receipt.status, "succeeded" as const);

  return receipt as Extract<T, SuccessfulReceipt>;
};

// TODO make the testcases isolated

describe("EthersSfStablecoin", () => {
  let deployer: Signer;
  let funder: Signer;
  let user: Signer;
  let otherUsers: Signer[];

  let deployment: _ProtocolDeploymentJSON;

  let deployerSfStablecoin: EthersSfStablecoin;
  let sfStablecoin: EthersSfStablecoin;
  let otherSfStablecoins: EthersSfStablecoin[];

  const connectUsers = (users: Signer[]) =>
    Promise.all(users.map(user => connectToDeployment(deployment, user)));

  const openTroves = (users: Signer[], params: TroveCreationParams<Decimalish>[]) =>
    params
      .map(
        (params, i) => () =>
          Promise.all([
            connectToDeployment(deployment, users[i]),
            sendTo(users[i], params.depositCollateral).then(tx => tx.wait())
          ]).then(async ([sfStablecoin]) => {
            await sfStablecoin.openTrove(params);
          })
      )
      .reduce((a, b) => a.then(b), Promise.resolve());

  const sendTo = (user: Signer, value: Decimalish) =>
    funder.sendTransaction({
      to: user.getAddress(),
      value: Decimal.from(value).add(GAS_BUDGET).hex
    });

  const sendToEach = async (users: Signer[], value: Decimalish) => {
    const txs = await Promise.all(users.map(user => sendTo(user, value)));

    // Wait for the last tx to be mined.
    await txs[txs.length - 1].wait();
  };

  before(async () => {
    [deployer, funder, user, ...otherUsers] = await ethers.getSigners();
    deployment = await deployProtocol(deployer);

    sfStablecoin = await connectToDeployment(deployment, user);
    expect(sfStablecoin).to.be.an.instanceOf(EthersSfStablecoin);
  });

  // Always setup same initial balance for user
  beforeEach(async () => {
    const targetBalance = BigNumber.from(STARTING_BALANCE.hex);

    const gasLimit = BigNumber.from(21000);
    const gasPrice = BigNumber.from(100e9); // 100 Gwei

    const balance = await user.getBalance();
    const txCost = gasLimit.mul(gasPrice);

    if (balance.eq(targetBalance)) {
      return;
    }

    if (balance.gt(targetBalance) && balance.lte(targetBalance.add(txCost))) {
      await funder.sendTransaction({
        to: user.getAddress(),
        value: targetBalance.add(txCost).sub(balance).add(1),
        gasLimit,
        gasPrice
      });

      await user.sendTransaction({
        to: funder.getAddress(),
        value: 1,
        gasLimit,
        gasPrice
      });
    } else {
      if (balance.lt(targetBalance)) {
        await funder.sendTransaction({
          to: user.getAddress(),
          value: targetBalance.sub(balance),
          gasLimit,
          gasPrice
        });
      } else {
        await user.sendTransaction({
          to: funder.getAddress(),
          value: balance.sub(targetBalance).sub(txCost),
          gasLimit,
          gasPrice
        });
      }
    }

    expect(`${await user.getBalance()}`).to.equal(`${targetBalance}`);
  });

  it("should get the price", async () => {
    const price = await sfStablecoin.getPrice();
    expect(price).to.be.an.instanceOf(Decimal);
  });

  describe("findHintForCollateralRatio", () => {
    it("should pick the closest approx hint", async () => {
      type Resolved<T> = T extends Promise<infer U> ? U : never;
      type ApproxHint = Resolved<ReturnType<HintHelpers["getApproxHint"]>>;

      const fakeHints: ApproxHint[] = [
        { diff: BigNumber.from(3), hintAddress: "alice", latestRandomSeed: BigNumber.from(1111) },
        { diff: BigNumber.from(4), hintAddress: "bob", latestRandomSeed: BigNumber.from(2222) },
        { diff: BigNumber.from(1), hintAddress: "carol", latestRandomSeed: BigNumber.from(3333) },
        { diff: BigNumber.from(2), hintAddress: "dennis", latestRandomSeed: BigNumber.from(4444) }
      ];

      const borrowerOperations = {
        estimateGas: {
          openTrove: () => Promise.resolve(BigNumber.from(1))
        },
        populateTransaction: {
          openTrove: () => Promise.resolve({})
        }
      };

      const hintHelpers = chai.spy.interface({
        getApproxHint: () => Promise.resolve(fakeHints.shift())
      });

      const sortedTroves = chai.spy.interface({
        findInsertPosition: () => Promise.resolve(["fake insert position"])
      });

      const fakeConnection = {
        userAddress: await user.getAddress(),
        _contracts: {
          borrowerOperations,
          hintHelpers,
          sortedTroves
        }
      } as unknown as EthersConnection;
      const fakeReadableEthers = new ReadableEthers(fakeConnection);
      const fakeSfStablecoin = new PopulatableEthers({
        getNumberOfTroves: () => Promise.resolve(1000000),
        getTotal: () => Promise.resolve(new Trove(Decimal.from(10), Decimal.ONE)),
        getPrice: () => Promise.resolve(Decimal.ONE),
        findHintsForNominalCollateralRatio: fakeReadableEthers.findHintsForNominalCollateralRatio,
        _getBlockTimestamp: () => Promise.resolve(0),
        _getFeesFactory: () =>
          Promise.resolve(() => new Fees(0, 0.99, 1, new Date(), new Date(), false)),
        connection: fakeConnection
      } as unknown as ReadableEthers);

      const nominalCollateralRatio = Decimal.from(0.05);

      const params = Trove.recreate(new Trove(Decimal.from(0.1), MINIMUM_DEBT));
      const trove = Trove.create(params);
      expect(`${trove._nominalCollateralRatio}`).to.equal(`${nominalCollateralRatio}`);

      await fakeSfStablecoin.openTrove(params);

      expect(hintHelpers.getApproxHint).to.have.been.called.exactly(4);
      expect(hintHelpers.getApproxHint).to.have.been.called.with(nominalCollateralRatio.hex);

      // returned latestRandomSeed should be passed back on the next call
      expect(hintHelpers.getApproxHint).to.have.been.called.with(BigNumber.from(1111));
      expect(hintHelpers.getApproxHint).to.have.been.called.with(BigNumber.from(2222));
      expect(hintHelpers.getApproxHint).to.have.been.called.with(BigNumber.from(3333));

      expect(sortedTroves.findInsertPosition).to.have.been.called.once;
      expect(sortedTroves.findInsertPosition).to.have.been.called.with(
        nominalCollateralRatio.hex,
        "carol"
      );
    });
  });

  describe("Trove", () => {
    it("should have no Trove initially", async () => {
      const trove = await sfStablecoin.getTrove();
      expect(trove.isEmpty).to.be.true;
    });

    it("should fail to create an undercollateralized Trove", async () => {
      const price = await sfStablecoin.getPrice();
      const undercollateralized = new Trove(MINIMUM_DEBT.div(price), MINIMUM_DEBT);

      await expect(sfStablecoin.openTrove(Trove.recreate(undercollateralized))).to.eventually.be
        .rejected;
    });

    it("should fail to create a Trove with too little debt", async () => {
      const withTooLittleDebt = new Trove(Decimal.from(50), MINIMUM_DEBT.sub(1));

      await expect(sfStablecoin.openTrove(Trove.recreate(withTooLittleDebt))).to.eventually.be
        .rejected;
    });

    const withSomeBorrowing = { depositCollateral: 50, borrowDebtToken: MINIMUM_NET_DEBT.add(100) };

    it("should create a Trove with some borrowing", async () => {
      const { newTrove, fee } = await sfStablecoin.openTrove(withSomeBorrowing);
      expect(newTrove).to.deep.equal(Trove.create(withSomeBorrowing));
      expect(`${fee}`).to.equal(`${MINIMUM_BORROWING_RATE.mul(withSomeBorrowing.borrowDebtToken)}`);
    });

    it("should fail to withdraw all the collateral while the Trove has debt", async () => {
      const trove = await sfStablecoin.getTrove();

      await expect(sfStablecoin.withdrawCollateral(trove.collateral)).to.eventually.be.rejected;
    });

    const repaySomeDebt = { repayDebtToken: 10 };

    it("should repay some debt", async () => {
      const { newTrove, fee } = await sfStablecoin.repayDebtToken(repaySomeDebt.repayDebtToken);
      expect(newTrove).to.deep.equal(Trove.create(withSomeBorrowing).adjust(repaySomeDebt));
      expect(`${fee}`).to.equal("0");
    });

    const borrowSomeMore = { borrowDebtToken: 20 };

    it("should borrow some more", async () => {
      const { newTrove, fee } = await sfStablecoin.borrowDebtToken(borrowSomeMore.borrowDebtToken);
      expect(newTrove).to.deep.equal(
        Trove.create(withSomeBorrowing).adjust(repaySomeDebt).adjust(borrowSomeMore)
      );
      expect(`${fee}`).to.equal(`${MINIMUM_BORROWING_RATE.mul(borrowSomeMore.borrowDebtToken)}`);
    });

    const depositMoreCollateral = { depositCollateral: 1 };

    it("should deposit more collateral", async () => {
      const { newTrove } = await sfStablecoin.depositCollateral(
        depositMoreCollateral.depositCollateral
      );
      expect(newTrove).to.deep.equal(
        Trove.create(withSomeBorrowing)
          .adjust(repaySomeDebt)
          .adjust(borrowSomeMore)
          .adjust(depositMoreCollateral)
      );
    });

    const repayAndWithdraw = { repayDebtToken: 60, withdrawCollateral: 0.5 };

    it("should repay some debt and withdraw some collateral at the same time", async () => {
      const {
        rawReceipt,
        details: { newTrove }
      } = await waitForSuccess(sfStablecoin.send.adjustTrove(repayAndWithdraw));

      expect(newTrove).to.deep.equal(
        Trove.create(withSomeBorrowing)
          .adjust(repaySomeDebt)
          .adjust(borrowSomeMore)
          .adjust(depositMoreCollateral)
          .adjust(repayAndWithdraw)
      );

      const ethBalance = await user.getBalance();
      const expectedBalance = BigNumber.from(STARTING_BALANCE.add(0.5).hex).sub(
        getGasCost(rawReceipt)
      );

      expect(`${ethBalance}`).to.equal(`${expectedBalance}`);
    });

    const borrowAndDeposit = { borrowDebtToken: 60, depositCollateral: 0.5 };

    it("should borrow more and deposit some collateral at the same time", async () => {
      const {
        rawReceipt,
        details: { newTrove, fee }
      } = await waitForSuccess(sfStablecoin.send.adjustTrove(borrowAndDeposit));

      expect(newTrove).to.deep.equal(
        Trove.create(withSomeBorrowing)
          .adjust(repaySomeDebt)
          .adjust(borrowSomeMore)
          .adjust(depositMoreCollateral)
          .adjust(repayAndWithdraw)
          .adjust(borrowAndDeposit)
      );

      expect(`${fee}`).to.equal(`${MINIMUM_BORROWING_RATE.mul(borrowAndDeposit.borrowDebtToken)}`);

      const ethBalance = await user.getBalance();
      const expectedBalance = BigNumber.from(STARTING_BALANCE.sub(0.5).hex).sub(
        getGasCost(rawReceipt)
      );

      expect(`${ethBalance}`).to.equal(`${expectedBalance}`);
    });

    it("should close the Trove with some DebtToken from another user", async () => {
      const price = await sfStablecoin.getPrice();
      const initialTrove = await sfStablecoin.getTrove();
      const debtTokenBalance = await sfStablecoin.getProtocolTokenBalance();
      const debtTokenShortage = initialTrove.netDebt.sub(debtTokenBalance);

      let funderTrove = Trove.create({ depositCollateral: 1, borrowDebtToken: debtTokenShortage });
      funderTrove = funderTrove.setDebt(Decimal.max(funderTrove.debt, MINIMUM_DEBT));
      funderTrove = funderTrove.setCollateral(funderTrove.debt.mulDiv(1.51, price));

      const funderSfStablecoin = await connectToDeployment(deployment, funder);
      await funderSfStablecoin.openTrove(Trove.recreate(funderTrove));
      await funderSfStablecoin.sendDebtToken(await user.getAddress(), debtTokenShortage);

      const { params } = await sfStablecoin.closeTrove();

      expect(params).to.deep.equal({
        withdrawCollateral: initialTrove.collateral,
        repayDebtToken: initialTrove.netDebt
      });

      const finalTrove = await sfStablecoin.getTrove();
      expect(finalTrove.isEmpty).to.be.true;
    });
  });

  describe("SendableEthers", () => {
    it("should parse failed transactions without throwing", async () => {
      // By passing a gasLimit, we avoid automatic use of estimateGas which would throw
      const tx = await sfStablecoin.send.openTrove(
        { depositCollateral: 0.01, borrowDebtToken: 0.01 },
        undefined,
        { gasLimit: 1e6 }
      );
      const { status } = await tx.waitForReceipt();

      expect(status).to.equal("failed");
    });
  });

  describe("Frontend", () => {
    it("should have no frontend initially", async () => {
      const frontend = await sfStablecoin.getFrontendStatus(await user.getAddress());

      assertStrictEqual(frontend.status, "unregistered" as const);
    });

    it("should register a frontend", async () => {
      await sfStablecoin.registerFrontend(0.75);
    });

    it("should have a frontend now", async () => {
      const frontend = await sfStablecoin.getFrontendStatus(await user.getAddress());

      assertStrictEqual(frontend.status, "registered" as const);
      expect(`${frontend.kickbackRate}`).to.equal("0.75");
    });

    it("other user's deposit should be tagged with the frontend's address", async () => {
      const frontendTag = await user.getAddress();

      await funder.sendTransaction({
        to: otherUsers[0].getAddress(),
        value: Decimal.from(20.1).hex
      });

      const otherSfStablecoin = await connectToDeployment(deployment, otherUsers[0], frontendTag);
      await otherSfStablecoin.openTrove({ depositCollateral: 20, borrowDebtToken: MINIMUM_DEBT });

      await otherSfStablecoin.depositDebtTokenInStabilityPool(MINIMUM_DEBT);

      const deposit = await otherSfStablecoin.getStabilityDeposit();
      expect(deposit.frontendTag).to.equal(frontendTag);
    });
  });

  describe("StabilityPool", () => {
    before(async () => {
      deployment = await deployProtocol(deployer);

      [deployerSfStablecoin, sfStablecoin, ...otherSfStablecoins] = await connectUsers([
        deployer,
        user,
        ...otherUsers.slice(0, 1)
      ]);

      await funder.sendTransaction({
        to: otherUsers[0].getAddress(),
        value: MINIMUM_DEBT.div(170).hex
      });
    });

    const initialTroveOfDepositor = Trove.create({
      depositCollateral: MINIMUM_DEBT.div(100),
      borrowDebtToken: MINIMUM_NET_DEBT
    });

    const smallStabilityDeposit = Decimal.from(10);

    it("should make a small stability deposit", async () => {
      const { newTrove } = await sfStablecoin.openTrove(Trove.recreate(initialTroveOfDepositor));
      expect(newTrove).to.deep.equal(initialTroveOfDepositor);

      const details = await sfStablecoin.depositDebtTokenInStabilityPool(smallStabilityDeposit);

      expect(details).to.deep.equal({
        debtTokenLoss: Decimal.from(0),
        newDebtTokenDeposit: smallStabilityDeposit,
        collateralGain: Decimal.from(0),
        protocolTokenReward: Decimal.from(0),

        change: {
          depositDebtToken: smallStabilityDeposit
        }
      });
    });

    const troveWithVeryLowICR = Trove.create({
      depositCollateral: MINIMUM_DEBT.div(180),
      borrowDebtToken: MINIMUM_NET_DEBT
    });

    it("other user should make a Trove with very low ICR", async () => {
      const { newTrove } = await otherSfStablecoins[0].openTrove(
        Trove.recreate(troveWithVeryLowICR)
      );

      const price = await sfStablecoin.getPrice();
      expect(Number(`${newTrove.collateralRatio(price)}`)).to.be.below(1.15);
    });

    const dippedPrice = Decimal.from(190);

    it("the price should take a dip", async () => {
      await deployerSfStablecoin.setPrice(dippedPrice);

      const price = await sfStablecoin.getPrice();
      expect(`${price}`).to.equal(`${dippedPrice}`);
    });

    it("should liquidate other user's Trove", async () => {
      const details = await sfStablecoin.liquidateUpTo(1);

      expect(details).to.deep.equal({
        liquidatedAddresses: [await otherUsers[0].getAddress()],

        collateralGasCompensation: troveWithVeryLowICR.collateral.mul(0.005), // 0.5%
        debtGasCompensation: LIQUIDATION_RESERVE,

        totalLiquidated: new Trove(
          troveWithVeryLowICR.collateral
            .mul(0.995) // -0.5% gas compensation
            .add("0.000000000000000001"), // tiny imprecision
          troveWithVeryLowICR.debt
        )
      });

      const otherTrove = await otherSfStablecoins[0].getTrove();
      expect(otherTrove.isEmpty).to.be.true;
    });

    it("should have a depleted stability deposit and some collateral gain", async () => {
      const stabilityDeposit = await sfStablecoin.getStabilityDeposit();

      expect(stabilityDeposit).to.deep.equal(
        new StabilityDeposit(
          smallStabilityDeposit,
          Decimal.ZERO,
          troveWithVeryLowICR.collateral
            .mul(0.995) // -0.5% gas compensation
            .mulDiv(smallStabilityDeposit, troveWithVeryLowICR.debt)
            .sub("0.000000000000000005"), // tiny imprecision
          Decimal.ZERO,
          AddressZero
        )
      );
    });

    it("the Trove should have received some liquidation shares", async () => {
      const trove = await sfStablecoin.getTrove();

      expect(trove).to.deep.equal({
        ownerAddress: await user.getAddress(),
        status: "open",

        ...initialTroveOfDepositor
          .addDebt(troveWithVeryLowICR.debt.sub(smallStabilityDeposit))
          .addCollateral(
            troveWithVeryLowICR.collateral
              .mul(0.995) // -0.5% gas compensation
              .mulDiv(troveWithVeryLowICR.debt.sub(smallStabilityDeposit), troveWithVeryLowICR.debt)
              .add("0.000000000000000001") // tiny imprecision
          )
      });
    });

    it("total should equal the Trove", async () => {
      const trove = await sfStablecoin.getTrove();

      const numberOfTroves = await sfStablecoin.getNumberOfTroves();
      expect(numberOfTroves).to.equal(1);

      const total = await sfStablecoin.getTotal();
      expect(total).to.deep.equal(
        trove.addCollateral("0.000000000000000001") // tiny imprecision
      );
    });

    it("should transfer the gains to the Trove", async () => {
      const details = await sfStablecoin.transferCollateralGainToTrove();

      expect(details).to.deep.equal({
        debtTokenLoss: smallStabilityDeposit,
        newDebtTokenDeposit: Decimal.ZERO,
        protocolTokenReward: Decimal.ZERO,

        collateralGain: troveWithVeryLowICR.collateral
          .mul(0.995) // -0.5% gas compensation
          .mulDiv(smallStabilityDeposit, troveWithVeryLowICR.debt)
          .sub("0.000000000000000005"), // tiny imprecision

        newTrove: initialTroveOfDepositor
          .addDebt(troveWithVeryLowICR.debt.sub(smallStabilityDeposit))
          .addCollateral(
            troveWithVeryLowICR.collateral
              .mul(0.995) // -0.5% gas compensation
              .sub("0.000000000000000005") // tiny imprecision
          )
      });

      const stabilityDeposit = await sfStablecoin.getStabilityDeposit();
      expect(stabilityDeposit.isEmpty).to.be.true;
    });

    describe("when people overstay", () => {
      before(async () => {
        // Deploy new instances of the contracts, for a clean slate
        deployment = await deployProtocol(deployer);

        const otherUsersSubset = otherUsers.slice(0, 5);
        [deployerSfStablecoin, sfStablecoin, ...otherSfStablecoins] = await connectUsers([
          deployer,
          user,
          ...otherUsersSubset
        ]);

        await sendToEach(otherUsersSubset, 21.1);

        let price = Decimal.from(200);
        await deployerSfStablecoin.setPrice(price);

        // Use this account to print DebtToken
        await sfStablecoin.openTrove({ depositCollateral: 50, borrowDebtToken: 5000 });

        // otherSfStablecoins[0-2] will be independent stability depositors
        await sfStablecoin.sendDebtToken(await otherUsers[0].getAddress(), 3000);
        await sfStablecoin.sendDebtToken(await otherUsers[1].getAddress(), 1000);
        await sfStablecoin.sendDebtToken(await otherUsers[2].getAddress(), 1000);

        // otherSfStablecoins[3-4] will be Trove owners whose Troves get liquidated
        await otherSfStablecoins[3].openTrove({ depositCollateral: 21, borrowDebtToken: 2900 });
        await otherSfStablecoins[4].openTrove({ depositCollateral: 21, borrowDebtToken: 2900 });

        await otherSfStablecoins[0].depositDebtTokenInStabilityPool(3000);
        await otherSfStablecoins[1].depositDebtTokenInStabilityPool(1000);
        // otherSfStablecoins[2] doesn't deposit yet

        // Tank the price so we can liquidate
        price = Decimal.from(150);
        await deployerSfStablecoin.setPrice(price);

        // Liquidate first victim
        await sfStablecoin.liquidate(await otherUsers[3].getAddress());
        expect((await otherSfStablecoins[3].getTrove()).isEmpty).to.be.true;

        // Now otherSfStablecoins[2] makes their deposit too
        await otherSfStablecoins[2].depositDebtTokenInStabilityPool(1000);

        // Liquidate second victim
        await sfStablecoin.liquidate(await otherUsers[4].getAddress());
        expect((await otherSfStablecoins[4].getTrove()).isEmpty).to.be.true;

        // Stability Pool is now empty
        expect(`${await sfStablecoin.getDebtTokenInStabilityPool()}`).to.equal("0");
      });

      it("should still be able to withdraw remaining deposit", async () => {
        for (const l of [otherSfStablecoins[0], otherSfStablecoins[1], otherSfStablecoins[2]]) {
          const stabilityDeposit = await l.getStabilityDeposit();
          await l.withdrawDebtTokenFromStabilityPool(stabilityDeposit.currentDebtToken);
        }
      });
    });
  });

  describe("Redemption", () => {
    const troveCreations = [
      { depositCollateral: 99, borrowDebtToken: 4600 },
      { depositCollateral: 20, borrowDebtToken: 2000 }, // net debt: 2010
      { depositCollateral: 20, borrowDebtToken: 2100 }, // net debt: 2110.5
      { depositCollateral: 20, borrowDebtToken: 2200 } //  net debt: 2211
    ];

    before(async function () {
      if (network.name !== "hardhat") {
        // Redemptions are only allowed after a bootstrap phase of 2 weeks.
        // Since fast-forwarding only works on Hardhat EVM, skip these tests elsewhere.
        this.skip();
      }

      // Deploy new instances of the contracts, for a clean slate
      deployment = await deployProtocol(deployer);

      const otherUsersSubset = otherUsers.slice(0, 3);
      [deployerSfStablecoin, sfStablecoin, ...otherSfStablecoins] = await connectUsers([
        deployer,
        user,
        ...otherUsersSubset
      ]);

      await sendToEach(otherUsersSubset, 20.1);
    });

    it("should fail to redeem during the bootstrap phase", async () => {
      await sfStablecoin.openTrove(troveCreations[0]);
      await otherSfStablecoins[0].openTrove(troveCreations[1]);
      await otherSfStablecoins[1].openTrove(troveCreations[2]);
      await otherSfStablecoins[2].openTrove(troveCreations[3]);

      await expect(sfStablecoin.redeemDebtToken(4326.5)).to.eventually.be.rejected;
    });

    const someDebtToken = Decimal.from(4326.5);

    it("should redeem some DebtToken after the bootstrap phase", async () => {
      // Fast-forward 15 days
      await increaseTime(60 * 60 * 24 * 15);

      expect(`${await otherSfStablecoins[0].getCollateralSurplusBalance()}`).to.equal("0");
      expect(`${await otherSfStablecoins[1].getCollateralSurplusBalance()}`).to.equal("0");
      expect(`${await otherSfStablecoins[2].getCollateralSurplusBalance()}`).to.equal("0");

      const expectedTotal = troveCreations
        .map(params => Trove.create(params))
        .reduce((a, b) => a.add(b));

      const total = await sfStablecoin.getTotal();
      expect(total).to.deep.equal(expectedTotal);

      const expectedDetails = {
        attemptedDebtTokenAmount: someDebtToken,
        actualDebtTokenAmount: someDebtToken,
        collateralTaken: someDebtToken.div(200),
        fee: new Fees(0, 0.99, 2, new Date(), new Date(), false)
          .redemptionRate(someDebtToken.div(total.debt))
          .mul(someDebtToken.div(200))
      };

      const { rawReceipt, details } = await waitForSuccess(
        sfStablecoin.send.redeemDebtToken(someDebtToken)
      );
      expect(details).to.deep.equal(expectedDetails);

      const balance = Decimal.fromBigNumberString(`${await user.getBalance()}`);
      const gasCost = Decimal.fromBigNumberString(`${getGasCost(rawReceipt)}`);

      expect(`${balance}`).to.equal(
        `${STARTING_BALANCE.add(expectedDetails.collateralTaken)
          .sub(expectedDetails.fee)
          .sub(gasCost)}`
      );

      expect(`${await sfStablecoin.getDebtTokenBalance()}`).to.equal("273.5");

      expect(`${(await otherSfStablecoins[0].getTrove()).debt}`).to.equal(
        `${Trove.create(troveCreations[1]).debt.sub(
          someDebtToken
            .sub(Trove.create(troveCreations[2]).netDebt)
            .sub(Trove.create(troveCreations[3]).netDebt)
        )}`
      );

      expect((await otherSfStablecoins[1].getTrove()).isEmpty).to.be.true;
      expect((await otherSfStablecoins[2].getTrove()).isEmpty).to.be.true;
    });

    it("should claim the collateral surplus after redemption", async () => {
      const balanceBefore1 = await provider.getBalance(otherUsers[1].getAddress());
      const balanceBefore2 = await provider.getBalance(otherUsers[2].getAddress());

      expect(`${await otherSfStablecoins[0].getCollateralSurplusBalance()}`).to.equal("0");

      const surplus1 = await otherSfStablecoins[1].getCollateralSurplusBalance();
      const trove1 = Trove.create(troveCreations[2]);
      expect(`${surplus1}`).to.equal(`${trove1.collateral.sub(trove1.netDebt.div(200))}`);

      const surplus2 = await otherSfStablecoins[2].getCollateralSurplusBalance();
      const trove2 = Trove.create(troveCreations[3]);
      expect(`${surplus2}`).to.equal(`${trove2.collateral.sub(trove2.netDebt.div(200))}`);

      const { rawReceipt: receipt1 } = await waitForSuccess(
        otherSfStablecoins[1].send.claimCollateralSurplus()
      );

      const { rawReceipt: receipt2 } = await waitForSuccess(
        otherSfStablecoins[2].send.claimCollateralSurplus()
      );

      expect(`${await otherSfStablecoins[0].getCollateralSurplusBalance()}`).to.equal("0");
      expect(`${await otherSfStablecoins[1].getCollateralSurplusBalance()}`).to.equal("0");
      expect(`${await otherSfStablecoins[2].getCollateralSurplusBalance()}`).to.equal("0");

      const balanceAfter1 = await otherUsers[1].getBalance();
      const balanceAfter2 = await otherUsers[2].getBalance();

      expect(`${balanceAfter1}`).to.equal(
        `${balanceBefore1.add(surplus1.hex).sub(getGasCost(receipt1))}`
      );

      expect(`${balanceAfter2}`).to.equal(
        `${balanceBefore2.add(surplus2.hex).sub(getGasCost(receipt2))}`
      );
    });

    it("borrowing rate should be maxed out now", async () => {
      const borrowDebtToken = Decimal.from(10);

      const { fee, newTrove } = await sfStablecoin.borrowDebtToken(borrowDebtToken);
      expect(`${fee}`).to.equal(`${borrowDebtToken.mul(MAXIMUM_BORROWING_RATE)}`);

      expect(newTrove).to.deep.equal(
        Trove.create(troveCreations[0]).adjust({ borrowDebtToken }, MAXIMUM_BORROWING_RATE)
      );
    });
  });

  describe("Redemption (truncation)", () => {
    const troveCreationParams = { depositCollateral: 2, borrowDebtToken: 200 };
    const netDebtPerTrove = Trove.create(troveCreationParams).netDebt;
    const amountToAttempt = Decimal.from(300);
    const expectedRedeemable = netDebtPerTrove.mul(2).sub(MINIMUM_NET_DEBT);

    before(function () {
      if (network.name !== "hardhat") {
        // Redemptions are only allowed after a bootstrap phase of 2 weeks.
        // Since fast-forwarding only works on Hardhat EVM, skip these tests elsewhere.
        this.skip();
      }
    });

    beforeEach(async () => {
      // Deploy new instances of the contracts, for a clean slate
      deployment = await deployProtocol(deployer);

      const otherUsersSubset = otherUsers.slice(0, 3);
      [deployerSfStablecoin, sfStablecoin, ...otherSfStablecoins] = await connectUsers([
        deployer,
        user,
        ...otherUsersSubset
      ]);

      await sendToEach(otherUsersSubset, 20.1);

      await sfStablecoin.openTrove({ depositCollateral: 99, borrowDebtToken: 5000 });
      await otherSfStablecoins[0].openTrove(troveCreationParams);
      await otherSfStablecoins[1].openTrove(troveCreationParams);
      await otherSfStablecoins[2].openTrove(troveCreationParams);

      await increaseTime(60 * 60 * 24 * 15);
    });

    it("should truncate the amount if it would put the last Trove below the min debt", async () => {
      const redemption = await sfStablecoin.populate.redeemDebtToken(amountToAttempt);
      expect(`${redemption.attemptedDebtTokenAmount}`).to.equal(`${amountToAttempt}`);
      expect(`${redemption.redeemableDebtTokenAmount}`).to.equal(`${expectedRedeemable}`);
      expect(redemption.isTruncated).to.be.true;

      const { details } = await waitForSuccess(redemption.send());
      expect(`${details.attemptedDebtTokenAmount}`).to.equal(`${expectedRedeemable}`);
      expect(`${details.actualDebtTokenAmount}`).to.equal(`${expectedRedeemable}`);
    });

    it("should increase the amount to the next lowest redeemable value", async () => {
      const increasedRedeemable = expectedRedeemable.add(MINIMUM_NET_DEBT);

      const initialRedemption = await sfStablecoin.populate.redeemDebtToken(amountToAttempt);
      const increasedRedemption = await initialRedemption.increaseAmountByMinimumNetDebt();
      expect(`${increasedRedemption.attemptedDebtTokenAmount}`).to.equal(`${increasedRedeemable}`);
      expect(`${increasedRedemption.redeemableDebtTokenAmount}`).to.equal(`${increasedRedeemable}`);
      expect(increasedRedemption.isTruncated).to.be.false;

      const { details } = await waitForSuccess(increasedRedemption.send());
      expect(`${details.attemptedDebtTokenAmount}`).to.equal(`${increasedRedeemable}`);
      expect(`${details.actualDebtTokenAmount}`).to.equal(`${increasedRedeemable}`);
    });

    it("should fail to increase the amount if it's not truncated", async () => {
      const redemption = await sfStablecoin.populate.redeemDebtToken(netDebtPerTrove);
      expect(redemption.isTruncated).to.be.false;

      expect(() => redemption.increaseAmountByMinimumNetDebt()).to.throw(
        "can only be called when amount is truncated"
      );
    });
  });

  describe("Redemption (gas checks)", function () {
    this.timeout("5m");

    const massivePrice = Decimal.from(300);
    const amountToBorrowPerTrove = Decimal.from(200);
    const netDebtPerTrove = MINIMUM_BORROWING_RATE.add(1).mul(amountToBorrowPerTrove);
    const collateralPerTrove = netDebtPerTrove.add(LIQUIDATION_RESERVE).mulDiv(1.5, massivePrice);

    const amountToRedeem = netDebtPerTrove.mul(redeemMaxIterations);
    const amountToDeposit = MINIMUM_BORROWING_RATE.add(1)
      .mul(amountToRedeem)
      .add(LIQUIDATION_RESERVE)
      .mulDiv(2, massivePrice);

    before(async function () {
      if (network.name !== "hardhat") {
        // Redemptions are only allowed after a bootstrap phase of 2 weeks.
        // Since fast-forwarding only works on Hardhat EVM, skip these tests elsewhere.
        this.skip();
      }

      // Deploy new instances of the contracts, for a clean slate
      deployment = await deployProtocol(deployer);
      const otherUsersSubset = otherUsers.slice(0, redeemMaxIterations);
      expect(otherUsersSubset).to.have.length(redeemMaxIterations);

      [deployerSfStablecoin, sfStablecoin, ...otherSfStablecoins] = await connectUsers([
        deployer,
        user,
        ...otherUsersSubset
      ]);

      await deployerSfStablecoin.setPrice(massivePrice);
      await sendToEach(otherUsersSubset, collateralPerTrove);

      for (const otherSfStablecoin of otherSfStablecoins) {
        await otherSfStablecoin.openTrove({
          depositCollateral: collateralPerTrove,
          borrowDebtToken: amountToBorrowPerTrove
        });
      }

      await increaseTime(60 * 60 * 24 * 15);
    });

    it("should redeem using the maximum iterations and almost all gas", async () => {
      await sfStablecoin.openTrove({
        depositCollateral: amountToDeposit,
        borrowDebtToken: amountToRedeem
      });

      const { rawReceipt } = await waitForSuccess(sfStablecoin.send.redeemDebtToken(amountToRedeem));

      const gasUsed = rawReceipt.gasUsed.toNumber();
      // gasUsed is ~half the real used amount because of how refunds work, see:
      // https://ethereum.stackexchange.com/a/859/9205
      expect(gasUsed).to.be.at.least(4900000, "should use close to 10M gas");
    });
  });

  describe("Liquidity mining", () => {
    before(async () => {
      deployment = await deployProtocol(deployer);
      [deployerSfStablecoin, sfStablecoin] = await connectUsers([deployer, user]);
    });

    const someUniTokens = 1000;

    it("should obtain some UNI LP tokens", async () => {
      await sfStablecoin._mintUniToken(someUniTokens);

      const uniTokenBalance = await sfStablecoin.getUniTokenBalance();
      expect(`${uniTokenBalance}`).to.equal(`${someUniTokens}`);
    });

    it("should fail to stake UNI LP before approving the spend", async () => {
      await expect(sfStablecoin.stakeUniTokens(someUniTokens)).to.eventually.be.rejected;
    });

    it("should stake UNI LP after approving the spend", async () => {
      const initialAllowance = await sfStablecoin.getUniTokenAllowance();
      expect(`${initialAllowance}`).to.equal("0");

      await sfStablecoin.approveUniTokens();

      const newAllowance = await sfStablecoin.getUniTokenAllowance();
      expect(newAllowance.isZero).to.be.false;

      await sfStablecoin.stakeUniTokens(someUniTokens);

      const uniTokenBalance = await sfStablecoin.getUniTokenBalance();
      expect(`${uniTokenBalance}`).to.equal("0");

      const stake = await sfStablecoin.getLiquidityMiningStake();
      expect(`${stake}`).to.equal(`${someUniTokens}`);
    });

    it("should have an ProtocolToken reward after some time has passed", async function () {
      this.timeout("20s");

      // Liquidity mining rewards are seconds-based, so we don't need to wait long.
      // By actually waiting in real time, we avoid using increaseTime(), which only works on
      // Hardhat EVM.
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Trigger a new block with a dummy TX.
      await sfStablecoin._mintUniToken(0);

      const protocolTokenReward = Number(await sfStablecoin.getLiquidityMiningProtocolTokenReward());
      expect(protocolTokenReward).to.be.at.least(1); // ~0.2572 per second [(4e6/3) / (60*24*60*60)]

      await sfStablecoin.withdrawProtocolTokenRewardFromProtocolMining();
      const protocolTokenBalance = Number(await sfStablecoin.getProtocolTokenBalance());
      expect(protocolTokenBalance).to.be.at.least(protocolTokenReward); // may have increased since checking
    });

    it("should partially unstake", async () => {
      await sfStablecoin.unstakeUniTokens(someUniTokens / 2);

      const uniTokenStake = await sfStablecoin.getLiquidityMiningStake();
      expect(`${uniTokenStake}`).to.equal(`${someUniTokens / 2}`);

      const uniTokenBalance = await sfStablecoin.getUniTokenBalance();
      expect(`${uniTokenBalance}`).to.equal(`${someUniTokens / 2}`);
    });

    it("should unstake remaining tokens and withdraw remaining ProtocolToken reward", async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await sfStablecoin._mintUniToken(0); // dummy block
      await sfStablecoin.exitLiquidityMining();

      const uniTokenStake = await sfStablecoin.getLiquidityMiningStake();
      expect(`${uniTokenStake}`).to.equal("0");

      const protocolTokenReward = await sfStablecoin.getLiquidityMiningProtocolTokenReward();
      expect(`${protocolTokenReward}`).to.equal("0");

      const uniTokenBalance = await sfStablecoin.getUniTokenBalance();
      expect(`${uniTokenBalance}`).to.equal(`${someUniTokens}`);
    });

    it("should have no more rewards after the mining period is over", async function () {
      if (network.name !== "hardhat") {
        // increaseTime() only works on Hardhat EVM
        this.skip();
      }

      await sfStablecoin.stakeUniTokens(someUniTokens);
      await increaseTime(2 * 30 * 24 * 60 * 60);
      await sfStablecoin.exitLiquidityMining();

      const remainingProtocolTokenReward =
        await sfStablecoin.getRemainingProtocolMiningProtocolTokenReward();
      expect(`${remainingProtocolTokenReward}`).to.equal("0");

      const protocolTokenBalance = Number(await sfStablecoin.getProtocolTokenBalance());
      expect(protocolTokenBalance).to.be.equal(1300000);
    });
  });

  // Test workarounds related to https://github.com/liquity/dev/issues/600
  describe("Hints (adjustTrove)", () => {
    let eightOtherUsers: Signer[];

    before(async () => {
      deployment = await deployProtocol(deployer);
      eightOtherUsers = otherUsers.slice(0, 8);
      sfStablecoin = await connectToDeployment(deployment, user);

      await openTroves(eightOtherUsers, [
        { depositCollateral: 30, borrowDebtToken: 2000 }, // 0
        { depositCollateral: 30, borrowDebtToken: 2100 }, // 1
        { depositCollateral: 30, borrowDebtToken: 2200 }, // 2
        { depositCollateral: 30, borrowDebtToken: 2300 }, // 3
        // Test 1:           30,             2400
        { depositCollateral: 30, borrowDebtToken: 2500 }, // 4
        { depositCollateral: 30, borrowDebtToken: 2600 }, // 5
        { depositCollateral: 30, borrowDebtToken: 2700 }, // 6
        { depositCollateral: 30, borrowDebtToken: 2800 } //  7
        // Test 2:           30,             2900
        // Test 2 (other):   30,             3000
        // Test 3:           30,             3100 -> 3200
      ]);
    });

    // Test 1
    it("should not use extra gas when a Trove's position doesn't change", async () => {
      const { newTrove: initialTrove } = await sfStablecoin.openTrove({
        depositCollateral: 30,
        borrowDebtToken: 2400
      });

      // Maintain the same ICR / position in the list
      const targetTrove = initialTrove.multiply(1.1);

      const { rawReceipt } = await waitForSuccess(
        sfStablecoin.send.adjustTrove(initialTrove.adjustTo(targetTrove))
      );

      const gasUsed = rawReceipt.gasUsed.toNumber();
      expect(gasUsed).to.be.at.most(270000);
    });

    // Test 2
    it("should not traverse the whole list when bottom Trove moves", async () => {
      const bottomSfStablecoin = await connectToDeployment(deployment, eightOtherUsers[7]);

      const initialTrove = await sfStablecoin.getTrove();
      const bottomTrove = await bottomSfStablecoin.getTrove();

      const targetTrove = Trove.create({ depositCollateral: 30, borrowDebtToken: 2900 });
      const interferingTrove = Trove.create({ depositCollateral: 30, borrowDebtToken: 3000 });

      const tx = await sfStablecoin.populate.adjustTrove(initialTrove.adjustTo(targetTrove));

      // Suddenly: interference!
      await bottomSfStablecoin.adjustTrove(bottomTrove.adjustTo(interferingTrove));

      const { rawReceipt } = await waitForSuccess(tx.send());

      const gasUsed = rawReceipt.gasUsed.toNumber();
      expect(gasUsed).to.be.at.most(310000);
    });

    // Test 3
    it("should not traverse the whole list when lowering ICR of bottom Trove", async () => {
      const initialTrove = await sfStablecoin.getTrove();

      const targetTrove = [
        Trove.create({ depositCollateral: 30, borrowDebtToken: 3100 }),
        Trove.create({ depositCollateral: 30, borrowDebtToken: 3200 })
      ];

      await sfStablecoin.adjustTrove(initialTrove.adjustTo(targetTrove[0]));
      // Now we are the bottom Trove

      // Lower our ICR even more
      const { rawReceipt } = await waitForSuccess(
        sfStablecoin.send.adjustTrove(targetTrove[0].adjustTo(targetTrove[1]))
      );

      const gasUsed = rawReceipt.gasUsed.toNumber();
      expect(gasUsed).to.be.at.most(250000);
    });
  });

  describe("Gas estimation", () => {
    const troveWithICRBetween = (a: Trove, b: Trove) => a.add(b).multiply(0.5);

    let rudeUser: Signer;
    let fiveOtherUsers: Signer[];
    let rudeSfStablecoin: EthersSfStablecoin;

    before(async function () {
      if (network.name !== "hardhat") {
        this.skip();
      }

      deployment = await deployProtocol(deployer);

      [rudeUser, ...fiveOtherUsers] = otherUsers.slice(0, 6);

      [deployerSfStablecoin, sfStablecoin, rudeSfStablecoin, ...otherSfStablecoins] =
        await connectUsers([deployer, user, rudeUser, ...fiveOtherUsers]);

      await openTroves(fiveOtherUsers, [
        { depositCollateral: 20, borrowDebtToken: 2040 },
        { depositCollateral: 20, borrowDebtToken: 2050 },
        { depositCollateral: 20, borrowDebtToken: 2060 },
        { depositCollateral: 20, borrowDebtToken: 2070 },
        { depositCollateral: 20, borrowDebtToken: 2080 }
      ]);

      await increaseTime(60 * 60 * 24 * 15);
    });

    it("should include enough gas for updating lastFeeOperationTime", async () => {
      await sfStablecoin.openTrove({ depositCollateral: 20, borrowDebtToken: 2090 });

      // We just updated lastFeeOperationTime, so this won't anticipate having to update that
      // during estimateGas
      const tx = await sfStablecoin.populate.redeemDebtToken(1);
      const originalGasEstimate = await provider.estimateGas(tx.rawPopulatedTransaction);

      // Fast-forward 2 minutes.
      await increaseTime(120);

      // Required gas has just went up.
      const newGasEstimate = await provider.estimateGas(tx.rawPopulatedTransaction);
      const gasIncrease = newGasEstimate.sub(originalGasEstimate).toNumber();
      expect(gasIncrease).to.be.within(3000, 8000);

      // This will now have to update lastFeeOperationTime
      await waitForSuccess(tx.send());

      // Decay base-rate back to 0
      await increaseTime(100000000);
    });

    it("should include enough gas for one extra traversal", async () => {
      const troves = await sfStablecoin.getTroves({
        first: 10,
        sortedBy: "ascendingCollateralRatio"
      });

      const trove = await sfStablecoin.getTrove();
      const newTrove = troveWithICRBetween(troves[3], troves[4]);

      // First, we want to test a non-borrowing case, to make sure we're not passing due to any
      // extra gas we add to cover a potential lastFeeOperationTime update
      const adjustment = trove.adjustTo(newTrove);
      expect(adjustment.borrowDebtToken).to.be.undefined;

      const tx = await sfStablecoin.populate.adjustTrove(adjustment);
      const originalGasEstimate = await provider.estimateGas(tx.rawPopulatedTransaction);

      // A terribly rude user interferes
      const rudeTrove = newTrove.addDebt(1);
      const rudeCreation = Trove.recreate(rudeTrove);
      await openTroves([rudeUser], [rudeCreation]);

      const newGasEstimate = await provider.estimateGas(tx.rawPopulatedTransaction);
      const gasIncrease = newGasEstimate.sub(originalGasEstimate).toNumber();

      await waitForSuccess(tx.send());
      expect(gasIncrease).to.be.within(10000, 25000);

      assertDefined(rudeCreation.borrowDebtToken);
      const debtTokenShortage = rudeTrove.debt.sub(rudeCreation.borrowDebtToken);

      await sfStablecoin.sendDebtToken(await rudeUser.getAddress(), debtTokenShortage);
      await rudeSfStablecoin.closeTrove();
    });

    it("should include enough gas for both when borrowing", async () => {
      const troves = await sfStablecoin.getTroves({
        first: 10,
        sortedBy: "ascendingCollateralRatio"
      });

      const trove = await sfStablecoin.getTrove();
      const newTrove = troveWithICRBetween(troves[1], troves[2]);

      // Make sure we're borrowing
      const adjustment = trove.adjustTo(newTrove);
      expect(adjustment.borrowDebtToken).to.not.be.undefined;

      const tx = await sfStablecoin.populate.adjustTrove(adjustment);
      const originalGasEstimate = await provider.estimateGas(tx.rawPopulatedTransaction);

      // A terribly rude user interferes again
      await openTroves([rudeUser], [Trove.recreate(newTrove.addDebt(1))]);

      // On top of that, we'll need to update lastFeeOperationTime
      await increaseTime(120);

      const newGasEstimate = await provider.estimateGas(tx.rawPopulatedTransaction);
      const gasIncrease = newGasEstimate.sub(originalGasEstimate).toNumber();

      await waitForSuccess(tx.send());
      expect(gasIncrease).to.be.within(15000, 30000);
    });
  });

  describe("Gas estimation (ProtocolToken issuance)", () => {
    const estimate = (tx: PopulatedEthersTransaction) =>
      provider.estimateGas(tx.rawPopulatedTransaction);

    before(async function () {
      if (network.name !== "hardhat") {
        this.skip();
      }

      deployment = await deployProtocol(deployer);
      [deployerSfStablecoin, sfStablecoin] = await connectUsers([deployer, user]);
    });

    it("should include enough gas for issuing ProtocolToken", async function () {
      this.timeout("1m");

      await sfStablecoin.openTrove({ depositCollateral: 40, borrowDebtToken: 4000 });
      await sfStablecoin.depositDebtTokenInStabilityPool(19);

      await increaseTime(60);

      // This will issue ProtocolToken for the first time ever. That uses a whole lotta gas, and we don't
      // want to pack any extra gas to prepare for this case specifically, because it only happens
      // once.
      await sfStablecoin.withdrawGainsFromStabilityPool();

      const claim = await sfStablecoin.populate.withdrawGainsFromStabilityPool();
      const deposit = await sfStablecoin.populate.depositDebtTokenInStabilityPool(1);
      const withdraw = await sfStablecoin.populate.withdrawDebtTokenFromStabilityPool(1);

      for (let i = 0; i < 5; ++i) {
        for (const tx of [claim, deposit, withdraw]) {
          const gasLimit = tx.rawPopulatedTransaction.gasLimit?.toNumber();
          const requiredGas = (await estimate(tx)).toNumber();

          assertDefined(gasLimit);
          expect(requiredGas).to.be.at.most(gasLimit);
        }

        await increaseTime(60);
      }

      await waitForSuccess(claim.send());

      const creation = Trove.recreate(new Trove(Decimal.from(11.1), Decimal.from(2000.1)));

      await deployerSfStablecoin.openTrove(creation);
      await deployerSfStablecoin.depositDebtTokenInStabilityPool(creation.borrowDebtToken);
      await deployerSfStablecoin.setPrice(198);

      const liquidateTarget = await sfStablecoin.populate.liquidate(await deployer.getAddress());
      const liquidateMultiple = await sfStablecoin.populate.liquidateUpTo(40);

      for (let i = 0; i < 5; ++i) {
        for (const tx of [liquidateTarget, liquidateMultiple]) {
          const gasLimit = tx.rawPopulatedTransaction.gasLimit?.toNumber();
          const requiredGas = (await estimate(tx)).toNumber();

          assertDefined(gasLimit);
          expect(requiredGas).to.be.at.most(gasLimit);
        }

        await increaseTime(60);
      }

      await waitForSuccess(liquidateMultiple.send());
    });
  });

  describe("Gas estimation (fee decay)", () => {
    before(async function () {
      if (network.name !== "hardhat") {
        this.skip();
      }

      this.timeout("1m");

      deployment = await deployProtocol(deployer);
      const [redeemedUser, ...someMoreUsers] = otherUsers.slice(0, 21);
      [sfStablecoin, ...otherSfStablecoins] = await connectUsers([user, ...someMoreUsers]);

      // Create a "slope" of Troves with similar, but slightly decreasing ICRs
      await openTroves(
        someMoreUsers,
        someMoreUsers.map((_, i) => ({
          depositCollateral: 20,
          borrowDebtToken: MINIMUM_NET_DEBT.add(i / 10)
        }))
      );

      // Sweep DebtToken
      await Promise.all(
        otherSfStablecoins.map(async otherSfStablecoin =>
          otherSfStablecoin.sendDebtToken(
            await user.getAddress(),
            await otherSfStablecoin.getDebtTokenBalance()
          )
        )
      );

      const price = await sfStablecoin.getPrice();

      // Create a "designated victim" Trove that'll be redeemed
      const redeemedTroveDebt = await sfStablecoin
        .getDebtTokenBalance()
        .then(x => x.div(10).add(LIQUIDATION_RESERVE));
      const redeemedTroveCollateral = redeemedTroveDebt.mulDiv(1.1, price);
      const redeemedTrove = new Trove(redeemedTroveCollateral, redeemedTroveDebt);

      await openTroves([redeemedUser], [Trove.recreate(redeemedTrove)]);

      // Jump past bootstrap period
      await increaseTime(60 * 60 * 24 * 15);

      // Increase the borrowing rate by redeeming
      const { actualDebtTokenAmount } = await sfStablecoin.redeemDebtToken(redeemedTrove.netDebt);

      expect(`${actualDebtTokenAmount}`).to.equal(`${redeemedTrove.netDebt}`);

      const borrowingRate = await sfStablecoin.getFees().then(fees => Number(fees.borrowingRate()));
      expect(borrowingRate).to.be.within(0.04, 0.049); // make sure it's high, but not clamped to 5%
    });

    it("should predict the gas increase due to fee decay", async function () {
      this.timeout("1m");

      const [bottomTrove] = await sfStablecoin.getTroves({
        first: 1,
        sortedBy: "ascendingCollateralRatio"
      });

      const borrowingRate = await sfStablecoin.getFees().then(fees => fees.borrowingRate());

      for (const [borrowingFeeDecayToleranceMinutes, roughGasHeadroom] of [
        [10, 95000],
        [20, 96200],
        [30, 97400]
      ]) {
        const tx = await sfStablecoin.populate.openTrove(
          Trove.recreate(bottomTrove, borrowingRate),
          {
            borrowingFeeDecayToleranceMinutes
          }
        );

        expect(tx.gasHeadroom).to.be.within(roughGasHeadroom - 1000, roughGasHeadroom + 1000);
      }
    });

    it("should include enough gas for the TX to succeed after pending", async function () {
      this.timeout("1m");

      const [bottomTrove] = await sfStablecoin.getTroves({
        first: 1,
        sortedBy: "ascendingCollateralRatio"
      });

      const borrowingRate = await sfStablecoin.getFees().then(fees => fees.borrowingRate());

      const tx = await sfStablecoin.populate.openTrove(
        Trove.recreate(bottomTrove.multiply(2), borrowingRate),
        { borrowingFeeDecayToleranceMinutes: 60 }
      );

      await increaseTime(60 * 60);
      await waitForSuccess(tx.send());
    });
  });
});
