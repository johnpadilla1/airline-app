package com.airline.flight.controller;

import com.airline.model.dto.FlightDTO;
import com.airline.model.dto.FlightEventDTO;
import com.airline.model.entity.FlightEvent;
import com.airline.model.enums.FlightStatus;
import com.airline.flight.service.FlightService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flights")
@RequiredArgsConstructor
@Slf4j
public class FlightController {

    private final FlightService flightService;

    @GetMapping
    public ResponseEntity<List<FlightDTO>> getAllFlights() {
        log.debug("GET /api/flights - Fetching all flights");
        return ResponseEntity.ok(flightService.getAllFlights());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlightDTO> getFlightById(@PathVariable Long id) {
        log.debug("GET /api/flights/{} - Fetching flight by ID", id);
        return flightService.getFlightById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/number/{flightNumber}")
    public ResponseEntity<FlightDTO> getFlightByNumber(@PathVariable String flightNumber) {
        log.debug("GET /api/flights/number/{} - Fetching flight by number", flightNumber);
        return flightService.getFlightByNumber(flightNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<FlightDTO>> getFlightsByStatus(@PathVariable FlightStatus status) {
        log.debug("GET /api/flights/status/{} - Fetching flights by status", status);
        return ResponseEntity.ok(flightService.getFlightsByStatus(status));
    }

    @GetMapping("/random")
    public ResponseEntity<FlightDTO> getRandomFlight() {
        log.debug("GET /api/flights/random - Fetching random flight");
        return ResponseEntity.ok(flightService.getRandomFlight());
    }

    @PutMapping("/{id}")
    public ResponseEntity<FlightDTO> updateFlight(@PathVariable Long id, @RequestBody FlightDTO updates) {
        log.debug("PUT /api/flights/{} - Updating flight", id);
        return ResponseEntity.ok(flightService.updateFlight(id, updates));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<FlightDTO> updateFlightStatus(@PathVariable Long id, @RequestParam FlightStatus status) {
        log.debug("PUT /api/flights/{}/status - Updating flight status to {}", id, status);
        return ResponseEntity.ok(flightService.updateFlightStatus(id, status));
    }

    @PutMapping("/{id}/gate")
    public ResponseEntity<FlightDTO> updateFlightGate(@PathVariable Long id, @RequestParam String gate) {
        log.debug("PUT /api/flights/{}/gate - Updating flight gate to {}", id, gate);
        return ResponseEntity.ok(flightService.updateFlightGate(id, gate));
    }

    @PutMapping("/{id}/delay")
    public ResponseEntity<FlightDTO> updateFlightDelay(@PathVariable Long id, @RequestParam int minutes) {
        log.debug("PUT /api/flights/{}/delay - Updating flight delay to {} minutes", id, minutes);
        return ResponseEntity.ok(flightService.updateFlightDelay(id, minutes));
    }

    @PostMapping("/events")
    public ResponseEntity<FlightEvent> saveFlightEvent(@RequestBody FlightEvent event) {
        log.debug("POST /api/flights/events - Saving flight event for flight {}", event.getFlightNumber());
        return ResponseEntity.ok(flightService.saveFlightEvent(event));
    }

    @GetMapping("/events/recent")
    public ResponseEntity<List<FlightEventDTO>> getRecentEvents() {
        log.debug("GET /api/flights/events/recent - Fetching recent events");
        return ResponseEntity.ok(flightService.getRecentEvents());
    }

    @GetMapping("/{id}/events")
    public ResponseEntity<List<FlightEventDTO>> getFlightEvents(@PathVariable Long id) {
        log.debug("GET /api/flights/{}/events - Fetching events for flight", id);
        return ResponseEntity.ok(flightService.getFlightEvents(id));
    }
}
