// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VerdeX {
    address public owner;
    mapping(address => bool) public writers;

    mapping(uint256 => string) private productNames;
    mapping(uint256 => string[]) private productHistory;

    event ProductAdded(uint256 indexed id, string name);
    event StageAdded(uint256 indexed id, string stage);
    event WriterUpdated(address indexed account, bool isAllowed);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyWriter() {
        require(writers[msg.sender], "Address is not authorized to write");
        _;
    }

    constructor() {
        owner = msg.sender;
        writers[msg.sender] = true;
    }

    function setWriter(address account, bool isAllowed) external onlyOwner {
        require(account != address(0), "Invalid writer address");
        writers[account] = isAllowed;
        emit WriterUpdated(account, isAllowed);
    }

    function addProduct(uint256 id, string memory name) external onlyWriter {
        require(id > 0, "Invalid product id");
        require(bytes(name).length > 0, "Name is required");
        require(bytes(productNames[id]).length == 0, "Product already exists");

        productNames[id] = name;
        emit ProductAdded(id, name);
    }

    function addStage(uint256 id, string memory stage) external onlyWriter {
        require(bytes(productNames[id]).length > 0, "Product not found");
        require(bytes(stage).length > 0, "Stage is required");

        productHistory[id].push(stage);
        emit StageAdded(id, stage);
    }

    function getHistory(uint256 id) external view returns (string[] memory) {
        return productHistory[id];
    }

    function getProductName(uint256 id) external view returns (string memory) {
        return productNames[id];
    }
}
