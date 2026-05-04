package com.twiinex.v2.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@Service
public class SupabaseService {

    private static final Logger log = LoggerFactory.getLogger(SupabaseService.class);

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anonKey}")
    private String anonKey;

    @Autowired
    private RestTemplate restTemplate;

    private HttpHeaders getHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", anonKey);
        headers.set("Authorization", "Bearer " + anonKey);
        headers.set("Content-Type", "application/json");
        headers.set("Prefer", "return=representation");
        return headers;
    }

    public Map<String, Object> createTransaction(String sellerPhone, long amount, String description, String contractId, String imageUrl) {
        try {
            ensureSeller(sellerPhone);
            String url = supabaseUrl + "/transactions";
            log.info("Creating transaction at Supabase: {}", url);
            
            Map<String, Object> body = new HashMap<>();
            String txId = "TX-" + System.currentTimeMillis();
            body.put("id", txId);
            body.put("seller_phone", sellerPhone);
            body.put("amount", amount);
            body.put("description", description != null ? description : "New Order");
            body.put("status", "PENDING");
            
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("contractId", contractId);
            metadata.put("imageUrl", imageUrl != null ? imageUrl : "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=2070&auto=format&fit=crop");
            metadata.put("views", 0);
            metadata.put("history", new ArrayList<>());
            body.put("metadata", metadata);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, getHeaders());
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.POST, entity, Object.class);
            
            log.info("Supabase creation successful: {}", response.getStatusCode());
            if (response.getBody() instanceof List) {
                List<Map<String, Object>> list = (List<Map<String, Object>>) response.getBody();
                return list.isEmpty() ? null : list.get(0);
            }
            return (Map<String, Object>) response.getBody();
        } catch (Exception e) {
            log.error("❌ SUPABASE CRITICAL FAILURE: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create transaction in Supabase: " + e.getMessage());
        }
    }

    public List<Map<String, Object>> getTransactions(String sellerPhone) {
        try {
            String url = supabaseUrl + "/transactions?seller_phone=eq." + sellerPhone + "&select=*&order=created_at.desc";
            log.info("Fetching transactions from Supabase: {}", url);
            
            HttpEntity<Void> entity = new HttpEntity<>(getHeaders());
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
            
            log.info("Supabase fetch successful: {}", response.getStatusCode());
            return (List<Map<String, Object>>) response.getBody();
        } catch (Exception e) {
            log.error("Supabase fetch failed: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public Map<String, Object> getTransactionById(String id) {
        try {
            String url = supabaseUrl + "/transactions?id=eq." + id + "&select=*";
            
            HttpEntity<Void> entity = new HttpEntity<>(getHeaders());
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
            
            List<Map<String, Object>> list = (List<Map<String, Object>>) response.getBody();
            return (list != null && !list.isEmpty()) ? (Map<String, Object>) list.get(0) : null;
        } catch (Exception e) {
            log.error("Supabase fetch by ID failed: {}", e.getMessage());
            return null;
        }
    }

    public void ensureSeller(String phone) {
        try {
            String url = supabaseUrl + "/sellers";
            
            // First check if exists
            HttpEntity<Void> getEntity = new HttpEntity<>(getHeaders());
            ResponseEntity<List> checkResponse = restTemplate.exchange(url + "?phone=eq." + phone, HttpMethod.GET, getEntity, List.class);
            
            if (checkResponse.getBody() == null || checkResponse.getBody().isEmpty()) {
                log.info("Seller {} not found, creating dummy record...", phone);
                Map<String, Object> body = new HashMap<>();
                body.put("phone", phone);
                body.put("name", "V2 Seller");
                body.put("network", "testnet");
                
                HttpEntity<Map<String, Object>> postEntity = new HttpEntity<>(body, getHeaders());
                restTemplate.exchange(url, HttpMethod.POST, postEntity, Map.class);
            }
        } catch (Exception e) {
            log.warn("Ensure seller failed (might already exist): {}", e.getMessage());
        }
    }

    public Map<String, Object> getSellerByEmail(String email) {
        try {
            String url = supabaseUrl + "/sellers?email=eq." + email + "&select=*";
            HttpEntity<Void> entity = new HttpEntity<>(getHeaders());
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
            List<Map<String, Object>> list = (List<Map<String, Object>>) response.getBody();
            return (list != null && !list.isEmpty()) ? (Map<String, Object>) list.get(0) : null;
        } catch (Exception e) {
            log.error("Supabase fetch seller by email failed: {}", e.getMessage());
            return null;
        }
    }

    public Map<String, Object> getSellerByPhone(String phone) {
        try {
            String url = supabaseUrl + "/sellers?phone=eq." + phone + "&select=*";
            HttpEntity<Void> entity = new HttpEntity<>(getHeaders());
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
            List<Map<String, Object>> list = (List<Map<String, Object>>) response.getBody();
            return (list != null && !list.isEmpty()) ? (Map<String, Object>) list.get(0) : null;
        } catch (Exception e) {
            log.error("Supabase fetch seller by phone failed: {}", e.getMessage());
            return null;
        }
    }

    public Map<String, Object> createSeller(Map<String, Object> sellerData) {
        try {
            String url = supabaseUrl + "/sellers";
            HttpHeaders headers = getHeaders();
            headers.set("Prefer", "return=representation,resolution=merge-duplicates");
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(sellerData, headers);
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.POST, entity, Object.class);
            if (response.getBody() instanceof List) {
                List<Map<String, Object>> list = (List<Map<String, Object>>) response.getBody();
                return list.isEmpty() ? null : list.get(0);
            }
            return (Map<String, Object>) response.getBody();
        } catch (Exception e) {
            log.error("Supabase create/upsert seller failed: {}", e.getMessage());
            return null;
        }
    }

    public void updateStatus(String txId, String status, Map<String, Object> additionalMetadata) {
        try {
            String url = supabaseUrl + "/transactions?id=eq." + txId;
            log.info("Updating status to {} for txId: {}", status, txId);
            
            Map<String, Object> body = new HashMap<>();
            body.put("status", status);
            if (additionalMetadata != null) {
                body.put("metadata", additionalMetadata);
            }

            HttpHeaders headers = getHeaders();
            // Remove representation to reduce response size and potential parsing issues
            headers.remove("Prefer"); 
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.PATCH, entity, Object.class);
            log.info("Supabase update status response: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("❌ SUPABASE UPDATE FAILED: {}", e.getMessage());
            // Log full error for debugging if needed
        }
    }
}
