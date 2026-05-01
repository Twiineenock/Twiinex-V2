// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

contract Escrow {
    enum State { AWAITING_PAYMENT, AWAITING_DELIVERY, COMPLETE, DISPUTED, REFUNDED }
    
    address public buyer;
    address payable public seller;
    address public arbiter; // Twiinex Admin
    uint public amount;
    State public state;

    event Funded(address indexed buyer, uint amount);
    event Delivered(address indexed buyer);
    event Disputed(address indexed by);
    event Resolved(address indexed to);
    event Refunded(address indexed buyer);

    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer can call this");
        _;
    }

    modifier onlyArbiter() {
        require(msg.sender == arbiter, "Only arbiter can call this");
        _;
    }

    constructor(address payable _seller, uint _amount) {
        seller = _seller;
        arbiter = msg.sender; // The creator (Twiinex Backend)
        amount = _amount;
        state = State.AWAITING_PAYMENT;
    }

    function deposit() external payable {
        require(state == State.AWAITING_PAYMENT, "Already funded or complete");
        require(msg.value == amount, "Incorrect amount");
        buyer = msg.sender;
        state = State.AWAITING_DELIVERY;
        emit Funded(buyer, msg.value);
    }

    function confirmReceipt() external onlyBuyer {
        require(state == State.AWAITING_DELIVERY, "Not in delivery state");
        state = State.COMPLETE;
        seller.transfer(address(this).balance);
        emit Delivered(buyer);
    }

    function dispute() external {
        require(msg.sender == buyer || msg.sender == seller, "Unauthorized");
        require(state == State.AWAITING_DELIVERY, "Cannot dispute now");
        state = State.DISPUTED;
        emit Disputed(msg.sender);
    }

    function resolveDispute(bool releaseToSeller) external onlyArbiter {
        require(state == State.DISPUTED, "Not in dispute");
        if (releaseToSeller) {
            state = State.COMPLETE;
            seller.transfer(address(this).balance);
            emit Resolved(address(seller));
        } else {
            state = State.REFUNDED;
            payable(buyer).transfer(address(this).balance);
            emit Resolved(address(buyer));
        }
    }
}
