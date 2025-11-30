package com.airline.chat.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatClient chatClient;
    private final JdbcTemplate jdbcTemplate;

    private static final Pattern SQL_PATTERN = Pattern.compile("SQL:\\s*(.+?)(?:;|$)", Pattern.DOTALL | Pattern.CASE_INSENSITIVE);

    public String chat(String userMessage) {
        log.debug("Processing chat message: {}", userMessage);

        // Step 1: Ask LLM to generate SQL
        String sqlResponse = chatClient.prompt()
                .user(userMessage)
                .call()
                .content();

        log.debug("LLM SQL response: {}", sqlResponse);

        // Step 2: Extract and execute SQL
        String sql = extractSql(sqlResponse);
        List<Map<String, Object>> results = null;

        if (sql != null) {
            try {
                log.debug("Executing SQL: {}", sql);
                results = jdbcTemplate.queryForList(sql);
                log.debug("SQL results: {}", results);
            } catch (Exception e) {
                log.error("SQL execution error: {}", e.getMessage());
                return "I encountered an error querying the flight data. Please try rephrasing your question.";
            }
        }

        // Step 3: Generate human-friendly response
        String answerPrompt = buildAnswerContext(userMessage, sql, results);
        
        return chatClient.prompt()
                .user(answerPrompt)
                .call()
                .content();
    }

    public Flux<String> chatStream(String userMessage) {
        log.debug("Processing streaming chat message: {}", userMessage);

        // Step 1: Ask LLM to generate SQL (non-streaming)
        String sqlResponse = chatClient.prompt()
                .user(userMessage)
                .call()
                .content();

        log.debug("LLM SQL response: {}", sqlResponse);

        // Step 2: Extract and execute SQL
        String sql = extractSql(sqlResponse);
        List<Map<String, Object>> results = null;

        if (sql != null) {
            try {
                log.debug("Executing SQL: {}", sql);
                results = jdbcTemplate.queryForList(sql);
                log.debug("SQL results: {}", results);
            } catch (Exception e) {
                log.error("SQL execution error: {}", e.getMessage());
                return Flux.just("I encountered an error querying the flight data. Please try rephrasing your question.");
            }
        }

        // Step 3: Stream the human-friendly response
        String answerPrompt = buildAnswerContext(userMessage, sql, results);

        return chatClient.prompt()
                .user(answerPrompt)
                .stream()
                .content()
                .map(this::escapeForSse);
    }

    private String extractSql(String response) {
        if (response == null) return null;

        Matcher matcher = SQL_PATTERN.matcher(response);
        if (matcher.find()) {
            String sql = matcher.group(1).trim();
            // Remove markdown code blocks if present
            sql = sql.replaceAll("```sql\\s*", "").replaceAll("```\\s*", "").trim();
            // Remove trailing semicolons for safety
            if (sql.endsWith(";")) {
                sql = sql.substring(0, sql.length() - 1);
            }
            return sql;
        }
        return null;
    }

    private String buildAnswerContext(String userMessage, String sql, List<Map<String, Object>> results) {
        StringBuilder context = new StringBuilder();
        context.append("The user asked: \"").append(userMessage).append("\"\n\n");

        if (sql != null) {
            context.append("I executed this SQL query: ").append(sql).append("\n\n");
        }

        if (results != null && !results.isEmpty()) {
            context.append("Query results:\n");
            for (Map<String, Object> row : results) {
                context.append(row.toString()).append("\n");
            }
            context.append("\n");
        } else if (results != null) {
            context.append("The query returned no results.\n\n");
        }

        context.append("IMPORTANT FORMATTING RULES:\n");
        context.append("1. When showing multiple items, ALWAYS use a proper markdown table with this EXACT format:\n");
        context.append("   | Column1 | Column2 | Column3 |\n");
        context.append("   |---------|---------|--------|\n");
        context.append("   | value1  | value2  | value3 |\n\n");
        context.append("2. Use simple, short column headers (e.g., 'Flight', 'From', 'To', 'Status', 'Delay', 'Gate')\n");
        context.append("3. Keep values concise - use airport codes (JFK, LAX) not full names\n");
        context.append("4. For status, use: ON_TIME, DELAYED, CANCELLED, BOARDING, etc.\n");
        context.append("5. Be brief and conversational before and after the table\n");
        context.append("6. NEVER use ASCII art tables with dashes and pipes like |---|. Use proper markdown.\n");

        return context.toString();
    }

    private String escapeForSse(String token) {
        if (token == null) return "";
        return token.replace("\n", "\\n").replace("\r", "\\r");
    }
}
