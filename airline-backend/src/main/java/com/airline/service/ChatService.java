package com.airline.service;

import com.airline.model.dto.ChatMessage;
import com.airline.model.dto.ChatResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatClient chatClient;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Store chat history per session (last 6 messages)
    private final ConcurrentHashMap<String, java.util.Deque<ChatMessage>> sessionHistory = new ConcurrentHashMap<>();
    private static final int MAX_HISTORY_SIZE = 6;
    
    // Pattern to extract SQL from response
    private static final Pattern SQL_PATTERN = Pattern.compile("SQL:\\s*(.+?)(?:\\n|$)", Pattern.CASE_INSENSITIVE);
    
    // Forbidden SQL keywords for safety
    private static final List<String> FORBIDDEN_KEYWORDS = List.of(
            "INSERT", "UPDATE", "DELETE", "DROP", "TRUNCATE", "ALTER", 
            "CREATE", "GRANT", "REVOKE", "EXEC", "EXECUTE", "MERGE"
    );

    public ChatResponse chat(String sessionId, String userMessage) {
        try {
            // Add user message to history
            addToHistory(sessionId, ChatMessage.userMessage(userMessage));
            
            // Call LLM with conversation context
            String llmResponse = chatClient.prompt()
                    .user(userMessage)
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, sessionId))
                    .call()
                    .content();
            
            log.debug("LLM Response: {}", llmResponse);
            
            // Extract SQL if present
            String extractedSql = extractSql(llmResponse);
            List<Map<String, Object>> queryResults = null;
            String finalAnswer;
            
            if (extractedSql != null && !extractedSql.isEmpty()) {
                // Validate SQL is safe (SELECT only)
                if (!isValidSelectQuery(extractedSql)) {
                    return ChatResponse.builder()
                            .success(false)
                            .error("Only SELECT queries are allowed for security reasons.")
                            .build();
                }
                
                try {
                    // Execute the SQL query
                    queryResults = executeQuery(extractedSql);
                    log.info("Query executed successfully, returned {} rows", queryResults.size());
                    
                    // Pass results back to LLM for natural language answer
                    finalAnswer = generateAnswerFromResults(sessionId, userMessage, extractedSql, queryResults);
                    
                } catch (Exception e) {
                    log.error("SQL execution error: {}", e.getMessage());
                    finalAnswer = "I generated a query but encountered an error executing it: " + e.getMessage() + 
                                  "\n\nPlease try rephrasing your question.";
                }
            } else {
                // No SQL needed, use LLM response directly
                finalAnswer = llmResponse;
            }
            
            // Add assistant response to history
            addToHistory(sessionId, ChatMessage.assistantMessage(finalAnswer));
            
            return ChatResponse.builder()
                    .success(true)
                    .answer(finalAnswer)
                    .generatedSql(extractedSql)
                    .queryResults(queryResults)
                    .build();
                    
        } catch (Exception e) {
            log.error("Chat error: ", e);
            return ChatResponse.builder()
                    .success(false)
                    .error("An error occurred processing your request: " + e.getMessage())
                    .build();
        }
    }
    
    /**
     * Streaming chat method - executes SQL first, then streams only the final answer
     */
    public Flux<String> chatStream(String sessionId, String userMessage) {
        return Flux.defer(() -> {
            try {
                // Add user message to history
                addToHistory(sessionId, ChatMessage.userMessage(userMessage));
                
                // First, call LLM synchronously to get the SQL query
                String llmResponse = chatClient.prompt()
                        .user(userMessage)
                        .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, sessionId))
                        .call()
                        .content();
                
                log.debug("LLM Response: {}", llmResponse);
                
                // Extract SQL if present
                String extractedSql = extractSql(llmResponse);
                
                if (extractedSql != null && !extractedSql.isEmpty()) {
                    // Validate SQL is safe
                    if (!isValidSelectQuery(extractedSql)) {
                        String error = "Only SELECT queries are allowed for security reasons.";
                        return Flux.just(escapeForSse(error), "[DONE]");
                    }
                    
                    try {
                        // Execute the SQL query
                        List<Map<String, Object>> results = executeQuery(extractedSql);
                        log.info("Query executed, {} rows returned", results.size());
                        
                        // Build context for streaming answer
                        String context = buildAnswerContext(userMessage, extractedSql, results);
                        
                        // Stream the final answer
                        AtomicReference<StringBuilder> fullAnswer = new AtomicReference<>(new StringBuilder());
                        
                        return chatClient.prompt()
                                .user(context)
                                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, sessionId + "-answer"))
                                .stream()
                                .content()
                                .map(token -> {
                                    fullAnswer.get().append(token);
                                    // Escape newlines so they don't break SSE format
                                    return escapeForSse(token);
                                })
                                .concatWith(Mono.defer(() -> {
                                    // Save the complete answer to history
                                    addToHistory(sessionId, ChatMessage.assistantMessage(fullAnswer.get().toString()));
                                    return Mono.just("[DONE]");
                                }))
                                .onErrorResume(e -> {
                                    log.error("Streaming error: ", e);
                                    return Flux.just("Error: " + e.getMessage(), "[DONE]");
                                });
                                
                    } catch (Exception e) {
                        log.error("SQL execution error: {}", e.getMessage());
                        String errorMsg = "I tried to query the database but got an error: " + e.getMessage() + "\n\nPlease try rephrasing your question.";
                        addToHistory(sessionId, ChatMessage.assistantMessage(errorMsg));
                        return Flux.just(escapeForSse(errorMsg), "[DONE]");
                    }
                } else {
                    // No SQL needed - return the direct response (escaped for SSE)
                    addToHistory(sessionId, ChatMessage.assistantMessage(llmResponse));
                    return Flux.just(escapeForSse(llmResponse), "[DONE]");
                }
                
            } catch (Exception e) {
                log.error("Chat stream error: ", e);
                return Flux.just(escapeForSse("Error: " + e.getMessage()), "[DONE]");
            }
        });
    }
    
    private String buildAnswerContext(String question, String sql, List<Map<String, Object>> results) {
        StringBuilder context = new StringBuilder();
        context.append("You are a helpful flight assistant. Based on the database query results below, provide a complete, natural language answer to the user's question.\n\n");
        context.append("User's question: ").append(question).append("\n\n");
        context.append("SQL query executed: ").append(sql).append("\n\n");
        context.append("Query results (").append(results.size()).append(" rows):\n");
        
        int maxRows = Math.min(results.size(), 20);
        for (int i = 0; i < maxRows; i++) {
            context.append("- ").append(results.get(i).toString()).append("\n");
        }
        if (results.size() > maxRows) {
            context.append("... and ").append(results.size() - maxRows).append(" more rows\n");
        }
        
        context.append("\nInstructions:\n");
        context.append("1. Provide a complete, helpful answer based on the results\n");
        context.append("2. Include specific numbers, flight details, or counts from the results\n");
        context.append("3. Do NOT include any SQL in your response\n");
        context.append("4. Be conversational and friendly\n");
        context.append("5. If the results show a count, state the count clearly (e.g., 'There are X delayed flights')\n");
        return context.toString();
    }
    
    /**
     * Escape characters that would break SSE format.
     * Newlines need to be escaped because SSE uses \n\n as event delimiter.
     */
    private String escapeForSse(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r");
    }
    
    private String escapeJson(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }
    
    private String extractSql(String response) {
        Matcher matcher = SQL_PATTERN.matcher(response);
        if (matcher.find()) {
            String sql = matcher.group(1).trim();
            // Remove trailing semicolon if present
            if (sql.endsWith(";")) {
                sql = sql.substring(0, sql.length() - 1);
            }
            return sql;
        }
        return null;
    }
    
    private boolean isValidSelectQuery(String sql) {
        String upperSql = sql.toUpperCase().trim();
        
        // Must start with SELECT
        if (!upperSql.startsWith("SELECT")) {
            return false;
        }
        
        // Check for forbidden keywords
        for (String forbidden : FORBIDDEN_KEYWORDS) {
            if (upperSql.contains(forbidden)) {
                log.warn("Forbidden keyword detected: {}", forbidden);
                return false;
            }
        }
        
        // Check for suspicious patterns (multiple statements)
        if (sql.contains(";")) {
            return false;
        }
        
        return true;
    }
    
    private List<Map<String, Object>> executeQuery(String sql) {
        log.info("Executing SQL: {}", sql);
        return jdbcTemplate.queryForList(sql);
    }
    
    private String generateAnswerFromResults(String sessionId, String originalQuestion, 
                                              String sql, List<Map<String, Object>> results) {
        // Build context with results for LLM
        StringBuilder context = new StringBuilder();
        context.append("Based on the database query results, please provide a natural language answer.\n\n");
        context.append("Original question: ").append(originalQuestion).append("\n");
        context.append("SQL executed: ").append(sql).append("\n");
        context.append("Results (").append(results.size()).append(" rows):\n");
        
        // Limit results shown to LLM
        int maxRows = Math.min(results.size(), 20);
        for (int i = 0; i < maxRows; i++) {
            context.append(results.get(i).toString()).append("\n");
        }
        if (results.size() > maxRows) {
            context.append("... and ").append(results.size() - maxRows).append(" more rows\n");
        }
        
        context.append("\nPlease provide a clear, concise answer to the user's question based on these results. ");
        context.append("Do not include 'SQL:' in your response - just give the natural language answer.");
        
        // Call LLM again to generate human-friendly response
        return chatClient.prompt()
                .user(context.toString())
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, sessionId + "-answer"))
                .call()
                .content();
    }
    
    private void addToHistory(String sessionId, ChatMessage message) {
        sessionHistory.computeIfAbsent(sessionId, k -> new java.util.concurrent.LinkedBlockingDeque<>());
        java.util.Deque<ChatMessage> history = sessionHistory.get(sessionId);
        
        history.addLast(message);
        
        // Keep only last N messages
        while (history.size() > MAX_HISTORY_SIZE) {
            history.removeFirst();
        }
    }
    
    public List<ChatMessage> getHistory(String sessionId) {
        java.util.Deque<ChatMessage> history = sessionHistory.get(sessionId);
        if (history == null) {
            return List.of();
        }
        return List.copyOf(history);
    }
    
    public void clearHistory(String sessionId) {
        sessionHistory.remove(sessionId);
    }
}
