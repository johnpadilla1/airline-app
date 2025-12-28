package com.airline.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private int serverPort;

    @Value("${spring.application.name:Airline Backend}")
    private String applicationName;

    @Bean
    public OpenAPI airlineOpenAPI() {
        String devServerUrl = "http://localhost:" + serverPort;

        Server devServer = new Server()
                .url(devServerUrl)
                .description("Development Server");

        Contact contact = new Contact()
                .name("Airline API Support")
                .email("support@airline.com")
                .url("https://airline.com");

        License license = new License()
                .name("MIT License")
                .url("https://choosealicense.com/licenses/mit/");

        Info info = new Info()
                .title("Airline Flight Tracker API")
                .version("1.0.0")
                .description("RESTful API for tracking airline flights in real-time. " +
                        "Provides flight information, event history, and AI-powered chat interface.")
                .contact(contact)
                .license(license);

        return new OpenAPI()
                .info(info)
                .servers(List.of(devServer));
    }
}
