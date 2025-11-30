package com.airline.notification.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${flight-service.url}")
    private String flightServiceUrl;

    @Bean
    public WebClient flightServiceWebClient() {
        return WebClient.builder()
                .baseUrl(flightServiceUrl)
                .build();
    }
}
