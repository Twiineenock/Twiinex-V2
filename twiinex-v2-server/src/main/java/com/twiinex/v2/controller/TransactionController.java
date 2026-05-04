package com.twiinex.v2.controller;

import com.twiinex.v2.service.HederaService;
import com.twiinex.v2.service.SupabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    @Autowired
    private SupabaseService supabaseService;

    @Autowired
    private HederaService hederaService;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${flw.secretKey}")
    private String flwSecretKey;

    @PostMapping
    public Map<String, Object> createTransaction(@RequestBody Map<String, Object> request) {
        String vendorPhone = (String) request.get("vendorPhone");
        long amount = ((Number) request.get("amount")).longValue();
        String description = (String) request.get("description");
        String imageUrl = (String) request.get("imageUrl");

        // 1. Create in Supabase
        Map<String, Object> transaction = supabaseService.createTransaction(vendorPhone, amount, description, null, imageUrl);
        String txId = (String) transaction.get("id");

        // 2. Genesis Audit Event
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("imageUrl", imageUrl);
        metadata.put("contractId", contractId);
        List<Map<String, Object>> history = new ArrayList<>();
        
        Map<String, Object> genesisLog = new HashMap<>();
        genesisLog.put("contract_id", contractId);
        genesisLog.put("event_type", "EscrowCreated");
        Map<String, Object> terms = new HashMap<>();
        terms.put("price", amount);
        terms.put("item", description);
        genesisLog.put("terms", terms);
        genesisLog.put("consensus_timestamp", String.valueOf(System.currentTimeMillis() / 1000.0));

        // 3. Log to HCS
        String message = String.format("{\"action\":\"GENESIS\",\"id\":\"%s\",\"amount\":%d,\"seller\":\"%s\",\"timestamp\":\"%s\"}", txId, amount, vendorPhone, new Date().toString());
        Map<String, Object> hcsResult = hederaService.submitHCSEvent(message);

        if ((Boolean) hcsResult.getOrDefault("success", false)) {
            metadata.put("hcsTopicId", hcsResult.get("topicId"));
            metadata.put("hcsSequenceNumber", hcsResult.get("sequenceNumber"));
            genesisLog.put("hcsResult", hcsResult);
            genesisLog.put("topicId", hcsResult.get("topicId"));
        }

        history.add(genesisLog);
        metadata.put("history", history);
        
        // 4. Update with Metadata
        supabaseService.updateStatus(txId, "PENDING", metadata);
        transaction.put("metadata", metadata);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("transaction", transaction);
        response.put("link", "http://localhost:5173/pay/" + txId);
        return response;
    }

    @GetMapping("/{id}")
    public Map<String, Object> getTransaction(@PathVariable String id) {
        return supabaseService.getTransactionById(id);
    }

    @GetMapping("/seller/{phone}")
    public List<Map<String, Object>> getSellerTransactions(@PathVariable String phone) {
        return supabaseService.getTransactions(phone);
    }

    @PatchMapping("/{id}/status")
    public Map<String, Object> updateStatus(@PathVariable String id, @RequestBody Map<String, Object> request) {
        String status = (String) request.get("status");

        Map<String, Object> tx = supabaseService.getTransactionById(id);
        Map<String, Object> metadata = (Map<String, Object>) tx.get("metadata");
        if (metadata == null) metadata = new HashMap<>();

        List<Map<String, Object>> history = (List<Map<String, Object>>) metadata.get("history");
        if (history == null) {
            history = new ArrayList<>();
            metadata.put("history", history);
        }

        Map<String, Object> eventLog = new HashMap<>();
        eventLog.put("contract_id", metadata.get("contractId"));
        eventLog.put("event_type", status + "Emission");
        eventLog.put("consensus_timestamp", String.valueOf(System.currentTimeMillis() / 1000.0));
        
        Map<String, Object> forensic_details = new HashMap<>();
        forensic_details.put("backend_node", "TWIINEX_ESCROW_ENGINE_V2");
        forensic_details.put("network", "Hedera Testnet");

        long amount = ((Number) tx.get("amount")).longValue();

        if ("FUNDED".equals(status)) {
            Map<String, Object> contractResult = hederaService.executeContractFunction("createOrder", id);
            if ((Boolean) contractResult.getOrDefault("success", false)) {
                String txId_onchain = (String) contractResult.get("transactionId");
                metadata.put("lastTxId", txId_onchain);
                eventLog.put("contractResult", contractResult);
                eventLog.put("proof_url", "https://hashscan.io/testnet/transaction/" + txId_onchain.replace("@", "-").replaceFirst("\\.", "-"));
            }
            Map<String, Object> mintResult = hederaService.mintVaultTokens(amount, id);
            eventLog.put("amount_ugx", amount);
            eventLog.put("hedera_vault", metadata.get("contractId"));
            eventLog.put("minted_tokens", String.valueOf(amount / 100)); // Sample logic for token decimals
            eventLog.put("hts_mint_result", mintResult);
            
        } else if ("SHIPPED".equals(status)) {
            Map<String, Object> contractResult = hederaService.executeContractFunction("markShipped", id);
            if ((Boolean) contractResult.getOrDefault("success", false)) {
                String txId_onchain = (String) contractResult.get("transactionId");
                metadata.put("lastTxId", txId_onchain);
                eventLog.put("contractResult", contractResult);
                eventLog.put("proof_url", "https://hashscan.io/testnet/transaction/" + txId_onchain.replace("@", "-").replaceFirst("\\.", "-"));
            }
            eventLog.put("shipping_id", "SHIP-" + id.split("-")[1]);
            
        } else if ("COMPLETED".equals(status)) {
            Map<String, Object> contractResult = hederaService.executeContractFunction("confirmReceipt", id);
            if ((Boolean) contractResult.getOrDefault("success", false)) {
                String txId_onchain = (String) contractResult.get("transactionId");
                metadata.put("lastTxId", txId_onchain);
                eventLog.put("contractResult", contractResult);
                eventLog.put("proof_url", "https://hashscan.io/testnet/transaction/" + txId_onchain.replace("@", "-").replaceFirst("\\.", "-"));
            }
            Map<String, Object> burnResult = hederaService.burnVaultTokens(amount);
            eventLog.put("burn_confirmation", "HTS_BURN_SUCCESS");
            eventLog.put("recipient", "Vendor Wallet");
        }

        String message = String.format("{\"action\":\"STATUS_UPDATE\",\"id\":\"%s\",\"status\":\"%s\",\"timestamp\":\"%s\"}", id, status, new Date().toString());
        Map<String, Object> hcsResult = hederaService.submitHCSEvent(message);

        if ((Boolean) hcsResult.getOrDefault("success", false)) {
            metadata.put("hcsTopicId", hcsResult.get("topicId"));
            metadata.put("hcsSequenceNumber", hcsResult.get("sequenceNumber"));
            eventLog.put("hcsResult", hcsResult);
        }

        history.add(eventLog);
        supabaseService.updateStatus(id, status, metadata);
        tx.put("status", status);
        tx.put("metadata", metadata);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("transaction", tx);
        return response;
    }

    @PatchMapping("/{id}/metadata")
    public Map<String, Object> updateMetadata(@PathVariable String id, @RequestBody Map<String, Object> request) {
        String action = (String) request.get("action");

        Map<String, Object> tx = supabaseService.getTransactionById(id);
        Map<String, Object> metadata = (Map<String, Object>) tx.get("metadata");
        if (metadata == null) metadata = new HashMap<>();

        if ("view".equals(action)) {
            int views = (int) metadata.getOrDefault("views", 0);
            metadata.put("views", views + 1);
        } else if ("paymentAttempt".equals(action)) {
            int attempts = (int) metadata.getOrDefault("paymentAttempts", 0);
            metadata.put("paymentAttempts", attempts + 1);
        }
        metadata.put("lastActionAt", new Date().toString());

        supabaseService.updateStatus(id, (String) tx.get("status"), metadata);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("metadata", metadata);
        return response;
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<?> verifyFlutterwave(@PathVariable String id, @RequestBody Map<String, Object> request) {
        String transactionId = (String) request.get("transaction_id");

        if (transactionId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing Flutterwave transaction_id"));
        }

        try {
            String url = "https://api.flutterwave.com/v3/transactions/" + transactionId + "/verify";
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + flwSecretKey);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> flwResponse = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> flwData = (Map<String, Object>) flwResponse.getBody().get("data");
            String flwStatus = (String) flwData.get("status");

            if ("successful".equals(flwStatus)) {
                Map<String, Object> tx = supabaseService.getTransactionById(id);
                long amount = ((Number) tx.get("amount")).longValue();

                // Mint HTS Tokens
                Map<String, Object> htsResult = hederaService.mintVaultTokens(amount, id);
                if (!(Boolean) htsResult.getOrDefault("success", false)) {
                    return ResponseEntity.internalServerError().body(Map.of("error", "Hedera HTS Minting Failed", "details", htsResult.get("error")));
                }

                // Log HCS Event
                String message = String.format("{\"action\":\"PAYMENT_VERIFIED\",\"id\":\"%s\",\"flw_ref\":\"%s\",\"amount\":%d,\"timestamp\":\"%s\"}", id, transactionId, amount, new Date().toString());
                Map<String, Object> hcsResult = hederaService.submitHCSEvent(message);

                // Update Metadata & History
                Map<String, Object> metadata = (Map<String, Object>) tx.get("metadata");
                if (metadata == null) metadata = new HashMap<>();
                List<Map<String, Object>> history = (List<Map<String, Object>>) metadata.get("history");
                if (history == null) {
                    history = new ArrayList<>();
                    metadata.put("history", history);
                }

                Map<String, Object> eventLog = new HashMap<>();
                eventLog.put("status", "FUNDED");
                eventLog.put("timestamp", new Date().toString());
                eventLog.put("type", "PAYMENT_VERIFICATION");
                eventLog.put("description", "Payment verified via Flutterwave. Funds locked in Escrow.");
                eventLog.put("backend_log", "Verifying flw_ref: " + transactionId + " with gateway...");
                eventLog.put("flw_ref", transactionId);
                eventLog.put("htsMintResult", htsResult);
                eventLog.put("hcsResult", hcsResult);
                eventLog.put("actor", "BUYER_GATEWAY_INTEGRATION");

                if ((Boolean) hcsResult.getOrDefault("success", false)) {
                    metadata.put("hcsTopicId", hcsResult.get("topicId"));
                    metadata.put("hcsSequenceNumber", hcsResult.get("sequenceNumber"));
                }

                history.add(eventLog);

                // Update Supabase
                supabaseService.updateStatus(id, "FUNDED", metadata);
                tx.put("status", "FUNDED");
                tx.put("metadata", metadata);

                return ResponseEntity.ok(Map.of("success", true, "transaction", tx));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Payment not successful", "flw_status", flwStatus));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Payment verification failed", "message", e.getMessage()));
        }
    }
}
