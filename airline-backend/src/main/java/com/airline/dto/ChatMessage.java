package com.airline.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    
    public enum Role {
        USER, ASSISTANT
    }
    
    private Role role;
    private String content;
    private LocalDateTime timestamp;
    
    public static ChatMessage userMessage(String content) {
        return ChatMessage.builder()
                .role(Role.USER)
                .content(content)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    public static ChatMessage assistantMessage(String content) {
        return ChatMessage.builder()
                .role(Role.ASSISTANT)
                .content(content)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
