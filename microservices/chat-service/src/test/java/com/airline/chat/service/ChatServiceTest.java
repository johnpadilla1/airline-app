package com.airline.chat.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.jdbc.core.JdbcTemplate;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatService Unit Tests (Microservices)")
class ChatServiceTest {

    @Mock
    private ChatClient chatClient;

    @Mock
    private ChatClient.ChatClientRequestSpec requestSpec;

    @Mock
    private ChatClient.CallResponseSpec callResponseSpec;

    @Mock
    private JdbcTemplate jdbcTemplate;

    private ChatService chatService;

    @BeforeEach
    void setUp() {
        chatService = new ChatService(chatClient, jdbcTemplate);
    }

    @Nested
    @DisplayName("SQL Extraction")
    class SqlExtractionTests {

        @Test
        @DisplayName("should extract SQL from response with SQL: prefix")
        void extractSql_ShouldParseCorrectly() throws Exception {
            // Given
            String response = "I'll query the database. SQL: SELECT * FROM flights WHERE status = 'DELAYED';";
            Method method = ChatService.class.getDeclaredMethod("extractSql", String.class);
            method.setAccessible(true);

            // When
            String result = (String) method.invoke(chatService, response);

            // Then
            assertThat(result).isEqualTo("SELECT * FROM flights WHERE status = 'DELAYED'");
        }

        @Test
        @DisplayName("should return null when no SQL in response")
        void extractSql_ShouldReturnNull_WhenNoSql() throws Exception {
            // Given
            String response = "I don't need to query for that information.";
            Method method = ChatService.class.getDeclaredMethod("extractSql", String.class);
            method.setAccessible(true);

            // When
            String result = (String) method.invoke(chatService, response);

            // Then
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("should return null for null input")
        void extractSql_ShouldReturnNull_ForNullInput() throws Exception {
            // Given
            Method method = ChatService.class.getDeclaredMethod("extractSql", String.class);
            method.setAccessible(true);

            // When
            String result = (String) method.invoke(chatService, (Object) null);

            // Then
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("should remove markdown code blocks from SQL")
        void extractSql_ShouldRemoveMarkdownCodeBlocks() throws Exception {
            // Given
            String response = "SQL: ```sql SELECT * FROM flights```";
            Method method = ChatService.class.getDeclaredMethod("extractSql", String.class);
            method.setAccessible(true);

            // When
            String result = (String) method.invoke(chatService, response);

            // Then
            assertThat(result).isEqualTo("SELECT * FROM flights");
        }
    }

    @Nested
    @DisplayName("SSE Escape")
    class SseEscapeTests {

        @Test
        @DisplayName("should escape newlines for SSE format")
        void escapeForSse_ShouldEscapeNewlines() throws Exception {
            // Given
            String text = "Line 1\nLine 2\rLine 3";
            Method method = ChatService.class.getDeclaredMethod("escapeForSse", String.class);
            method.setAccessible(true);

            // When
            String result = (String) method.invoke(chatService, text);

            // Then
            assertThat(result).isEqualTo("Line 1\\nLine 2\\rLine 3");
        }

        @Test
        @DisplayName("should handle null input")
        void escapeForSse_ShouldHandleNull() throws Exception {
            // Given
            Method method = ChatService.class.getDeclaredMethod("escapeForSse", String.class);
            method.setAccessible(true);

            // When
            String result = (String) method.invoke(chatService, (Object) null);

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Answer Context Building")
    class AnswerContextTests {

        @Test
        @DisplayName("should build context with user message")
        void buildAnswerContext_ShouldIncludeUserMessage() throws Exception {
            // Given
            String userMessage = "How many flights are delayed?";
            String sql = "SELECT COUNT(*) FROM flights WHERE status = 'DELAYED'";
            Map<String, Object> row = new HashMap<>();
            row.put("count", 5);
            List<Map<String, Object>> results = Arrays.asList(row);

            Method method = ChatService.class.getDeclaredMethod("buildAnswerContext", 
                    String.class, String.class, List.class);
            method.setAccessible(true);

            // When
            String result = (String) method.invoke(chatService, userMessage, sql, results);

            // Then
            assertThat(result).contains("How many flights are delayed?");
            assertThat(result).contains("SELECT COUNT(*)");
        }

        @Test
        @DisplayName("should handle null SQL")
        void buildAnswerContext_ShouldHandleNullSql() throws Exception {
            // Given
            String userMessage = "What's the weather?";

            Method method = ChatService.class.getDeclaredMethod("buildAnswerContext", 
                    String.class, String.class, List.class);
            method.setAccessible(true);

            // When
            String result = (String) method.invoke(chatService, userMessage, null, null);

            // Then
            assertThat(result).contains("What's the weather?");
        }

        @Test
        @DisplayName("should indicate no results for empty result set")
        void buildAnswerContext_ShouldIndicateNoResults() throws Exception {
            // Given
            String userMessage = "Show cancelled flights";
            String sql = "SELECT * FROM flights WHERE status = 'CANCELLED'";
            List<Map<String, Object>> results = Arrays.asList();

            Method method = ChatService.class.getDeclaredMethod("buildAnswerContext", 
                    String.class, String.class, List.class);
            method.setAccessible(true);

            // When
            String result = (String) method.invoke(chatService, userMessage, sql, results);

            // Then
            assertThat(result).contains("no results");
        }
    }

    @Nested
    @DisplayName("Chat Method")
    class ChatMethodTests {

        @Test
        @DisplayName("should return error message on SQL execution failure")
        void chat_WithSqlError_ShouldReturnErrorMessage() {
            // Given
            when(chatClient.prompt()).thenReturn(requestSpec);
            when(requestSpec.user(anyString())).thenReturn(requestSpec);
            when(requestSpec.call()).thenReturn(callResponseSpec);
            when(callResponseSpec.content()).thenReturn("SQL: SELECT * FROM nonexistent_table");
            when(jdbcTemplate.queryForList(anyString())).thenThrow(new RuntimeException("Table not found"));

            // When
            String result = chatService.chat("Show me the data");

            // Then
            assertThat(result).contains("error");
            assertThat(result).contains("rephrasing");
        }
    }
}
