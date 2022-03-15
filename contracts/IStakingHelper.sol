pragma solidity ^0.8.4;

// SPDX-License-Identifier: GPL-3.0-or-later

interface IStakingHelper {
    function stake(uint256 _amount, address _recipient) external;
}
