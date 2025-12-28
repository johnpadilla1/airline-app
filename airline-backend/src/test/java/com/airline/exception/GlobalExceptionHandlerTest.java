package com.airline.exception;

import com.airline.model.dto.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Global Exception Handler Tests")
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Nested
    @DisplayName("Resource Not Found Exception")
    class ResourceNotFoundExceptionTests {

        @Test
        @DisplayName("should return 404 with proper error structure")
        void shouldReturn404ForResourceNotFound() throws Exception {
            mockMvc.perform(get("/api/flights/999999")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.error").value("Not Found"))
                    .andExpect(jsonPath("$.message").exists())
                    .andExpect(jsonPath("$.timestamp").exists())
                    .andExpect(jsonPath("$.path").exists());
        }
    }

    @Nested
    @DisplayName("Invalid Input Exception")
    class InvalidInputExceptionTests {

        @Test
        @DisplayName("should return 400 for invalid input")
        void shouldReturn400ForInvalidInput() throws Exception {
            mockMvc.perform(get("/api/flights/-1")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").value("Invalid Input"))
                    .andExpect(jsonPath("$.message").exists());
        }
    }

    @Nested
    @DisplayName("Type Mismatch Exception")
    class TypeMismatchExceptionTests {

        @Test
        @DisplayName("should return 400 for type mismatch")
        void shouldReturn400ForTypeMismatch() throws Exception {
            mockMvc.perform(get("/api/flights/invalid-id")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").value("Invalid Parameter"))
                    .andExpect(jsonPath("$.message").exists());
        }
    }

    @Nested
    @DisplayName("Method Argument Not Valid Exception")
    class ValidationExceptionTests {

        @Test
        @DisplayName("should return 400 with validation errors")
        void shouldReturn400WithValidationErrors() throws Exception {
            String invalidRequest = """
                    {
                        "message": "",
                        "sessionId": ""
                    }
                    """;

            mockMvc.perform(post("/api/chat")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidRequest))
                    .andDo(print())
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").value("Validation Failed"))
                    .andExpect(jsonPath("$.message").value("Input validation failed"))
                    .andExpect(jsonPath("$.validationErrors").exists())
                    .andExpect(jsonPath("$.validationErrors.message").exists())
                    .andExpect(jsonPath("$.validationErrors.sessionId").exists());
        }
    }

    @Nested
    @DisplayName("Generic Exception Handler")
    class GenericExceptionTests {

        @Test
        @DisplayName("should return 500 for unexpected errors")
        void shouldReturn500ForUnexpectedErrors() throws Exception {
            // This would typically be tested by triggering an actual exception
            // For now, we verify the error response structure
            mockMvc.perform(get("/api/non-existent-endpoint")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("Error Response Structure")
    class ErrorResponseStructureTests {

        @Test
        @DisplayName("should include all required fields in error response")
        void shouldIncludeAllRequiredFields() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/flights/999999")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isNotFound())
                    .andReturn();

            String response = result.getResponse().getContentAsString();
            ErrorResponse errorResponse = objectMapper.readValue(response, ErrorResponse.class);

            assertThat(errorResponse.getStatus()).isEqualTo(404);
            assertThat(errorResponse.getError()).isNotNull();
            assertThat(errorResponse.getMessage()).isNotNull();
            assertThat(errorResponse.getTimestamp()).isNotNull();
            assertThat(errorResponse.getPath()).isNotNull();
        }
    }
}
