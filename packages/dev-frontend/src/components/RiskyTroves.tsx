import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Card, Flex, Heading, Text } from "theme-ui";

import {
  CRITICAL_COLLATERAL_RATIO,
  Decimal,
  MINIMUM_COLLATERAL_RATIO,
  Percent,
  UserTrove
} from "@secured-finance/stablecoin-lib-base";
import { BlockPolledSfStablecoinStoreState } from "@secured-finance/stablecoin-lib-ethers";
import { useSfStablecoinSelector } from "@secured-finance/stablecoin-lib-react";

import { useSfStablecoin } from "../hooks/SfStablecoinContext";
import { COIN, CURRENCY } from "../strings";
import { shortenAddress } from "../utils/shortenAddress";

import { Abbreviation } from "./Abbreviation";
import { CopyToClipboard } from "./CopyToClipboard";
import { Icon } from "./Icon";
import { LoadingOverlay } from "./LoadingOverlay";
import { Tooltip } from "./Tooltip";
import { Transaction } from "./Transaction";

const rowHeight = "40px";

const liquidatableInNormalMode = (trove: UserTrove, price: Decimal) =>
  [trove.collateralRatioIsBelowMinimum(price), "Collateral ratio not low enough"] as const;

const liquidatableInRecoveryMode = (
  trove: UserTrove,
  price: Decimal,
  totalCollateralRatio: Decimal,
  debtTokenInStabilityPool: Decimal
) => {
  const collateralRatio = trove.collateralRatio(price);

  if (collateralRatio.gte(MINIMUM_COLLATERAL_RATIO) && collateralRatio.lt(totalCollateralRatio)) {
    return [
      trove.debt.lte(debtTokenInStabilityPool),
      "There's not enough token in the Stability pool to cover the debt"
    ] as const;
  } else {
    return liquidatableInNormalMode(trove, price);
  }
};

type RiskyTrovesProps = {
  pageSize: number;
};

const select = ({
  numberOfTroves,
  price,
  total,
  debtTokenInStabilityPool,
  blockTag
}: BlockPolledSfStablecoinStoreState) => ({
  numberOfTroves,
  price,
  recoveryMode: total.collateralRatioIsBelowCritical(price),
  totalCollateralRatio: total.collateralRatio(price),
  debtTokenInStabilityPool,
  blockTag
});

