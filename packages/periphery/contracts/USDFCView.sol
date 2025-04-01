// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import {ITroveManager} from "@secured-finance/stablecoin-contracts/contracts/Interfaces/ITroveManager.sol";
import {ISortedTroves} from "@secured-finance/stablecoin-contracts/contracts/Interfaces/ISortedTroves.sol";

contract USDFCView {
    ITroveManager public TroveManager;
    ISortedTroves public SortedTroves;

    constructor(address _troveManager, address _sortedTroves) {
        TroveManager = ITroveManager(_troveManager);
        SortedTroves = ISortedTroves(_sortedTroves);
    }

    /// @notice Returns the debt in front of the users trove in the sorted list
    /// @param _of Address of the trove owner
    /// @param _acc Accumulated sum used in subsequent calls, 0 for first call
    /// @param _iterations Maximum number of troves to traverse
    /// @return next Trove owner address to be used in the subsequent call, address(0) at the end of list
    /// @return debt Accumulated debt to be used in the subsequent call
    function getDebtInFront(
        address _of,
        uint256 _acc,
        uint256 _iterations
    ) external view returns (address next, uint256 debt) {
        next = _of;
        debt = _acc;
        for (uint256 i = 0; i < _iterations && next != address(0); i++) {
            next = SortedTroves.getNext(next);
            debt = debt + TroveManager.getTroveDebt(next);
        }
    }
}
