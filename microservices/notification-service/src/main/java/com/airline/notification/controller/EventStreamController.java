package com.airline.notification.controller;

import com.airline.notification.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Slf4j
public class EventStreamController {

    private final SseEmitterService sseEmitterService;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamEvents() {
        log.debug("New SSE stream connection request");
        return sseEmitterService.createEmitter();
    }

    @GetMapping("/connections")
    public ResponseEntity<Map<String, Integer>> getConnectionCount() {
        return ResponseEntity.ok(Map.of("connections", sseEmitterService.getConnectionCount()));
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Notification service is healthy");
    }
}
