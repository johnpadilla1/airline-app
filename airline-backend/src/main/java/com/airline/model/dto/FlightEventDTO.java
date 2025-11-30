package com.airline.model.dto;

import com.airline.model.enums.FlightEventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlightEventDTO {

    private Long id;
    private String flightNumber;
    private FlightEventType eventType;
    private String previousValue;
    private String newValue;
    private String description;
    private LocalDateTime eventTimestamp;
    private LocalDateTime processedTimestamp;
}
