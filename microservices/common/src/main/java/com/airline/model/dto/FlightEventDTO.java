package com.airline.model.dto;

import com.airline.model.enums.FlightEventType;
import com.airline.model.enums.FlightStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlightEventDTO {
    private Long id;
    private Long flightId;
    private String flightNumber;
    private String airline;
    private String airlineName;
    private String origin;
    private String originCity;
    private String destination;
    private String destinationCity;
    private FlightEventType eventType;
    private String description;
    private String oldValue;
    private String newValue;
    private FlightStatus newStatus;
    private String newGate;
    private Integer newDelayMinutes;
    private LocalDateTime timestamp;
}
