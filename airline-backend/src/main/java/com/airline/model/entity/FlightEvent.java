package com.airline.model.entity;

import com.airline.model.enums.FlightEventType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "flight_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlightEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String flightNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FlightEventType eventType;

    private String previousValue;

    private String newValue;

    private String description;

    @Column(nullable = false)
    private LocalDateTime eventTimestamp;

    private LocalDateTime processedTimestamp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_id")
    private Flight flight;

    @PrePersist
    protected void onCreate() {
        if (processedTimestamp == null) {
            processedTimestamp = LocalDateTime.now();
        }
    }
}
