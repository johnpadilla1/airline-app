package com.airline.controller;

import com.airline.model.dto.FlightDTO;
import com.airline.model.dto.FlightEventDTO;
import com.airline.model.enums.FlightStatus;
import com.airline.service.FlightService;
import com.airline.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/flights")
@RequiredArgsConstructor
@Slf4j
public class FlightController {

    private final FlightService flightService;
    private final SseEmitterService sseEmitterService;

    /**
     * Get all flights
     */
    @GetMapping
    public ResponseEntity<List<FlightDTO>> getAllFlights() {
        log.debug("GET /api/flights - Fetching all flights");
        List<FlightDTO> flights = flightService.getAllFlights();
        return ResponseEntity.ok(flights);
    }

    /**
     * Get flight by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<FlightDTO> getFlightById(@PathVariable Long id) {
        log.debug("GET /api/flights/{} - Fetching flight by ID", id);
        return flightService.getFlightById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get flight by flight number
     */
    @GetMapping("/number/{flightNumber}")
    public ResponseEntity<FlightDTO> getFlightByNumber(@PathVariable String flightNumber) {
        log.debug("GET /api/flights/number/{} - Fetching flight by number", flightNumber);
        return flightService.getFlightByNumber(flightNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get flights by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<FlightDTO>> getFlightsByStatus(@PathVariable FlightStatus status) {
        log.debug("GET /api/flights/status/{} - Fetching flights by status", status);
        List<FlightDTO> flights = flightService.getFlightsByStatus(status);
        return ResponseEntity.ok(flights);
    }

    /**
     * Get flights by airline
     */
    @GetMapping("/airline/{airline}")
    public ResponseEntity<List<FlightDTO>> getFlightsByAirline(@PathVariable String airline) {
        log.debug("GET /api/flights/airline/{} - Fetching flights by airline", airline);
        List<FlightDTO> flights = flightService.getFlightsByAirline(airline);
        return ResponseEntity.ok(flights);
    }

    /**
     * Get event history for a specific flight
     */
    @GetMapping("/{flightNumber}/events")
    public ResponseEntity<List<FlightEventDTO>> getFlightEvents(@PathVariable String flightNumber) {
        log.debug("GET /api/flights/{}/events - Fetching events for flight", flightNumber);
        List<FlightEventDTO> events = flightService.getFlightEvents(flightNumber);
        return ResponseEntity.ok(events);
    }

    /**
     * Get recent events across all flights
     */
    @GetMapping("/events/recent")
    public ResponseEntity<List<FlightEventDTO>> getRecentEvents() {
        log.debug("GET /api/flights/events/recent - Fetching recent events");
        List<FlightEventDTO> events = flightService.getRecentEvents();
        return ResponseEntity.ok(events);
    }

    /**
     * SSE endpoint for real-time flight updates
     */
    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamFlightUpdates() {
        log.info("GET /api/flights/stream - New SSE client connecting");
        return sseEmitterService.createEmitter();
    }

    /**
     * Get SSE connection stats
     */
    @GetMapping("/stream/stats")
    public ResponseEntity<Map<String, Object>> getStreamStats() {
        return ResponseEntity.ok(Map.of(
                "connectedClients", sseEmitterService.getClientCount(),
                "status", "active"
        ));
    }
}
