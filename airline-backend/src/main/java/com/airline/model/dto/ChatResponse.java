package com.airline.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    
    private String answer;
    private String generatedSql;
    private List<Map<String, Object>> queryResults;
    private String error;
    private boolean success;
}
