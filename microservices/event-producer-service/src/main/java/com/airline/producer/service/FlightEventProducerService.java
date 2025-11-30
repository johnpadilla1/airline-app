package com.airline.producer.service;

import com.airline.model.dto.FlightDTO;
import com.airline.model.dto.FlightEventDTO;
import com.airline.model.enums.FlightEventType;
import com.airline.model.enums.FlightStatus;
import com.airline.producer.config.KafkaTopicConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "event-producer.enabled", havingValue = "true", matchIfMissing = true)
public class FlightEventProducerService {

    private final KafkaTemplate<String, FlightEventDTO> kafkaTemplate;
    private final WebClient flightServiceWebClient;
    private final Random random = new Random();

    private static final String[] GATES = {"A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D1", "D2"};

    @Scheduled(fixedRateString = "${event-producer.interval-ms:8000}")
    public void generateRandomEvent() {
        try {
            // Get a random flight from flight-service
            FlightDTO flight = flightServiceWebClient.get()
                    .uri("/api/flights/random")
                    .retrieve()
                    .bodyToMono(FlightDTO.class)
                    .block();

            if (flight == null) {
                log.warn("No flight returned from flight-service");
                return;
            }

            FlightEventDTO event = createRandomEvent(flight);
            
            kafkaTemplate.send(KafkaTopicConfig.FLIGHT_EVENTS_TOPIC, flight.getFlightNumber(), event)
                    .whenComplete((result, ex) -> {
                        if (ex == null) {
                            log.info("Published event: {} for flight {}", event.getEventType(), flight.getFlightNumber());
                        } else {
                            log.error("Failed to publish event for flight {}: {}", flight.getFlightNumber(), ex.getMessage());
                        }
                    });

        } catch (Exception e) {
            log.error("Error generating flight event: {}", e.getMessage());
        }
    }

    private FlightEventDTO createRandomEvent(FlightDTO flight) {
        FlightEventType eventType = pickRandomEventType(flight.getStatus());
        
        FlightEventDTO.FlightEventDTOBuilder builder = FlightEventDTO.builder()
                .flightId(flight.getId())
                .flightNumber(flight.getFlightNumber())
                .airline(flight.getAirline())
                .airlineName(flight.getAirlineName())
                .origin(flight.getOrigin())
                .originCity(flight.getOriginCity())
                .destination(flight.getDestination())
                .destinationCity(flight.getDestinationCity())
                .eventType(eventType)
                .timestamp(LocalDateTime.now());

        switch (eventType) {
            case STATUS_CHANGE -> {
                FlightStatus newStatus = pickNewStatus(flight.getStatus());
                builder.oldValue(flight.getStatus().name())
                        .newValue(newStatus.name())
                        .newStatus(newStatus)
                        .description("Flight status changed from " + flight.getStatus() + " to " + newStatus);
            }
            case GATE_CHANGE -> {
                String newGate = GATES[random.nextInt(GATES.length)];
                builder.oldValue(flight.getGate())
                        .newValue(newGate)
                        .newGate(newGate)
                        .description("Gate changed from " + flight.getGate() + " to " + newGate);
            }
            case DELAY -> {
                int delayMinutes = (random.nextInt(6) + 1) * 15; // 15, 30, 45, 60, 75, 90 minutes
                builder.oldValue(String.valueOf(flight.getDelayMinutes()))
                        .newValue(String.valueOf(delayMinutes))
                        .newDelayMinutes(delayMinutes)
                        .newStatus(FlightStatus.DELAYED)
                        .description("Flight delayed by " + delayMinutes + " minutes");
            }
            case BOARDING_STARTED -> {
                builder.newStatus(FlightStatus.BOARDING)
                        .description("Boarding has started at gate " + flight.getGate());
            }
            case DEPARTURE -> {
                builder.newStatus(FlightStatus.IN_FLIGHT)
                        .description("Flight has departed from " + flight.getOriginCity());
            }
            case ARRIVAL -> {
                builder.newStatus(FlightStatus.LANDED)
                        .description("Flight has landed at " + flight.getDestinationCity());
            }
            case FINAL_CALL -> {
                builder.description("Final boarding call for gate " + flight.getGate());
            }
            case CANCELLATION -> {
                builder.newStatus(FlightStatus.CANCELLED)
                        .description("Flight has been cancelled");
            }
        }

        return builder.build();
    }

    private FlightEventType pickRandomEventType(FlightStatus currentStatus) {
        return switch (currentStatus) {
            case SCHEDULED, ON_TIME -> {
                int r = random.nextInt(100);
                if (r < 40) yield FlightEventType.STATUS_CHANGE;
                else if (r < 60) yield FlightEventType.GATE_CHANGE;
                else if (r < 80) yield FlightEventType.DELAY;
                else if (r < 95) yield FlightEventType.BOARDING_STARTED;
                else yield FlightEventType.CANCELLATION;
            }
            case BOARDING -> {
                int r = random.nextInt(100);
                if (r < 50) yield FlightEventType.FINAL_CALL;
                else if (r < 80) yield FlightEventType.DEPARTURE;
                else yield FlightEventType.DELAY;
            }
            case IN_FLIGHT -> FlightEventType.ARRIVAL;
            case DELAYED -> {
                int r = random.nextInt(100);
                if (r < 30) yield FlightEventType.DELAY;
                else if (r < 70) yield FlightEventType.STATUS_CHANGE;
                else if (r < 90) yield FlightEventType.GATE_CHANGE;
                else yield FlightEventType.CANCELLATION;
            }
            default -> FlightEventType.STATUS_CHANGE;
        };
    }

    private FlightStatus pickNewStatus(FlightStatus currentStatus) {
        return switch (currentStatus) {
            case SCHEDULED -> random.nextBoolean() ? FlightStatus.ON_TIME : FlightStatus.BOARDING;
            case ON_TIME -> FlightStatus.BOARDING;
            case BOARDING -> FlightStatus.IN_FLIGHT;
            case IN_FLIGHT -> FlightStatus.LANDED;
            case LANDED -> FlightStatus.ARRIVED;
            case DELAYED -> random.nextBoolean() ? FlightStatus.BOARDING : FlightStatus.ON_TIME;
            default -> FlightStatus.ON_TIME;
        };
    }
}
