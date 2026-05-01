package com.twiinex.v2.controller;

import com.hedera.hashgraph.sdk.ContractId;
import com.twiinex.v2.service.EscrowService;
import com.twiinex.v2.service.SupabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/escrow")
@CrossOrigin(origins = "*")
public class EscrowController {

    @Autowired
    private EscrowService escrowService;

    @Autowired
    private SupabaseService supabaseService;

    @PostMapping("/create")
    public Map<String, Object> createEscrow(@RequestBody Map<String, Object> request) throws org.hiero.base.HieroException {
        String phone = (String) request.get("phone");
        long amount = ((Number) request.get("amount")).longValue();
        String description = (String) request.get("description");

        // 1. Deploy Contract to Hedera
        ContractId contractId = escrowService.deployEscrow(phone, amount);

        // 2. Store in Supabase
        Map<String, Object> transaction = supabaseService.createTransaction(phone, amount, description, contractId.toString());

        return Map.of(
            "success", true,
            "contractId", contractId.toString(),
            "transactionId", (String) transaction.get("id")
        );
    }

    @GetMapping("/transactions/{phone}")
    public List<Map<String, Object>> getTransactions(@PathVariable String phone) {
        return supabaseService.getTransactions(phone);
    }

    @GetMapping("/transaction/{id}")
    public Map<String, Object> getTransaction(@PathVariable String id) {
        return supabaseService.getTransactionById(id);
    }

    @PostMapping("/confirm")
    public Map<String, Object> confirmReceipt(@RequestBody Map<String, Object> request) throws org.hiero.base.HieroException {
        String contractIdStr = (String) request.get("contractId");
        String txId = (String) request.get("transactionId");

        // 1. Release Funds in Smart Contract
        // In a real app, this would be signed by the buyer's wallet.
        // For V2 Demo, we'll use the operator to trigger it.
        // escrowService.confirmReceipt(ContractId.fromString(contractIdStr));

        // 2. Update Supabase
        supabaseService.updateStatus(txId, "COMPLETED", null);

        return Map.of("success", true, "status", "COMPLETED");
    }

    @GetMapping("/status/{contractId}")
    public Map<String, Object> getStatus(@PathVariable String contractId) throws org.hiero.base.HieroException {
        String status = escrowService.getStatus(ContractId.fromString(contractId));
        return Map.of("contractId", contractId, "onChainStatus", status);
    }
}
