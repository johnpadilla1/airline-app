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
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlightEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "flight_id", nullable = false)
    private Long flightId;

    @Column(name = "flight_number", nullable = false)
    private String flightNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private FlightEventType eventType;

    @Column(nullable = false)
    private String description;

    @Column(name = "old_value")
    private String oldValue;

    @Column(name = "new_value")
    private String newValue;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
