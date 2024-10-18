import fc from "fast-check";
import { describe, it } from "mocha";

import { Decimal } from "../src/Decimal";
import { ProtocolTokenStake } from "../src/ProtocolTokenStake";

const arbitraryStake = () =>
  fc
    .tuple(fc.float(), fc.float(), fc.float())
    .map(([a, b, c]) => new ProtocolTokenStake(Decimal.from(a), Decimal.from(b), Decimal.from(c)));

const nonZeroStake = () =>
  arbitraryStake().filter(({ stakedProtocolToken }) => !stakedProtocolToken.isZero);

describe("ProtocolTokenStake", () => {
  it("applying diff of `b` from `a` to `a` should always yield `b`", () => {
    fc.assert(fc.property(arbitraryStake(), fc.float(), (a, b) => a.apply(a.whatChanged(b)).eq(b)));
  });

  it("applying what changed should preserve zeroing", () => {
    fc.assert(
      fc.property(arbitraryStake(), nonZeroStake(), (a, b) => a.apply(b.whatChanged(0)).eq(0))
    );
  });
});
