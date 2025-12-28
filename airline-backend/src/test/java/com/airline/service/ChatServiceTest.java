package com.airline.service;

import com.airline.dto.ChatMessage;
import com.airline.dto.ChatResponse;
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
@DisplayName("ChatService Unit Tests")
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
    @DisplayName("SQL Validation")
    class SqlValidationTests {

        @Test
        @DisplayName("should accept valid SELECT query")
        void isValidSelectQuery_ShouldAcceptValidSelect() throws Exception {
            // Given
            String sql = "SELECT * FROM flights WHERE status = 'ON_TIME'";
            Method method = ChatService.class.getDeclaredMethod("isValidSelectQuery", String.class);
            method.setAccessible(true);

            // When
            boolean result = (boolean) method.invoke(chatService, sql);

            // Then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("should reject query starting with forbidden keyword")
        void isValidSelectQuery_ShouldRejectNonSelect() throws Exception {
            // Given
            String sql = "DELETE FROM flights WHERE id = 1";
            Method method = ChatService.class.getDeclaredMethod("isValidSelectQuery", String.class);
            method.setAccessible(true);

            // When
            boolean result = (boolean) method.invoke(chatService, sql);

            // Then
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("should reject SELECT with forbidden keyword")
        void isValidSelectQuery_ShouldRejectSelectWithForbiddenKeyword() throws Exception {
            // Given
            String sql = "SELECT * FROM flights; DROP TABLE flights";
            Method method = ChatService.class.getDeclaredMethod("isValidSelectQuery", String.class);
            method.setAccessible(true);

            // When
            boolean result = (boolean) method.invoke(chatService, sql);

            // Then
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("should reject query with semicolon (multiple statements)")
        void isValidSelectQuery_ShouldRejectMultipleStatements() throws Exception {
            // Given
            String sql = "SELECT * FROM flights; SELECT * FROM events";
            Method method = ChatService.class.getDeclaredMethod("isValidSelectQuery", String.class);
            method.setAccessible(true);

            // When
            boolean result = (boolean) method.invoke(chatService, sql);

            // Then
            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("SQL Extraction")
    class SqlExtractionTests {

        @Test
        @DisplayName("should extract SQL from LLM response")
        void extractSql_ShouldExtractFromResponse() throws Exception {
            // Given
            String response = "Looking at your question, I'll query the database.\nSQL: SELECT * FROM flights WHERE status = 'DELAYED'\nThis will show all delayed flights.";
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
            String response = "I don't need to query the database to answer that question.";
            Method method = ChatService.class.getDeclaredMethod("extractSql", String.class);
            method.setAccessible(true);

            // When
            String result = (String) method.invoke(chatService, response);

            // Then
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("should remove trailing semicolon from SQL")
        void extractSql_ShouldRemoveTrailingSemicolon() throws Exception {
            // Given
            String response = "SQL: SELECT COUNT(*) FROM flights;";
            Method method = ChatService.class.getDeclaredMethod("extractSql", String.class);
            method.setAccessible(true);

            // When
            String result = (String) method.invoke(chatService, response);

            // Then
            assertThat(result).isEqualTo("SELECT COUNT(*) FROM flights");
        }
    }

    @Nested
    @DisplayName("Session History")
    class SessionHistoryTests {

        @Test
        @DisplayName("should return empty list for unknown session")
        void getHistory_ShouldReturnEmpty_ForUnknownSession() {
            // When
            List<ChatMessage> history = chatService.getHistory("unknown-session");

            // Then
            assertThat(history).isEmpty();
        }

        @Test
        @DisplayName("should clear session history")
        void clearHistory_ShouldRemoveSessionHistory() throws Exception {
            // Given - add some history using reflection
            Method addToHistory = ChatService.class.getDeclaredMethod("addToHistory", String.class, ChatMessage.class);
            addToHistory.setAccessible(true);
            addToHistory.invoke(chatService, "test-session", ChatMessage.userMessage("Hello"));

            assertThat(chatService.getHistory("test-session")).hasSize(1);

            // When
            chatService.clearHistory("test-session");

            // Then
            assertThat(chatService.getHistory("test-session")).isEmpty();
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

        @Test
        @DisplayName("should escape backslashes")
        void escapeForSse_ShouldEscapeBackslashes() throws Exception {
            // Given
            String text = "Path: C:\\Users\\test";
            Method method = ChatService.class.getDeclaredMethod("escapeForSse", String.class);
            method.setAccessible(true);

            // When
            String result = (String) method.invoke(chatService, text);

            // Then
            assertThat(result).isEqualTo("Path: C:\\\\Users\\\\test");
        }
    }

    @Nested
    @DisplayName("JSON Escape")
    class JsonEscapeTests {

        @Test
        @DisplayName("should escape special JSON characters")
        void escapeJson_ShouldEscapeSpecialCharacters() throws Exception {
            // Given
            String text = "Quote: \"test\"\nTab:\there";
            Method method = ChatService.class.getDeclaredMethod("escapeJson", String.class);
            method.setAccessible(true);

            // When
            String result = (String) method.invoke(chatService, text);

            // Then
            assertThat(result).isEqualTo("Quote: \\\"test\\\"\\nTab:\\there");
        }

        @Test
        @DisplayName("should handle null input")
        void escapeJson_ShouldHandleNull() throws Exception {
            // Given
            Method method = ChatService.class.getDeclaredMethod("escapeJson", String.class);
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
        @DisplayName("should build context with query results")
        void buildAnswerContext_ShouldIncludeResults() throws Exception {
            // Given
            String question = "How many delayed flights?";
            String sql = "SELECT COUNT(*) FROM flights WHERE status = 'DELAYED'";
            Map<String, Object> row = new HashMap<>();
            row.put("COUNT", 5L);
            List<Map<String, Object>> results = Arrays.asList(row);

            Method method = ChatService.class.getDeclaredMethod("buildAnswerContext", 
                    String.class, String.class, List.class);
            method.setAccessible(true);

            // When
            String result = (String) method.invoke(chatService, question, sql, results);

            // Then
            assertThat(result).contains("How many delayed flights?");
            assertThat(result).contains("SELECT COUNT(*) FROM flights");
            assertThat(result).contains("1 rows");
        }

        @Test
        @DisplayName("should limit results to 20 rows in context")
        void buildAnswerContext_ShouldLimitRows() throws Exception {
            // Given
            String question = "Show all flights";
            String sql = "SELECT * FROM flights";
            List<Map<String, Object>> results = new java.util.ArrayList<>();
            for (int i = 0; i < 30; i++) {
                Map<String, Object> row = new HashMap<>();
                row.put("id", i);
                results.add(row);
            }

            Method method = ChatService.class.getDeclaredMethod("buildAnswerContext", 
                    String.class, String.class, List.class);
            method.setAccessible(true);

            // When
            String result = (String) method.invoke(chatService, question, sql, results);

            // Then
            assertThat(result).contains("30 rows");
            assertThat(result).contains("and 10 more rows");
        }
    }
}
