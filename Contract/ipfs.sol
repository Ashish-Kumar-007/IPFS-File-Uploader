// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract ipfs{
    string fileHash;

    function setHash(string memory _fileHash) public {
        fileHash = _fileHash;
    }

    function getHash() public view returns(string memory) {
        return fileHash;
    }
}