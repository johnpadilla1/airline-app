package com.airline.model.entity;

import com.airline.model.enums.FlightStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "flights")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Flight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String flightNumber;

    @Column(nullable = false)
    private String airline;

    @Column(nullable = false)
    private String airlineName;

    @Column(nullable = false)
    private String origin;

    @Column(nullable = false)
    private String originCity;

    @Column(nullable = false)
    private String destination;

    @Column(nullable = false)
    private String destinationCity;

    @Column(nullable = false)
    private LocalDateTime scheduledDeparture;

    @Column(nullable = false)
    private LocalDateTime scheduledArrival;

    private LocalDateTime actualDeparture;

    private LocalDateTime actualArrival;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FlightStatus status;

    private String gate;

    private String terminal;

    @Builder.Default
    private Integer delayMinutes = 0;

    private String aircraft;

    @OneToMany(mappedBy = "flight", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<FlightEvent> events = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

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
