package com.twiinex.v2.controller;

import com.twiinex.v2.service.SupabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private SupabaseService supabaseService;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @PostMapping("/signup")
    public Map<String, Object> signup(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String name = request.get("name");
        String phone = request.get("phone");

        Map<String, Object> response = new HashMap<>();

        if (supabaseService.getSellerByEmail(email) != null) {
            response.put("success", false);
            response.put("message", "Email already exists");
            return response;
        }

        Map<String, Object> existingPhone = supabaseService.getSellerByPhone(phone);
        if (existingPhone != null && existingPhone.get("password_hash") != null) {
            response.put("success", false);
            response.put("message", "Phone number already registered");
            return response;
        }

        Map<String, Object> sellerData = new HashMap<>();
        sellerData.put("email", email);
        sellerData.put("password_hash", passwordEncoder.encode(password));
        sellerData.put("name", name);
        sellerData.put("phone", phone);
        sellerData.put("network", "testnet");

        Map<String, Object> result = supabaseService.createSeller(sellerData);
        if (result != null) {
            response.put("success", true);
            response.put("user", result);
        } else {
            response.put("success", false);
            response.put("message", "Signup failed");
        }

        return response;
    }

    @PostMapping("/signin")
    public Map<String, Object> signin(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        Map<String, Object> response = new HashMap<>();
        Map<String, Object> seller = supabaseService.getSellerByEmail(email);

        if (seller == null) {
            response.put("success", false);
            response.put("message", "User not found");
            return response;
        }

        String storedHash = (String) seller.get("password_hash");
        if (passwordEncoder.matches(password, storedHash)) {
            response.put("success", true);
            response.put("user", seller);
        } else {
            response.put("success", false);
            response.put("message", "Invalid password");
        }

        return response;
    }
}
