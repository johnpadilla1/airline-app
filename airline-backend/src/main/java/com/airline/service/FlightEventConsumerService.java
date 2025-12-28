package com.airline.service;

import com.airline.config.KafkaTopicConfig;
import com.airline.dto.FlightEventDTO;
import com.airline.entity.Flight;
import com.airline.entity.FlightEvent;
import com.airline.enums.FlightEventType;
import com.airline.enums.FlightStatus;
import com.airline.repository.FlightEventRepository;
import com.airline.repository.FlightRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlightEventConsumerService {

    private final FlightRepository flightRepository;
    private final FlightEventRepository flightEventRepository;
    private final SseEmitterService sseEmitterService;

    @KafkaListener(
            topics = KafkaTopicConfig.FLIGHT_EVENTS_TOPIC,
            groupId = "airline-consumer-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    @Transactional
    @CacheEvict(value = "flights", key = "#eventDTO.flightNumber")
    public void consumeFlightEvent(FlightEventDTO eventDTO) {
        log.info("Received event: {} for flight {}", eventDTO.getEventType(), eventDTO.getFlightNumber());

        try {
            // Find the flight
            Optional<Flight> flightOpt = flightRepository.findByFlightNumber(eventDTO.getFlightNumber());

            if (flightOpt.isEmpty()) {
                log.warn("Flight not found: {}", eventDTO.getFlightNumber());
                return;
            }

            Flight flight = flightOpt.get();

            // Update flight based on event type
            updateFlight(flight, eventDTO);

            // Save updated flight
            flightRepository.save(flight);

            // Create and save flight event record
            FlightEvent flightEvent = createFlightEvent(eventDTO, flight);
            flightEventRepository.save(flightEvent);

            // Update the DTO with the saved event ID and processed timestamp
            eventDTO.setId(flightEvent.getId());
            eventDTO.setProcessedTimestamp(flightEvent.getProcessedTimestamp());

            // Broadcast to SSE clients
            sseEmitterService.broadcast(eventDTO);

            log.info("Successfully processed event {} for flight {}. Flight status: {}",
                    eventDTO.getEventType(),
                    eventDTO.getFlightNumber(),
                    flight.getStatus());

        } catch (Exception e) {
            log.error("Error processing event for flight {}: {}",
                    eventDTO.getFlightNumber(),
                    e.getMessage(), e);
        }
    }

    private void updateFlight(Flight flight, FlightEventDTO eventDTO) {
        switch (eventDTO.getEventType()) {
            case DELAY -> {
                int newDelay = Integer.parseInt(eventDTO.getNewValue());
                flight.setDelayMinutes(newDelay);
                flight.setStatus(FlightStatus.DELAYED);

                // Update actual departure time
                if (flight.getScheduledDeparture() != null) {
                    flight.setActualDeparture(flight.getScheduledDeparture().plusMinutes(newDelay));
                }
            }
            case GATE_CHANGE -> {
                flight.setGate(eventDTO.getNewValue());
            }
            case BOARDING_STARTED -> {
                flight.setStatus(FlightStatus.BOARDING);
            }
            case BOARDING_COMPLETED -> {
                flight.setStatus(FlightStatus.BOARDING);
            }
            case CANCELLATION -> {
                flight.setStatus(FlightStatus.CANCELLED);
            }
            case REINSTATEMENT -> {
                flight.setStatus(FlightStatus.ON_TIME);
                flight.setDelayMinutes(0);
            }
            case DEPARTED -> {
                flight.setStatus(FlightStatus.DEPARTED);
                flight.setActualDeparture(LocalDateTime.now());
            }
            case ARRIVED -> {
                flight.setStatus(FlightStatus.ARRIVED);
                flight.setActualArrival(LocalDateTime.now());
            }
            case DIVERTED -> {
                flight.setStatus(FlightStatus.DIVERTED);
                flight.setDestination(eventDTO.getNewValue());
            }
            case TERMINAL_CHANGE -> {
                flight.setTerminal(eventDTO.getNewValue());
            }
            case TIME_CHANGE -> {
                // Parse new time if provided
                if (eventDTO.getNewValue() != null) {
                    try {
                        LocalDateTime newTime = LocalDateTime.parse(eventDTO.getNewValue());
                        flight.setScheduledDeparture(newTime);
                    } catch (Exception e) {
                        log.warn("Could not parse new departure time: {}", eventDTO.getNewValue());
                    }
                }
            }
            case STATUS_UPDATE -> {
                // Generic status update
                if (eventDTO.getNewValue() != null) {
                    try {
                        FlightStatus newStatus = FlightStatus.valueOf(eventDTO.getNewValue());
                        flight.setStatus(newStatus);
                    } catch (IllegalArgumentException e) {
                        log.warn("Invalid status value: {}", eventDTO.getNewValue());
                    }
                }
            }
        }
    }

    private FlightEvent createFlightEvent(FlightEventDTO eventDTO, Flight flight) {
        return FlightEvent.builder()
                .flightNumber(eventDTO.getFlightNumber())
                .eventType(eventDTO.getEventType())
                .previousValue(eventDTO.getPreviousValue())
                .newValue(eventDTO.getNewValue())
                .description(eventDTO.getDescription())
                .eventTimestamp(eventDTO.getEventTimestamp() != null ?
                        eventDTO.getEventTimestamp() : LocalDateTime.now())
                .processedTimestamp(LocalDateTime.now())
                .flight(flight)
                .build();
    }
}
