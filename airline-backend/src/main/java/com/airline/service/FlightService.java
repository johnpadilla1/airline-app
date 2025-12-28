package com.airline.service;

import com.airline.exception.InvalidInputException;
import com.airline.exception.ResourceNotFoundException;
import com.airline.model.dto.FlightDTO;
import com.airline.model.dto.FlightEventDTO;
import com.airline.model.entity.Flight;
import com.airline.model.entity.FlightEvent;
import com.airline.model.enums.FlightStatus;
import com.airline.repository.FlightEventRepository;
import com.airline.repository.FlightRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class FlightService {

    private final FlightRepository flightRepository;
    private final FlightEventRepository flightEventRepository;

    private static final int MAX_FLIGHT_NUMBER_LENGTH = 10;
    private static final int MIN_FLIGHT_NUMBER_LENGTH = 3;

    /**
     * Get all flights
     */
    public List<FlightDTO> getAllFlights() {
        return flightRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get flight by ID
     */
    @Cacheable(value = "flights", key = "#id")
    public Optional<FlightDTO> getFlightById(Long id) {
        validateFlightId(id);
        return flightRepository.findById(id)
                .map(this::mapToDetailedDTO);
    }

    /**
     * Get flight by flight number
     */
    @Cacheable(value = "flights", key = "#flightNumber")
    public Optional<FlightDTO> getFlightByNumber(String flightNumber) {
        validateFlightNumber(flightNumber);
        return flightRepository.findByFlightNumber(flightNumber)
                .map(this::mapToDetailedDTO);
    }

    /**
     * Get flights by status
     */
    public List<FlightDTO> getFlightsByStatus(FlightStatus status) {
        if (status == null) {
            throw new InvalidInputException("Flight status cannot be null");
        }
        return flightRepository.findByStatus(status).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get flights by airline
     */
    public List<FlightDTO> getFlightsByAirline(String airline) {
        if (airline == null || airline.trim().isEmpty()) {
            throw new InvalidInputException("Airline code cannot be empty");
        }
        if (airline.length() > 10) {
            throw new InvalidInputException("Airline code cannot exceed 10 characters");
        }
        return flightRepository.findByAirline(airline).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get event history for a flight
     */
    public List<FlightEventDTO> getFlightEvents(String flightNumber) {
        return flightEventRepository.findByFlightNumberOrderByEventTimestampDesc(flightNumber).stream()
                .map(this::mapEventToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get recent events across all flights
     */
    public List<FlightEventDTO> getRecentEvents() {
        return flightEventRepository.findTop10ByOrderByEventTimestampDesc().stream()
                .map(this::mapEventToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Map Flight entity to DTO (basic)
     */
    private FlightDTO mapToDTO(Flight flight) {
        return FlightDTO.builder()
                .id(flight.getId())
                .flightNumber(flight.getFlightNumber())
                .airline(flight.getAirline())
                .airlineName(flight.getAirlineName())
                .origin(flight.getOrigin())
                .originCity(flight.getOriginCity())
                .destination(flight.getDestination())
                .destinationCity(flight.getDestinationCity())
                .scheduledDeparture(flight.getScheduledDeparture())
                .scheduledArrival(flight.getScheduledArrival())
                .actualDeparture(flight.getActualDeparture())
                .actualArrival(flight.getActualArrival())
                .status(flight.getStatus())
                .gate(flight.getGate())
                .terminal(flight.getTerminal())
                .delayMinutes(flight.getDelayMinutes())
                .aircraft(flight.getAircraft())
                .updatedAt(flight.getUpdatedAt())
                .build();
    }

    /**
     * Map Flight entity to DTO with recent events
     */
    private FlightDTO mapToDetailedDTO(Flight flight) {
        FlightDTO dto = mapToDTO(flight);

        // Get recent events for this flight (last 5)
        List<FlightEventDTO> recentEvents = flightEventRepository
                .findByFlightNumberOrderByEventTimestampDesc(flight.getFlightNumber())
                .stream()
                .limit(5)
                .map(this::mapEventToDTO)
                .collect(Collectors.toList());

        dto.setRecentEvents(recentEvents);
        return dto;
    }

    /**
     * Map FlightEvent entity to DTO
     */
    private FlightEventDTO mapEventToDTO(FlightEvent event) {
        return FlightEventDTO.builder()
                .id(event.getId())
                .flightNumber(event.getFlightNumber())
                .eventType(event.getEventType())
                .previousValue(event.getPreviousValue())
                .newValue(event.getNewValue())
                .description(event.getDescription())
                .eventTimestamp(event.getEventTimestamp())
                .processedTimestamp(event.getProcessedTimestamp())
                .build();
    }

    /**
     * Validate flight ID
     */
    private void validateFlightId(Long id) {
        if (id == null) {
            throw new InvalidInputException("Flight ID cannot be null");
        }
        if (id <= 0) {
            throw new InvalidInputException("Flight ID must be positive");
        }
    }

    /**
     * Validate flight number
     */
    private void validateFlightNumber(String flightNumber) {
        if (flightNumber == null || flightNumber.trim().isEmpty()) {
            throw new InvalidInputException("Flight number cannot be empty");
        }
        if (flightNumber.length() < MIN_FLIGHT_NUMBER_LENGTH ||
            flightNumber.length() > MAX_FLIGHT_NUMBER_LENGTH) {
            throw new InvalidInputException(String.format(
                    "Flight number must be between %d and %d characters",
                    MIN_FLIGHT_NUMBER_LENGTH, MAX_FLIGHT_NUMBER_LENGTH));
        }
    }
}
