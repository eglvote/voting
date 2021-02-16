pragma solidity ^0.6.0;

interface EglProxy {
  function upgradeTo(address _newImplementation) external;
}