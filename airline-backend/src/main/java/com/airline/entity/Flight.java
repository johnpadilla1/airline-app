package com.airline.entity;

import com.airline.enums.FlightStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
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

    @NotBlank(message = "Flight number is required")
    @Size(min = 3, max = 10, message = "Flight number must be between 3 and 10 characters")
    @Column(nullable = false, unique = true)
    private String flightNumber;

    @NotBlank(message = "Airline code is required")
    @Size(max = 10, message = "Airline code cannot exceed 10 characters")
    @Column(nullable = false)
    private String airline;

    @NotBlank(message = "Airline name is required")
    @Column(nullable = false)
    private String airlineName;

    @NotBlank(message = "Origin airport code is required")
    @Size(min = 3, max = 3, message = "Origin must be a 3-letter airport code")
    @Column(nullable = false)
    private String origin;

    @NotBlank(message = "Origin city is required")
    @Column(nullable = false)
    private String originCity;

    @NotBlank(message = "Destination airport code is required")
    @Size(min = 3, max = 3, message = "Destination must be a 3-letter airport code")
    @Column(nullable = false)
    private String destination;

    @NotBlank(message = "Destination city is required")
    @Column(nullable = false)
    private String destinationCity;

    @NotNull(message = "Scheduled departure time is required")
    @Column(nullable = false)
    private LocalDateTime scheduledDeparture;

    @NotNull(message = "Scheduled arrival time is required")
    @Column(nullable = false)
    private LocalDateTime scheduledArrival;

    private LocalDateTime actualDeparture;

    private LocalDateTime actualArrival;

    @NotNull(message = "Flight status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FlightStatus status;

    private String gate;

    private String terminal;

    @PositiveOrZero(message = "Delay minutes must be zero or positive")
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
