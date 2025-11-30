package com.airline.model.dto;

import com.airline.model.enums.FlightStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlightDTO {
    private Long id;
    private String flightNumber;
    private String airline;
    private String airlineName;
    private String origin;
    private String originCity;
    private String destination;
    private String destinationCity;
    private LocalDateTime scheduledDeparture;
    private LocalDateTime scheduledArrival;
    private LocalDateTime actualDeparture;
    private LocalDateTime actualArrival;
    private FlightStatus status;
    private String gate;
    private String terminal;
    private Integer delayMinutes;
    private String aircraft;
    private LocalDateTime updatedAt;
    private List<FlightEventDTO> recentEvents;
}
