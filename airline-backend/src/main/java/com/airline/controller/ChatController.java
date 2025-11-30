package com.airline.controller;

import com.airline.model.dto.ChatMessage;
import com.airline.model.dto.ChatRequest;
import com.airline.model.dto.ChatResponse;
import com.airline.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        log.info("Chat request from session {}: {}", request.getSessionId(), request.getMessage());
        
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ChatResponse.builder()
                            .success(false)
                            .error("Message cannot be empty")
                            .build());
        }
        
        if (request.getSessionId() == null || request.getSessionId().trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ChatResponse.builder()
                            .success(false)
                            .error("Session ID is required")
                            .build());
        }
        
        ChatResponse response = chatService.chat(request.getSessionId(), request.getMessage());
        return ResponseEntity.ok(response);
    }
    
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chatStream(@RequestBody ChatRequest request) {
        log.info("Streaming chat request from session {}: {}", request.getSessionId(), request.getMessage());
        
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return Flux.just("data: {\"error\": \"Message cannot be empty\"}\n\n");
        }
        
        if (request.getSessionId() == null || request.getSessionId().trim().isEmpty()) {
            return Flux.just("data: {\"error\": \"Session ID is required\"}\n\n");
        }
        
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
