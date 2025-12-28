package com.airline.service;

import com.airline.exception.InvalidInputException;
import com.airline.exception.ResourceNotFoundException;
import com.airline.mapper.FlightMapper;
import com.airline.dto.FlightDTO;
import com.airline.dto.FlightEventDTO;
import com.airline.entity.Flight;
import com.airline.entity.FlightEvent;
import com.airline.enums.FlightStatus;
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
    private final FlightMapper flightMapper;

    private static final int MAX_FLIGHT_NUMBER_LENGTH = 10;
    private static final int MIN_FLIGHT_NUMBER_LENGTH = 3;

    /**
     * Get all flights
     */
    public List<FlightDTO> getAllFlights() {
        return flightMapper.toDTOList(flightRepository.findAll());
    }

    /**
     * Get flight by ID
     */
    @Cacheable(value = "flights", key = "#id")
    public Optional<FlightDTO> getFlightById(Long id) {
        validateFlightId(id);
        return flightRepository.findById(id)
                .map(flight -> {
                    List<FlightEvent> recentEvents = flightEventRepository
                            .findByFlightNumberOrderByEventTimestampDesc(flight.getFlightNumber())
                            .stream()
                            .limit(5)
                            .collect(Collectors.toList());
                    return flightMapper.toDetailedDTO(flight, recentEvents);
                });
    }

    /**
     * Get flight by flight number
     */
    @Cacheable(value = "flights", key = "#flightNumber")
    public Optional<FlightDTO> getFlightByNumber(String flightNumber) {
        validateFlightNumber(flightNumber);
        return flightRepository.findByFlightNumber(flightNumber)
                .map(flight -> {
                    List<FlightEvent> recentEvents = flightEventRepository
                            .findByFlightNumberOrderByEventTimestampDesc(flight.getFlightNumber())
                            .stream()
                            .limit(5)
                            .collect(Collectors.toList());
                    return flightMapper.toDetailedDTO(flight, recentEvents);
                });
    }

    /**
     * Get flights by status
     */
    public List<FlightDTO> getFlightsByStatus(FlightStatus status) {
        if (status == null) {
            throw new InvalidInputException("Flight status cannot be null");
        }
        return flightMapper.toDTOList(flightRepository.findByStatus(status));
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
        return flightMapper.toDTOList(flightRepository.findByAirline(airline));
    }

    /**
     * Get event history for a flight
     */
    public List<FlightEventDTO> getFlightEvents(String flightNumber) {
        return flightMapper.toEventDTOList(
                flightEventRepository.findByFlightNumberOrderByEventTimestampDesc(flightNumber)
        );
    }

    /**
     * Get recent events across all flights
     */
    public List<FlightEventDTO> getRecentEvents() {
        return flightMapper.toEventDTOList(
                flightEventRepository.findTop10ByOrderByEventTimestampDesc()
        );
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
