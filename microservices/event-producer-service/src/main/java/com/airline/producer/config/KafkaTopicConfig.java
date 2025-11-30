package com.airline.producer.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    public static final String FLIGHT_EVENTS_TOPIC = "flight-events";

    @Bean
    public NewTopic flightEventsTopic() {
        return TopicBuilder.name(FLIGHT_EVENTS_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