export const RiskyTroves: React.FC<RiskyTrovesProps> = ({ pageSize }) => {
  const {
    blockTag,
    numberOfTroves,
    recoveryMode,
    totalCollateralRatio,
    debtTokenInStabilityPool,
    price
  } = useSfStablecoinSelector(select);
  const { sfStablecoin } = useSfStablecoin();

  const [loading, setLoading] = useState(true);
  const [troves, setTroves] = useState<UserTrove[]>();

  const [reload, setReload] = useState({});
  const forceReload = useCallback(() => setReload({}), []);

  const [page, setPage] = useState(0);
  const numberOfPages = Math.ceil(numberOfTroves / pageSize) || 1;
  const clampedPage = Math.min(page, numberOfPages - 1);

  const nextPage = () => {
    if (clampedPage < numberOfPages - 1) {
      setPage(clampedPage + 1);
    }
  };

  const previousPage = () => {
    if (clampedPage > 0) {
      setPage(clampedPage - 1);
    }
  };

  useEffect(() => {
    if (page !== clampedPage) {
      setPage(clampedPage);
    }
  }, [page, clampedPage]);

  useEffect(() => {
    let mounted = true;

    setLoading(true);

    sfStablecoin
      .getTroves(
        {
          first: pageSize,
          sortedBy: "ascendingCollateralRatio",
          startingAt: clampedPage * pageSize
        },
        { blockTag }
      )
      .then(troves => {
        if (mounted) {
          setTroves(troves);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
    // Omit blockTag from deps on purpose
    // eslint-disable-next-line
  }, [sfStablecoin, clampedPage, pageSize, reload]);

  useEffect(() => {
    forceReload();
  }, [forceReload, numberOfTroves]);

  const [copied, setCopied] = useState<string>();

  useEffect(() => {
    if (copied !== undefined) {
      let cancelled = false;

      setTimeout(() => {
        if (!cancelled) {
          setCopied(undefined);
        }
      }, 2000);

      return () => {
        cancelled = true;
      };
    }
  }, [copied]);

  return (
    <Card sx={{ width: "100%" }}>
      <Heading>
        <Abbreviation short="Troves">Risky Troves</Abbreviation>

        <Flex sx={{ alignItems: "center" }}>
          {numberOfTroves !== 0 && (
            <>
              <Abbreviation
                short={`page ${clampedPage + 1} / ${numberOfPages}`}
                sx={{ mr: [0, 3], fontWeight: "body", fontSize: [1, 2], letterSpacing: [-1, 0] }}
              >
                {clampedPage * pageSize + 1}-{Math.min((clampedPage + 1) * pageSize, numberOfTroves)}{" "}
                of {numberOfTroves}
              </Abbreviation>

              <Button variant="titleIcon" onClick={previousPage} disabled={clampedPage <= 0}>
                <Icon name="chevron-left" size="lg" />
              </Button>

              <Button
                variant="titleIcon"
                onClick={nextPage}
                disabled={clampedPage >= numberOfPages - 1}
              >
                <Icon name="chevron-right" size="lg" />
              </Button>
            </>
          )}

          <Button
            variant="titleIcon"
            sx={{ opacity: loading ? 0 : 1, ml: [0, 3] }}
            onClick={forceReload}
          >
            <Icon name="redo" size="lg" />
          </Button>
        </Flex>
      </Heading>

      {!troves || troves.length === 0 ? (
        <Box sx={{ p: [2, 3] }}>
          <Box sx={{ p: 4, fontSize: 3, textAlign: "center" }}>
            {!troves ? "Loading..." : "There are no Troves yet"}
          </Box>
        </Box>
      ) : (
        <Box sx={{ p: [2, 3] }}>
          <Box
            as="table"
            sx={{
              mt: 2,
              pl: [1, 4],
              width: "100%",

              textAlign: "center",
              lineHeight: 1.15
            }}
          >
            <colgroup>
              <col style={{ width: "50px" }} />
              <col />
              <col />
              <col />
              <col style={{ width: rowHeight }} />
            </colgroup>

            <thead>
              <tr>
                <th>Owner</th>
                <th>
                  <Abbreviation short="Coll.">Collateral</Abbreviation>
                  <Box sx={{ fontSize: [0, 1], fontWeight: "body", opacity: 0.5 }}>{CURRENCY}</Box>
                </th>
                <th>
                  Debt
                  <Box sx={{ fontSize: [0, 1], fontWeight: "body", opacity: 0.5 }}>{COIN}</Box>
                </th>
                <th>
                  Coll.
                  <br />
                  Ratio
                </th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {troves.map(
                trove =>
                  !trove.isEmpty && ( // making sure the Trove hasn't been liquidated
                    // (WONT-FIX: remove check after we can fetch multiple Troves in one call)
                    <tr key={trove.ownerAddress}>
                      <td
                        style={{
                          display: "flex",
                          alignItems: "center",
                          height: rowHeight
                        }}
                      >
                        <Tooltip message={trove.ownerAddress} placement="top">
                          <Text
                            variant="address"
                            sx={{
                              width: ["73px", "unset"],
                              overflow: "hidden",
                              position: "relative"
                            }}
                          >
                            {shortenAddress(trove.ownerAddress)}
                            <Box
                              sx={{
                                display: ["block", "none"],
                                position: "absolute",
                                top: 0,
                                right: 0,
                                width: "50px",
                                height: "100%",
                                background:
                                  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)"
                              }}
                            />
                          </Text>
                        </Tooltip>

                        <CopyToClipboard
                          text={trove.ownerAddress}
                          onCopy={() => setCopied(trove.ownerAddress)}
                        >
                          <Button variant="icon" sx={{ width: "24px", height: "24px" }}>
                            <Icon
                              name={copied === trove.ownerAddress ? "clipboard-check" : "clipboard"}
                              size="sm"
                            />
                          </Button>
                        </CopyToClipboard>
                      </td>
                      <td>
                        <Abbreviation short={trove.collateral.shorten()}>
                          {trove.collateral.prettify(4)}
                        </Abbreviation>
                      </td>
                      <td>
                        <Abbreviation short={trove.debt.shorten()}>
                          {trove.debt.prettify()}
                        </Abbreviation>
                      </td>
                      <td>
                        {(collateralRatio => (
                          <Text
                            color={
                              collateralRatio.gt(CRITICAL_COLLATERAL_RATIO)
                                ? "success"
                                : collateralRatio.gt(1.2)
                                ? "warning"
                                : "danger"
                            }
                          >
                            {new Percent(collateralRatio).prettify()}
                          </Text>
                        ))(trove.collateralRatio(price))}
                      </td>
                      <td>
                        <Transaction
                          id={`liquidate-${trove.ownerAddress}`}
                          tooltip="Liquidate"
                          requires={[
                            recoveryMode
                              ? liquidatableInRecoveryMode(
                                  trove,
                                  price,
                                  totalCollateralRatio,
                                  debtTokenInStabilityPool
                                )
                              : liquidatableInNormalMode(trove, price)
                          ]}
                          send={sfStablecoin.send.liquidate.bind(
                            sfStablecoin.send,
                            trove.ownerAddress
                          )}
                        >
                          <Button variant="dangerIcon">
                            <Icon name="trash" />
                          </Button>
                        </Transaction>
                      </td>
                    </tr>
                  )
              )}
            </tbody>
          </Box>
        </Box>
      )}

      {loading && <LoadingOverlay />}
    </Card>
  );
};
