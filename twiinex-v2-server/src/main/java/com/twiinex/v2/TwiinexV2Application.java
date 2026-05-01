package com.twiinex.v2;

import org.hiero.spring.EnableHiero;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableHiero
public class TwiinexV2Application {
    public static void main(String[] args) {
        SpringApplication.run(TwiinexV2Application.class, args);
    }
}
