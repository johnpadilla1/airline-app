package com.airline.chat.controller;

import com.airline.chat.service.ChatService;
import com.airline.model.dto.ChatRequest;
import com.airline.model.dto.ChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        log.debug("POST /api/chat - Message: {}", request.getMessage());
        try {
            String response = chatService.chat(request.getMessage());
            return ResponseEntity.ok(ChatResponse.builder()
                    .response(response)
                    .sessionId(request.getSessionId())
                    .success(true)
                    .build());
        } catch (Exception e) {
            log.error("Chat error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ChatResponse.builder()
                    .error(e.getMessage())
                    .sessionId(request.getSessionId())
                    .success(false)
                    .build());
        }
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chatStream(@RequestBody ChatRequest request) {
        log.debug("POST /api/chat/stream - Streaming message: {}", request.getMessage());
        return chatService.chatStream(request.getMessage());
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Chat service is healthy");
    }
}
