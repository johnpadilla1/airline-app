package com.airline.service;

import com.airline.model.dto.FlightEventDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
public class SseEmitterService {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final ObjectMapper objectMapper;

    /**
     * Creates a new SSE emitter for a client connection
     * Timeout set to 30 minutes (1800000 ms) to match the refresh interval
     */
    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(1800000L); // 30 minutes timeout

        emitter.onCompletion(() -> {
            log.debug("SSE connection completed");
            emitters.remove(emitter);
        });

        emitter.onTimeout(() -> {
            log.debug("SSE connection timed out");
            emitter.complete();
            emitters.remove(emitter);
        });

        emitter.onError((e) -> {
            log.debug("SSE connection error: {}", e.getMessage());
            emitters.remove(emitter);
        });

        emitters.add(emitter);
        log.info("New SSE client connected. Total clients: {}", emitters.size());

        // Send initial connection event
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("{\"message\": \"Connected to flight updates stream\"}"));
        } catch (IOException e) {
            log.error("Failed to send initial SSE event: {}", e.getMessage());
        }

        return emitter;
    }

    /**
     * Broadcasts a flight event to all connected SSE clients
     */
    public void broadcast(FlightEventDTO event) {
        if (emitters.isEmpty()) {
            log.debug("No SSE clients connected to broadcast to");
            return;
        }

        log.info("Broadcasting event to {} SSE clients: {} - {}",
                emitters.size(),
                event.getEventType(),
                event.getFlightNumber());

        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                String jsonData = objectMapper.writeValueAsString(event);
                emitter.send(SseEmitter.event()
                        .name("flight-update")
                        .data(jsonData));
            } catch (IOException e) {
                log.debug("Failed to send to SSE client, removing: {}", e.getMessage());
                deadEmitters.add(emitter);
            }
        }

        // Clean up dead emitters
        emitters.removeAll(deadEmitters);

        if (!deadEmitters.isEmpty()) {
            log.info("Removed {} dead SSE connections. Active clients: {}",
                    deadEmitters.size(),
                    emitters.size());
        }
    }

    /**
     * Get the current number of connected clients
     */
    public int getClientCount() {
        return emitters.size();
    }

    /**
     * Send a heartbeat to all clients to keep connections alive
     */
    public void sendHeartbeat() {
        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("heartbeat")
                        .data("{\"timestamp\": \"" + java.time.Instant.now() + "\"}"));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        }

        emitters.removeAll(deadEmitters);
    }
}
