package com.airline.service;

import com.airline.config.KafkaTopicConfig;
import com.airline.model.dto.FlightEventDTO;
import com.airline.model.entity.Flight;
import com.airline.model.enums.FlightEventType;
import com.airline.model.enums.FlightStatus;
import com.airline.repository.FlightRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlightEventProducerService {

    private final KafkaTemplate<String, FlightEventDTO> kafkaTemplate;
    private final FlightRepository flightRepository;
    private final Random random = new Random();

    private static final String[] GATES = {"A1", "A2", "A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5",
            "C1", "C2", "C3", "C4", "C5", "D1", "D2", "D3", "D4", "D5"};

    /**
     * Publishes a random flight event every 30 seconds
     * Event distribution:
     * - 60% DELAY
     * - 20% GATE_CHANGE
     * - 10% BOARDING_STARTED
     * - 10% CANCELLATION
     */
    @Scheduled(fixedRate = 30000)
    public void publishRandomFlightEvent() {
        // Get all active flights (not cancelled or arrived)
        List<Flight> activeFlights = flightRepository.findByStatusNot(FlightStatus.CANCELLED);
        activeFlights.removeIf(f -> f.getStatus() == FlightStatus.ARRIVED);

        if (activeFlights.isEmpty()) {
            log.warn("No active flights available to generate events");
            return;
        }

        // Select a random flight
        Flight selectedFlight = activeFlights.get(random.nextInt(activeFlights.size()));

        // Generate weighted random event
        FlightEventDTO event = generateWeightedEvent(selectedFlight);

        // Publish to Kafka
        kafkaTemplate.send(KafkaTopicConfig.FLIGHT_EVENTS_TOPIC, event.getFlightNumber(), event)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Published event: {} for flight {} - {}",
                                event.getEventType(),
                                event.getFlightNumber(),
                                event.getDescription());
                    } else {
                        log.error("Failed to publish event for flight {}: {}",
                                event.getFlightNumber(),
                                ex.getMessage());
                    }
                });
    }

    private FlightEventDTO generateWeightedEvent(Flight flight) {
        int weight = random.nextInt(100);
        FlightEventType eventType;

        if (weight < 60) {
            eventType = FlightEventType.DELAY;
        } else if (weight < 80) {
            eventType = FlightEventType.GATE_CHANGE;
        } else if (weight < 90) {
            eventType = FlightEventType.BOARDING_STARTED;
        } else {
            eventType = FlightEventType.CANCELLATION;
        }

        return createEvent(flight, eventType);
    }

    private FlightEventDTO createEvent(Flight flight, FlightEventType eventType) {
        FlightEventDTO.FlightEventDTOBuilder builder = FlightEventDTO.builder()
                .flightNumber(flight.getFlightNumber())
                .eventType(eventType)
                .eventTimestamp(LocalDateTime.now());

        switch (eventType) {
            case DELAY -> {
                int newDelay = flight.getDelayMinutes() + 15 + random.nextInt(45);
                builder.previousValue(String.valueOf(flight.getDelayMinutes()))
                        .newValue(String.valueOf(newDelay))
                        .description(String.format("Flight %s delayed by %d minutes (total: %d min)",
                                flight.getFlightNumber(),
                                newDelay - flight.getDelayMinutes(),
                                newDelay));
            }
            case GATE_CHANGE -> {
                String newGate = GATES[random.nextInt(GATES.length)];
                while (newGate.equals(flight.getGate())) {
                    newGate = GATES[random.nextInt(GATES.length)];
                }
                builder.previousValue(flight.getGate())
                        .newValue(newGate)
                        .description(String.format("Flight %s gate changed from %s to %s",
                                flight.getFlightNumber(),
                                flight.getGate(),
                                newGate));
            }
            case BOARDING_STARTED -> {
                builder.previousValue(flight.getStatus().name())
                        .newValue(FlightStatus.BOARDING.name())
                        .description(String.format("Boarding has started for flight %s at gate %s",
                                flight.getFlightNumber(),
                                flight.getGate()));
            }
            case CANCELLATION -> {
                builder.previousValue(flight.getStatus().name())
                        .newValue(FlightStatus.CANCELLED.name())
                        .description(String.format("Flight %s from %s to %s has been cancelled",
                                flight.getFlightNumber(),
                                flight.getOriginCity(),
                                flight.getDestinationCity()));
            }
            default -> {
                builder.previousValue(flight.getStatus().name())
                        .newValue(flight.getStatus().name())
                        .description("Status update for flight " + flight.getFlightNumber());
            }
        }

        return builder.build();
    }

    /**
     * Manual method to publish a specific event (for testing)
     */
    public void publishEvent(FlightEventDTO event) {
        kafkaTemplate.send(KafkaTopicConfig.FLIGHT_EVENTS_TOPIC, event.getFlightNumber(), event)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Manually published event: {} for flight {}",
                                event.getEventType(),
                                event.getFlightNumber());
                    } else {
                        log.error("Failed to publish manual event: {}", ex.getMessage());
                    }
                });
    }
}
