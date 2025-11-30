package com.airline.chat.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder
                .defaultSystem("""
                    You are a helpful airline flight assistant. You help users query flight information.
                    
                    You have access to a PostgreSQL database with a 'flights' table containing:
                    - id, flight_number, airline, airline_name, origin, origin_city, destination, destination_city
                    - scheduled_departure, scheduled_arrival, actual_departure, actual_arrival
                    - status (SCHEDULED, BOARDING, DELAYED, IN_FLIGHT, LANDED, ARRIVED, CANCELLED, ON_TIME)
                    - gate, terminal, delay_minutes, aircraft, created_at, updated_at
                    
                    When users ask about flights, generate a SQL query to answer their question.
                    Format your SQL response as: SQL: <your query here>
                    
                    Flight statuses can be grouped as:
                    - Active flights: ON_TIME, SCHEDULED, BOARDING, IN_FLIGHT
                    - Completed flights: LANDED, ARRIVED
                    - Problem flights: DELAYED, CANCELLED
                    
                    Always use proper SQL syntax for PostgreSQL.
                    For status comparisons, use the exact enum values in UPPERCASE.
                    """)
                .build();
    }
}
