package com.twiinex.v2.service;

import com.hedera.hashgraph.sdk.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.hiero.base.ContractEventClient;
import org.springframework.beans.factory.annotation.Autowired;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

@Service
public class HederaService {

    private static final Logger log = LoggerFactory.getLogger(HederaService.class);

    private Client client;

    @Value("${spring.hiero.accountId}")
    private String accountIdStr;

    @Value("${spring.hiero.privateKey}")
    private String privateKeyStr;

    @Value("${spring.hiero.network.name:hedera-testnet}")
    private String networkName;

    @Value("${spring.hiero.topicId:}")
    private String topicIdStr;

    @Value("${spring.hiero.tokenId:}")
    private String tokenIdStr;

    @Autowired(required = false)
    private ContractEventClient contractEventClient;

    @PostConstruct
    public void init() {
        try {
            if (accountIdStr != null && !accountIdStr.isEmpty() && privateKeyStr != null && !privateKeyStr.isEmpty()) {
                AccountId accountId = AccountId.fromString(accountIdStr);
                PrivateKey privateKey = PrivateKey.fromString(privateKeyStr);

                client = Client.forTestnet();
                client.setOperator(accountId, privateKey);
                log.info("✅ Hedera Client initialized for Testnet");
            } else {
                log.warn("⚠️ Hedera credentials missing. HCS logging will be simulated.");
            }
        } catch (Exception e) {
            log.error("❌ Hedera Initialization Error: {}", e.getMessage());
        }
    }

    public Map<String, Object> submitHCSEvent(String message) {
        Map<String, Object> result = new HashMap<>();
        String topicToUse = topicIdStr.isEmpty() ? "0.0.0" : topicIdStr;

        if (client == null) {
            log.info("📝 [SIMULATED HCS]: {}", message);
            result.put("success", true);
            result.put("simulated", true);
            result.put("topicId", topicToUse);
            result.put("sequenceNumber", String.valueOf((long)(Math.random() * 1000000)));
            result.put("transactionId", "mock-" + System.currentTimeMillis());
            return result;
        }

        try {
            if (topicIdStr == null || topicIdStr.isEmpty()) {
                throw new Exception("spring.hiero.topicId missing");
            }
            TopicId topicId = TopicId.fromString(topicIdStr);

            TransactionResponse txResponse = new TopicMessageSubmitTransaction()
                    .setTopicId(topicId)
                    .setMessage(message)
                    .execute(client);

            TransactionReceipt receipt = txResponse.getReceipt(client);
            log.info("🚀 HCS Message Submitted. Status: {}", receipt.status);

            result.put("success", true);
            result.put("topicId", topicIdStr);
            result.put("sequenceNumber", String.valueOf(receipt.topicSequenceNumber));
            result.put("transactionId", txResponse.transactionId.toString());
            result.put("status", receipt.status.toString());
        } catch (Exception e) {
            log.error("❌ HCS Submission Error: {}", e.getMessage());
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }

    public Map<String, Object> mintVaultTokens(long amount, String txId) {
        Map<String, Object> result = new HashMap<>();
        if (client == null) {
            log.info("📝 [SIMULATED HTS MINT]: {} for {}", amount, txId);
            result.put("success", true);
            result.put("simulated", true);
            return result;
        }

        try {
            if (tokenIdStr == null || tokenIdStr.isEmpty()) {
                throw new Exception("spring.hiero.tokenId missing");
            }
            TokenId tokenId = TokenId.fromString(tokenIdStr);

            long amountInMinorUnits = amount * 100L;

            TransactionResponse txResponse = new TokenMintTransaction()
                    .setTokenId(tokenId)
                    .setAmount(amountInMinorUnits)
                    .execute(client);

            TransactionReceipt receipt = txResponse.getReceipt(client);
            log.info("🚀 HTS Tokens Minted: {}. Status: {}", amount, receipt.status);

            result.put("success", true);
            result.put("transactionId", txResponse.transactionId.toString());
            result.put("status", receipt.status.toString());
        } catch (Exception e) {
            log.error("❌ HTS Mint Error: {}", e.getMessage());
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }

    public Map<String, Object> burnVaultTokens(long amount) {
        Map<String, Object> result = new HashMap<>();
        if (client == null) {
            log.info("📝 [SIMULATED HTS BURN]: {}", amount);
            result.put("success", true);
            result.put("simulated", true);
            return result;
        }

        try {
            if (tokenIdStr == null || tokenIdStr.isEmpty()) {
                throw new Exception("spring.hiero.tokenId missing");
            }
            TokenId tokenId = TokenId.fromString(tokenIdStr);
            
            long amountInMinorUnits = amount * 100L;

            TransactionResponse txResponse = new TokenBurnTransaction()
                    .setTokenId(tokenId)
                    .setAmount(amountInMinorUnits)
                    .execute(client);

            TransactionReceipt receipt = txResponse.getReceipt(client);
            String transactionId = txResponse.transactionId.toString();
            log.info("🚀 HTS Tokens Burned (Payout): {}. Status: {}. TxID: {}", amount, receipt.status, transactionId);

            result.put("success", true);
            result.put("status", receipt.status.toString());
            result.put("transactionId", transactionId);
        } catch (Exception e) {
            log.error("❌ HTS Burn Error: {}", e.getMessage());
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }

    public void observeEscrowEvents(String contractId) {
        if (contractEventClient == null) {
            log.warn("⚠️ ContractEventClient not available. Skipping observation.");
            return;
        }

        try {
            ContractId id = ContractId.fromString(contractId);
            contractEventClient.observeContractLogs(id, logEntry -> {
                log.info("🔔 New Smart Contract Event from {}: data={}, topics={}", 
                    id, logEntry.data(), logEntry.topics());
                
                // Here we would typically map the event to a business action
            });
            log.info("👀 Observing events for contract: {}", contractId);
        } catch (Exception e) {
            log.error("❌ Error starting event observation: {}", e.getMessage());
        }
    }

    public Map<String, Object> executeContractFunction(String functionName, String orderId) {
        Map<String, Object> result = new HashMap<>();
        if (client == null) {
            log.info("📝 [SIMULATED CONTRACT CALL]: {}({})", functionName, orderId);
            result.put("success", true);
            result.put("transactionId", "0.0.0@0.0");
            return result;
        }

        try {
            String contractIdStr = "0.0.5284312"; 
            ContractId contractId = ContractId.fromString(contractIdStr);

            TransactionResponse txResponse = new ContractExecuteTransaction()
                    .setContractId(contractId)
                    .setGas(100_000)
                    .setFunction(functionName, new ContractFunctionParameters()
                            .addString(orderId))
                    .execute(client);

            TransactionReceipt receipt = txResponse.getReceipt(client);
            String transactionId = txResponse.transactionId.toString();
            
            log.info("⚖️ Smart Contract Call: {}. Status: {}. TxID: {}", functionName, receipt.status, transactionId);

            result.put("success", true);
            result.put("transactionId", transactionId);
            result.put("status", receipt.status.toString());
        } catch (Exception e) {
            log.error("❌ Smart Contract Error [{}]: {}", functionName, e.getMessage());
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }
}
