package com.airline.flight.service;

import com.airline.model.dto.FlightDTO;
import com.airline.model.dto.FlightEventDTO;
import com.airline.model.entity.Flight;
import com.airline.model.entity.FlightEvent;
import com.airline.model.enums.FlightStatus;
import com.airline.flight.repository.FlightEventRepository;
import com.airline.flight.repository.FlightRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlightService {

    private final FlightRepository flightRepository;
    private final FlightEventRepository flightEventRepository;
    private final Random random = new Random();

    public List<FlightDTO> getAllFlights() {
        return flightRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Optional<FlightDTO> getFlightById(Long id) {
        return flightRepository.findById(id).map(this::toDTO);
    }

    public Optional<FlightDTO> getFlightByNumber(String flightNumber) {
        return flightRepository.findByFlightNumber(flightNumber).map(this::toDTO);
    }

    public List<FlightDTO> getFlightsByStatus(FlightStatus status) {
        return flightRepository.findByStatus(status).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public FlightDTO getRandomFlight() {
        List<Flight> flights = flightRepository.findAll();
        if (flights.isEmpty()) {
            throw new RuntimeException("No flights available");
        }
        Flight randomFlight = flights.get(random.nextInt(flights.size()));
        return toDTO(randomFlight);
    }

    @Transactional
    public FlightDTO updateFlightStatus(Long flightId, FlightStatus newStatus) {
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new RuntimeException("Flight not found: " + flightId));
        flight.setStatus(newStatus);
        return toDTO(flightRepository.save(flight));
    }

    @Transactional
    public FlightDTO updateFlightGate(Long flightId, String newGate) {
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new RuntimeException("Flight not found: " + flightId));
        flight.setGate(newGate);
        return toDTO(flightRepository.save(flight));
    }

    @Transactional
    public FlightDTO updateFlightDelay(Long flightId, int delayMinutes) {
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new RuntimeException("Flight not found: " + flightId));
        flight.setDelayMinutes(delayMinutes);
        if (delayMinutes > 0) {
            flight.setStatus(FlightStatus.DELAYED);
        }
        return toDTO(flightRepository.save(flight));
    }

    @Transactional
    public FlightDTO updateFlight(Long flightId, FlightDTO updates) {
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new RuntimeException("Flight not found: " + flightId));
        
        if (updates.getStatus() != null) {
            flight.setStatus(updates.getStatus());
        }
        if (updates.getGate() != null) {
            flight.setGate(updates.getGate());
        }
        if (updates.getDelayMinutes() != null) {
            flight.setDelayMinutes(updates.getDelayMinutes());
        }
        
        return toDTO(flightRepository.save(flight));
    }

    @Transactional
    public FlightEvent saveFlightEvent(FlightEvent event) {
        return flightEventRepository.save(event);
    }

    public List<FlightEventDTO> getRecentEvents() {
        return flightEventRepository.findTop20ByOrderByCreatedAtDesc().stream()
                .map(this::toEventDTO)
                .collect(Collectors.toList());
    }

    public List<FlightEventDTO> getFlightEvents(Long flightId) {
        return flightEventRepository.findByFlightIdOrderByCreatedAtDesc(flightId).stream()
                .map(this::toEventDTO)
                .collect(Collectors.toList());
    }

    private FlightDTO toDTO(Flight flight) {
        List<FlightEventDTO> recentEvents = flightEventRepository
                .findTop5ByFlightIdOrderByCreatedAtDesc(flight.getId()).stream()
                .map(this::toEventDTO)
                .collect(Collectors.toList());

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
                .recentEvents(recentEvents)
                .build();
    }

    private FlightEventDTO toEventDTO(FlightEvent event) {
        return FlightEventDTO.builder()
                .id(event.getId())
                .flightId(event.getFlightId())
                .flightNumber(event.getFlightNumber())
                .eventType(event.getEventType())
                .description(event.getDescription())
                .oldValue(event.getOldValue())
                .newValue(event.getNewValue())
                .timestamp(event.getCreatedAt())
                .build();
    }
}
