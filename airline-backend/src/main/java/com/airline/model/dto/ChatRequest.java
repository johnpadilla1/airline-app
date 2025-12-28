package com.airline.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {

    @NotNull(message = "Message is required")
    @NotBlank(message = "Message cannot be blank")
    @Size(min = 1, max = 2000, message = "Message must be between 1 and 2000 characters")
    private String message;

    @NotNull(message = "Session ID is required")
    @NotBlank(message = "Session ID cannot be blank")
    @Size(min = 1, max = 100, message = "Session ID must be between 1 and 100 characters")
    private String sessionId;
}
