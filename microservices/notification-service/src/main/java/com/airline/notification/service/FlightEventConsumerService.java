package com.airline.notification.service;

import com.airline.model.dto.FlightDTO;
import com.airline.model.dto.FlightEventDTO;
import com.airline.model.entity.FlightEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlightEventConsumerService {

    private final SseEmitterService sseEmitterService;
    private final WebClient flightServiceWebClient;

    @KafkaListener(topics = "flight-events", groupId = "notification-consumer-group")
    public void consumeFlightEvent(FlightEventDTO event) {
        log.info("Received event: {} for flight {}", event.getEventType(), event.getFlightNumber());

        try {
            // Update flight in flight-service via REST
            updateFlight(event);

            // Save event to flight-service
            saveFlightEvent(event);

            // Broadcast to connected browsers via SSE
            sseEmitterService.broadcastEvent(event);

        } catch (Exception e) {
            log.error("Error processing flight event: {}", e.getMessage(), e);
        }
    }

    private void updateFlight(FlightEventDTO event) {
        FlightDTO updates = FlightDTO.builder()
                .status(event.getNewStatus())
                .gate(event.getNewGate())
                .delayMinutes(event.getNewDelayMinutes())
                .build();

        try {
            flightServiceWebClient.put()
                    .uri("/api/flights/{id}", event.getFlightId())
                    .bodyValue(updates)
                    .retrieve()
                    .bodyToMono(FlightDTO.class)
                    .block();

            log.debug("Updated flight {} via flight-service", event.getFlightNumber());
        } catch (Exception e) {
            log.error("Failed to update flight {}: {}", event.getFlightNumber(), e.getMessage());
        }
    }

    private void saveFlightEvent(FlightEventDTO event) {
        FlightEvent flightEvent = FlightEvent.builder()
                .flightId(event.getFlightId())
                .flightNumber(event.getFlightNumber())
                .eventType(event.getEventType())
                .description(event.getDescription())
                .oldValue(event.getOldValue())
                .newValue(event.getNewValue())
                .build();

        try {
            flightServiceWebClient.post()
                    .uri("/api/flights/events")
                    .bodyValue(flightEvent)
                    .retrieve()
                    .bodyToMono(FlightEvent.class)
                    .block();

            log.debug("Saved event for flight {} via flight-service", event.getFlightNumber());
        } catch (Exception e) {
            log.error("Failed to save event for flight {}: {}", event.getFlightNumber(), e.getMessage());
        }
    }
}
