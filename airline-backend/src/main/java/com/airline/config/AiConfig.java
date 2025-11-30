package com.airline.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.RestClient;

@Configuration
public class AiConfig {

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;
    
    @Value("${spring.ai.openai.base-url}")
    private String baseUrl;
    
    @Value("${spring.ai.openai.chat.options.model}")
    private String model;

    private static final String SYSTEM_PROMPT = """
        You are a flight database assistant. Answer questions about flights by generating SQL queries.
        
        TABLE: flights
        COLUMNS: id, flight_number, airline, airline_name, origin, origin_city, destination, destination_city, scheduled_departure, scheduled_arrival, actual_departure, actual_arrival, status, gate, terminal, delay_minutes, aircraft
        
        STATUS VALUES: SCHEDULED, ON_TIME, BOARDING, DELAYED, DEPARTED, IN_FLIGHT, LANDED, ARRIVED, CANCELLED, DIVERTED
        
        IMPORTANT RULES:
        1. Always include FROM flights in your query
        2. First line of response MUST be: SQL: SELECT ... FROM flights WHERE ...
        3. Put the complete SQL query on ONE line after "SQL: "
        4. After the SQL line, add a blank line, then your explanation
        
        STATUS GROUPINGS:
        - For "in flight" or "flying": WHERE status IN ('IN_FLIGHT', 'DEPARTED')
        - For "landed" or "arrived": WHERE status IN ('LANDED', 'ARRIVED')
        
        EXAMPLES:
        
        Q: How many delayed flights?
        SQL: SELECT COUNT(*) as count FROM flights WHERE status = 'DELAYED'
        
        This counts all currently delayed flights.
        
        Q: Which flights are boarding?
        SQL: SELECT flight_number, airline_name, origin, destination, gate, terminal FROM flights WHERE status = 'BOARDING' ORDER BY scheduled_departure
        
        These are the flights currently boarding.
        
        Q: Show flights from JFK
        SQL: SELECT flight_number, airline_name, destination, scheduled_departure, status, gate FROM flights WHERE origin = 'JFK' ORDER BY scheduled_departure
        
        Here are all flights departing from JFK.
        """;

    @Bean
    public OpenAiApi openAiApi() {
        // Create RestClient with custom headers for OpenRouter
        RestClient.Builder restClientBuilder = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader("HTTP-Referer", "http://localhost:8080")
                .defaultHeader("X-Title", "Airline Flight Tracker");
        
        return OpenAiApi.builder()
                .baseUrl(baseUrl)
                .apiKey(apiKey)
                .completionsPath("/v1/chat/completions")
                .restClientBuilder(restClientBuilder)
                .build();
    }

    @Bean
    public OpenAiChatModel chatModel(OpenAiApi openAiApi) {
        return OpenAiChatModel.builder()
                .openAiApi(openAiApi)
                .defaultOptions(OpenAiChatOptions.builder()
                        .model(model)
                        .temperature(0.7)
                        .build())
                .build();
    }

    @Bean
    public ChatMemory chatMemory() {
        // Keep last 6 messages (3 exchanges) per conversation
        return MessageWindowChatMemory.builder()
                .maxMessages(6)
                .build();
    }

    @Bean
    public ChatClient chatClient(OpenAiChatModel chatModel, ChatMemory chatMemory) {
        return ChatClient.builder(chatModel)
                .defaultSystem(SYSTEM_PROMPT)
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .build();
    }
}
