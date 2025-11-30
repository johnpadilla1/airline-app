package com.airline.model.entity;

import com.airline.model.enums.FlightStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "flights")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Flight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "flight_number", nullable = false, unique = true)
    private String flightNumber;

    @Column(nullable = false, length = 3)
    private String airline;

    @Column(name = "airline_name")
    private String airlineName;

    @Column(nullable = false, length = 3)
    private String origin;

    @Column(name = "origin_city")
    private String originCity;

    @Column(nullable = false, length = 3)
    private String destination;

    @Column(name = "destination_city")
    private String destinationCity;

    @Column(name = "scheduled_departure", nullable = false)
    private LocalDateTime scheduledDeparture;

    @Column(name = "scheduled_arrival", nullable = false)
    private LocalDateTime scheduledArrival;

    @Column(name = "actual_departure")
    private LocalDateTime actualDeparture;

    @Column(name = "actual_arrival")
    private LocalDateTime actualArrival;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FlightStatus status;

    private String gate;

    private String terminal;

    @Column(name = "delay_minutes")
    private Integer delayMinutes = 0;

    private String aircraft;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
