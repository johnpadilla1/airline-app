package com.airline.service;

import com.airline.model.dto.FlightDTO;
import com.airline.model.dto.FlightEventDTO;
import com.airline.model.entity.Flight;
import com.airline.model.entity.FlightEvent;
import com.airline.model.enums.FlightStatus;
import com.airline.repository.FlightEventRepository;
import com.airline.repository.FlightRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    public Optional<FlightDTO> getFlightById(Long id) {
        return flightRepository.findById(id)
                .map(this::mapToDetailedDTO);
    }

    /**
     * Get flight by flight number
     */
    public Optional<FlightDTO> getFlightByNumber(String flightNumber) {
        return flightRepository.findByFlightNumber(flightNumber)
                .map(this::mapToDetailedDTO);
    }

    /**
     * Get flights by status
     */
    public List<FlightDTO> getFlightsByStatus(FlightStatus status) {
        return flightRepository.findByStatus(status).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get flights by airline
     */
    public List<FlightDTO> getFlightsByAirline(String airline) {
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
}
