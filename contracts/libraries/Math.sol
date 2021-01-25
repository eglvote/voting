pragma solidity ^0.6.0;

library Math {
    /**
     * Returns max value of 2 unsigned ints
     */
    function umax(uint a, uint b) internal pure returns (uint) {
        return a >= b ? a : b;
    }

    /**
     * Returns min value of 2 unsigned ints
     */
    function umin(uint a, uint b) internal pure returns (uint) {
        return a < b ? a : b;
    }

    /**
     * Returns max value of 2 signed ints
     */
    function max(int a, int b) internal pure returns (int) {
        return a >= b ? a : b;
    }

    /**
     * Returns min value of 2 signed ints
     */
    function min(int a, int b) internal pure returns (int) {
        return a < b ? a : b;
    }
}
