// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TwiinexEscrow {
    enum State { AWAITING_PAYMENT, AWAITING_DELIVERY, COMPLETE, DISPUTED, REFUNDED }
    
    struct Order {
        address buyer;
        address seller;
        uint256 amount;
        State state;
        bool exists;
    }
    
    mapping(string => Order) public orders;
    address public arbiter;

    event FundsDeposited(string orderId, address buyer, uint256 amount);
    event ItemShipped(string orderId, address seller);
    event FundsReleased(string orderId, address seller);
    event DisputeRaised(string orderId, address initiator);
    event RefundIssued(string orderId, address buyer);

    constructor() {
        arbiter = msg.sender;
    }

    function createOrder(string memory orderId, address seller) public payable {
        require(msg.value > 0, "Amount must be > 0");
        require(!orders[orderId].exists, "Order already exists");
        
        orders[orderId] = Order({
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            state: State.AWAITING_DELIVERY,
            exists: true
        });
        
        emit FundsDeposited(orderId, msg.sender, msg.value);
    }

    function markShipped(string memory orderId) public {
        require(orders[orderId].exists, "Order not found");
        require(msg.sender == orders[orderId].seller, "Only seller can mark as shipped");
        require(orders[orderId].state == State.AWAITING_DELIVERY, "Invalid state");
        
        orders[orderId].state = State.AWAITING_DELIVERY; // Or a dedicated SHIPPED state
        emit ItemShipped(orderId, msg.sender);
    }

    function confirmReceipt(string memory orderId) public {
        require(orders[orderId].exists, "Order not found");
        require(msg.sender == orders[orderId].buyer, "Only buyer can confirm receipt");
        require(orders[orderId].state == State.AWAITING_DELIVERY, "Invalid state");
        
        orders[orderId].state = State.COMPLETE;
        payable(orders[orderId].seller).transfer(orders[orderId].amount);
        
        emit FundsReleased(orderId, orders[orderId].seller);
    }

    function raiseDispute(string memory orderId) public {
        require(orders[orderId].exists, "Order not found");
        require(msg.sender == orders[orderId].buyer || msg.sender == orders[orderId].seller, "Not authorized");
        
        orders[orderId].state = State.DISPUTED;
        emit DisputeRaised(orderId, msg.sender);
    }

    // Arbiter can resolve disputes
    function resolveDispute(string memory orderId, bool refundToBuyer) public {
        require(msg.sender == arbiter, "Only arbiter");
        require(orders[orderId].state == State.DISPUTED, "No dispute");
        
        if (refundToBuyer) {
            orders[orderId].state = State.REFUNDED;
            payable(orders[orderId].buyer).transfer(orders[orderId].amount);
            emit RefundIssued(orderId, orders[orderId].buyer);
        } else {
            orders[orderId].state = State.COMPLETE;
            payable(orders[orderId].seller).transfer(orders[orderId].amount);
            emit FundsReleased(orderId, orders[orderId].seller);
        }
    }
}
