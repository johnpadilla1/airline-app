package com.airline.controller;

import com.airline.dto.ChatMessage;
import com.airline.dto.ChatRequest;
import com.airline.dto.ChatResponse;
import com.airline.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Validated
@Slf4j
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        log.info("Chat request from session {}: {}", request.getSessionId(), request.getMessage());
        ChatResponse response = chatService.chat(request.getSessionId(), request.getMessage());
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chatStream(@Valid @RequestBody ChatRequest request) {
        log.info("Streaming chat request from session {}: {}", request.getSessionId(), request.getMessage());
        return chatService.chatStream(request.getSessionId(), request.getMessage());
    }

    @GetMapping("/history/{sessionId}")
    public ResponseEntity<List<ChatMessage>> getHistory(@PathVariable String sessionId) {
        List<ChatMessage> history = chatService.getHistory(sessionId);
        return ResponseEntity.ok(history);
    }

    @DeleteMapping("/history/{sessionId}")
    public ResponseEntity<Void> clearHistory(@PathVariable String sessionId) {
        chatService.clearHistory(sessionId);
        return ResponseEntity.noContent().build();
    }
}
