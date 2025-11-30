package com.airline.notification.service;

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

    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        emitter.onCompletion(() -> {
            log.debug("SSE connection completed");
            emitters.remove(emitter);
        });

        emitter.onTimeout(() -> {
            log.debug("SSE connection timed out");
            emitters.remove(emitter);
        });

        emitter.onError(e -> {
            log.debug("SSE connection error: {}", e.getMessage());
            emitters.remove(emitter);
        });

        emitters.add(emitter);
        log.info("New SSE connection. Total connections: {}", emitters.size());

        return emitter;
    }

    public void broadcastEvent(FlightEventDTO event) {
        if (emitters.isEmpty()) {
            log.debug("No SSE clients connected, skipping broadcast");
            return;
        }

        log.debug("Broadcasting event to {} clients: {}", emitters.size(), event.getEventType());

        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                String jsonEvent = objectMapper.writeValueAsString(event);
                emitter.send(SseEmitter.event()
                        .name("flight-event")
                        .data(jsonEvent));
            } catch (IOException e) {
                log.debug("Failed to send to emitter, marking for removal: {}", e.getMessage());
                deadEmitters.add(emitter);
            }
        }

        emitters.removeAll(deadEmitters);
        
        if (!deadEmitters.isEmpty()) {
            log.debug("Removed {} dead emitters. Active connections: {}", deadEmitters.size(), emitters.size());
        }
    }

    public int getConnectionCount() {
        return emitters.size();
    }
}
