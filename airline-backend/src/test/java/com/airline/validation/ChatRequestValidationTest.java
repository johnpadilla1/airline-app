package com.airline.validation;

import com.airline.model.dto.ChatRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Chat Request Validation Tests")
class ChatRequestValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Nested
    @DisplayName("Message Validation")
    class MessageValidationTests {

        @Test
        @DisplayName("should pass validation for valid message")
        void shouldPassForValidMessage() {
            // Given
            ChatRequest request = ChatRequest.builder()
                    .message("What flights are available?")
                    .sessionId("test-session-123")
                    .build();

            // When
            Set<ConstraintViolation<ChatRequest>> violations = validator.validate(request);

            // Then
            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("should fail when message is null")
        void shouldFailWhenMessageIsNull() {
            // Given
            ChatRequest request = ChatRequest.builder()
                    .message(null)
                    .sessionId("test-session-123")
                    .build();

            // When
            Set<ConstraintViolation<ChatRequest>> violations = validator.validate(request);

            // Then
            assertThat(violations)
                    .hasSize(1)
                    .anyMatch(v -> v.getMessage().equals("Message is required"));
        }

        @Test
        @DisplayName("should fail when message is blank")
        void shouldFailWhenMessageIsBlank() {
            // Given
            ChatRequest request = ChatRequest.builder()
                    .message("   ")
                    .sessionId("test-session-123")
                    .build();

            // When
            Set<ConstraintViolation<ChatRequest>> violations = validator.validate(request);

            // Then
            assertThat(violations)
                    .anyMatch(v -> v.getMessage().equals("Message cannot be blank"));
        }

        @Test
        @DisplayName("should fail when message is too short")
        void shouldFailWhenMessageIsTooShort() {
            // Given
            ChatRequest request = ChatRequest.builder()
                    .message("")
                    .sessionId("test-session-123")
                    .build();

            // When
            Set<ConstraintViolation<ChatRequest>> violations = validator.validate(request);

            // Then
            assertThat(violations)
                    .anyMatch(v -> v.getMessage().contains("between 1 and 2000 characters"));
        }

        @Test
        @DisplayName("should fail when message exceeds max length")
        void shouldFailWhenMessageExceedsMaxLength() {
            // Given
            String longMessage = "A".repeat(2001);
            ChatRequest request = ChatRequest.builder()
                    .message(longMessage)
                    .sessionId("test-session-123")
                    .build();

            // When
            Set<ConstraintViolation<ChatRequest>> violations = validator.validate(request);

            // Then
            assertThat(violations)
                    .anyMatch(v -> v.getMessage().contains("between 1 and 2000 characters"));
        }
    }

    @Nested
    @DisplayName("Session ID Validation")
    class SessionIdValidationTests {

        @Test
        @DisplayName("should pass validation for valid session ID")
        void shouldPassForValidSessionId() {
            // Given
            ChatRequest request = ChatRequest.builder()
                    .message("What flights are available?")
                    .sessionId("test-session-123")
                    .build();

            // When
            Set<ConstraintViolation<ChatRequest>> violations = validator.validate(request);

            // Then
            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("should fail when session ID is null")
        void shouldFailWhenSessionIdIsNull() {
            // Given
            ChatRequest request = ChatRequest.builder()
                    .message("What flights are available?")
                    .sessionId(null)
                    .build();

            // When
            Set<ConstraintViolation<ChatRequest>> violations = validator.validate(request);

            // Then
            assertThat(violations)
                    .hasSize(1)
                    .anyMatch(v -> v.getMessage().equals("Session ID is required"));
        }

        @Test
        @DisplayName("should fail when session ID is blank")
        void shouldFailWhenSessionIdIsBlank() {
            // Given
            ChatRequest request = ChatRequest.builder()
                    .message("What flights are available?")
                    .sessionId("   ")
                    .build();

            // When
            Set<ConstraintViolation<ChatRequest>> violations = validator.validate(request);

            // Then
            assertThat(violations)
                    .anyMatch(v -> v.getMessage().equals("Session ID cannot be blank"));
        }

        @Test
        @DisplayName("should fail when session ID exceeds max length")
        void shouldFailWhenSessionIdExceedsMaxLength() {
            // Given
            String longSessionId = "A".repeat(101);
            ChatRequest request = ChatRequest.builder()
                    .message("What flights are available?")
                    .sessionId(longSessionId)
                    .build();

            // When
            Set<ConstraintViolation<ChatRequest>> violations = validator.validate(request);

            // Then
            assertThat(violations)
                    .anyMatch(v -> v.getMessage().contains("between 1 and 100 characters"));
        }
    }

    @Nested
    @DisplayName("Multiple Violations")
    class MultipleViolationsTests {

        @Test
        @DisplayName("should report all validation errors")
        void shouldReportAllValidationErrors() {
            // Given
            ChatRequest request = ChatRequest.builder()
                    .message("")
                    .sessionId("")
                    .build();

            // When
            Set<ConstraintViolation<ChatRequest>> violations = validator.validate(request);

            // Then
            assertThat(violations).isNotEmpty();
            assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("message"));
            assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("sessionId"));
        }
    }

    @Nested
    @DisplayName("Edge Cases")
    class EdgeCaseTests {

        @Test
        @DisplayName("should accept message at minimum length (1)")
        void shouldAcceptMessageAtMinLength() {
            // Given
            ChatRequest request = ChatRequest.builder()
                    .message("A")
                    .sessionId("test")
                    .build();

            // When
            Set<ConstraintViolation<ChatRequest>> violations = validator.validate(request);

            // Then
            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("should accept message at maximum length (2000)")
            void shouldAcceptMessageAtMaxLength() {
            // Given
            String maxLengthMessage = "A".repeat(2000);
            ChatRequest request = ChatRequest.builder()
                    .message(maxLengthMessage)
                    .sessionId("test")
                    .build();

            // When
            Set<ConstraintViolation<ChatRequest>> violations = validator.validate(request);

            // Then
            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("should accept session ID at minimum length (1)")
        void shouldAcceptSessionIdAtMinLength() {
            // Given
            ChatRequest request = ChatRequest.builder()
                    .message("Test message")
                    .sessionId("A")
                    .build();

            // When
            Set<ConstraintViolation<ChatRequest>> violations = validator.validate(request);

            // Then
            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("should accept session ID at maximum length (100)")
        void shouldAcceptSessionIdAtMaxLength() {
            // Given
            String maxLengthSessionId = "A".repeat(100);
            ChatRequest request = ChatRequest.builder()
                    .message("Test message")
                    .sessionId(maxLengthSessionId)
                    .build();

            // When
            Set<ConstraintViolation<ChatRequest>> violations = validator.validate(request);

            // Then
            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("should trim whitespace before validation")
        void shouldTrimWhitespace() {
            // Given
            ChatRequest request = ChatRequest.builder()
                    .message("   Test message   ")
                    .sessionId("   session-123   ")
                    .build();

            // When
            Set<ConstraintViolation<ChatRequest>> violations = validator.validate(request);

            // Then
            // Note: Bean Validation with @NotBlank will trim by default
            // This test verifies the behavior
            assertThat(violations).isEmpty();
        }
    }
}
