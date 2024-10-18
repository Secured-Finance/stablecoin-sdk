import {
  StakeChanged,
  StakingGainsWithdrawn
} from "../../generated/ProtocolTokenStaking/ProtocolTokenStaking";

import { updateStake, withdrawStakeGains } from "../entities/ProtocolTokenStake";

export function handleStakeChanged(event: StakeChanged): void {
  updateStake(event, event.params.staker, event.params.newStake);
}

export function handleStakeGainsWithdrawn(event: StakingGainsWithdrawn): void {
  withdrawStakeGains(event, event.params.staker, event.params.debtTokenGain, event.params.FILGain);
}
