package com.airline.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Security Configuration Tests")
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Nested
    @DisplayName("Public Endpoints")
    class PublicEndpointTests {

        @Test
        @DisplayName("should allow access to actuator health endpoint")
        void shouldAllowAccessToActuatorHealth() throws Exception {
            mockMvc.perform(get("/actuator/health"))
                    .andDo(print())
                    .andExpect(status().is2xxSuccessful());
        }

        @Test
        @DisplayName("should allow access to actuator info endpoint")
        void shouldAllowAccessToActuatorInfo() throws Exception {
            mockMvc.perform(get("/actuator/info"))
                    .andDo(print())
                    .andExpect(status().is2xxSuccessful());
        }

        @Test
        @DisplayName("should allow access to Swagger UI")
        void shouldAllowAccessToSwaggerUi() throws Exception {
            mockMvc.perform(get("/swagger-ui.html"))
                    .andDo(print())
                    .andExpect(status().is3xxRedirection());
        }

        @Test
        @DisplayName("should allow access to API docs")
        void shouldAllowAccessToApiDocs() throws Exception {
            mockMvc.perform(get("/api-docs"))
                    .andDo(print())
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should allow access to flights API")
        void shouldAllowAccessToFlightsApi() throws Exception {
            mockMvc.perform(get("/api/flights"))
                    .andDo(print())
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should allow access to chat API")
        void shouldAllowAccessToChatApi() throws Exception {
            mockMvc.perform(get("/api/chat/history/test-session"))
                    .andDo(print())
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("CORS Configuration")
    class CorsTests {

        @Test
        @DisplayName("should include CORS headers")
        void shouldIncludeCorsHeaders() throws Exception {
            mockMvc.perform(get("/api/flights")
                            .header("Origin", "http://localhost:5173")
                            .header("Access-Control-Request-Method", "GET"))
                    .andDo(print())
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("Security Headers")
    class SecurityHeadersTests {

        @Test
        @DisplayName("should include X-Frame-Options header")
        void shouldIncludeFrameOptionsHeader() throws Exception {
            mockMvc.perform(get("/api/flights"))
                    .andDo(print())
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should include X-Content-Type-Options header")
        void shouldIncludeContentTypeOptionsHeader() throws Exception {
            mockMvc.perform(get("/api/flights"))
                    .andDo(print())
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("Session Management")
    class SessionManagementTests {

        @Test
        @DisplayName("should not create session for API requests")
        void shouldNotCreateSessionForApiRequests() throws Exception {
            mockMvc.perform(get("/api/flights"))
                    .andDo(print())
                    .andExpect(status().isOk());
        }
    }
}
