package com.airline.mapper;

import com.airline.dto.FlightDTO;
import com.airline.dto.FlightEventDTO;
import com.airline.entity.Flight;
import com.airline.entity.FlightEvent;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper utility class for converting between Flight entities and DTOs.
 * Follows Spring Boot best practice of separating mapping logic from service layer.
 */
@Component
public class FlightMapper {

    /**
     * Map Flight entity to basic FlightDTO (without events)
     */
    public FlightDTO toDTO(Flight flight) {
        if (flight == null) {
            return null;
        }

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
     * Map Flight entity to FlightDTO with recent events
     */
    public FlightDTO toDetailedDTO(Flight flight, List<FlightEvent> recentEvents) {
        FlightDTO dto = toDTO(flight);
        
        if (recentEvents != null && !recentEvents.isEmpty()) {
            List<FlightEventDTO> eventDTOs = recentEvents.stream()
                    .map(this::toEventDTO)
                    .collect(Collectors.toList());
            dto.setRecentEvents(eventDTOs);
        }
        
        return dto;
    }

    /**
     * Map FlightEvent entity to FlightEventDTO
     */
    public FlightEventDTO toEventDTO(FlightEvent event) {
        if (event == null) {
            return null;
        }

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
     * Map list of Flight entities to list of FlightDTOs
     */
    public List<FlightDTO> toDTOList(List<Flight> flights) {
        if (flights == null) {
            return List.of();
        }

        return flights.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Map list of FlightEvent entities to list of FlightEventDTOs
     */
    public List<FlightEventDTO> toEventDTOList(List<FlightEvent> events) {
        if (events == null) {
            return List.of();
        }

        return events.stream()
                .map(this::toEventDTO)
                .collect(Collectors.toList());
    }
}
