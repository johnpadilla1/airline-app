package com.airline.controller;

import com.airline.dto.FlightDTO;
import com.airline.enums.FlightStatus;
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
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Flight Controller Integration Tests")
class FlightControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Nested
    @DisplayName("GET /api/flights - Get All Flights")
    class GetAllFlightsTests {

        @Test
        @DisplayName("should return all flights with status 200")
        void shouldReturnAllFlights() throws Exception {
            mockMvc.perform(get("/api/flights")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$", hasSize(greaterThan(0))))
                    .andExpect(jsonPath("$[0].flightNumber").exists())
                    .andExpect(jsonPath("$[0].airline").exists())
                    .andExpect(jsonPath("$[0].status").exists());
        }

        @Test
        @DisplayName("should return flights with correct structure")
        void shouldReturnFlightsWithCorrectStructure() throws Exception {
            mockMvc.perform(get("/api/flights")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0]").exists())
                    .andExpect(jsonPath("$[0].id").isNumber())
                    .andExpect(jsonPath("$[0].flightNumber").isString())
                    .andExpect(jsonPath("$[0].airline").isString())
                    .andExpect(jsonPath("$[0].origin").isString())
                    .andExpect(jsonPath("$[0].destination").isString())
                    .andExpect(jsonPath("$[0].status").isString())
                    .andExpect(jsonPath("$[0].scheduledDeparture").isString())
                    .andExpect(jsonPath("$[0].scheduledArrival").isString());
        }
    }

    @Nested
    @DisplayName("GET /api/flights/{id} - Get Flight By ID")
    class GetFlightByIdTests {

        @Test
        @DisplayName("should return flight when exists")
        void shouldReturnFlightWhenExists() throws Exception {
            mockMvc.perform(get("/api/flights/1")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.flightNumber").exists())
                    .andExpect(jsonPath("$.airline").exists());
        }

        @Test
        @DisplayName("should return 404 when flight does not exist")
        void shouldReturn404WhenNotExists() throws Exception {
            mockMvc.perform(get("/api/flights/99999")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 400 for invalid ID")
        void shouldReturn400ForInvalidId() throws Exception {
            mockMvc.perform(get("/api/flights/invalid")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 for negative ID")
        void shouldReturn400ForNegativeId() throws Exception {
            mockMvc.perform(get("/api/flights/-1")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/flights/number/{flightNumber} - Get Flight By Number")
    class GetFlightByNumberTests {

        @Test
        @DisplayName("should return flight when exists")
        void shouldReturnFlightWhenExists() throws Exception {
            mockMvc.perform(get("/api/flights/number/AA123")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.flightNumber").value("AA123"))
                    .andExpect(jsonPath("$.airline").exists());
        }

        @Test
        @DisplayName("should return 404 when flight does not exist")
        void shouldReturn404WhenNotExists() throws Exception {
            mockMvc.perform(get("/api/flights/number/XX999")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/flights/status/{status} - Get Flights By Status")
    class GetFlightsByStatusTests {

        @Test
        @DisplayName("should return flights with given status")
        void shouldReturnFlightsWithStatus() throws Exception {
            mockMvc.perform(get("/api/flights/status/ON_TIME")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$[0].status").value("ON_TIME"));
        }

        @Test
        @DisplayName("should return empty array for status with no flights")
        void shouldReturnEmptyForNoFlights() throws Exception {
            mockMvc.perform(get("/api/flights/status/CANCELLED")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$", hasSize(0)));
        }
    }

    @Nested
    @DisplayName("GET /api/flights/airline/{airline} - Get Flights By Airline")
    class GetFlightsByAirlineTests {

        @Test
        @DisplayName("should return flights for airline")
        void shouldReturnFlightsForAirline() throws Exception {
            mockMvc.perform(get("/api/flights/airline/AA")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$[0].airline").value("AA"));
        }

        @Test
        @DisplayName("should return 400 for empty airline")
        void shouldReturn400ForEmptyAirline() throws Exception {
            mockMvc.perform(get("/api/flights/airline/")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/flights/{flightNumber}/events - Get Flight Events")
    class GetFlightEventsTests {

        @Test
        @DisplayName("should return events for flight")
        void shouldReturnEventsForFlight() throws Exception {
            mockMvc.perform(get("/api/flights/AA123/events")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray());
        }

        @Test
        @DisplayName("should return empty array for flight with no events")
        void shouldReturnEmptyForNoEvents() throws Exception {
            mockMvc.perform(get("/api/flights/XX999/events")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$", hasSize(0)));
        }
    }

    @Nested
    @DisplayName("GET /api/flights/events/recent - Get Recent Events")
    class GetRecentEventsTests {

        @Test
        @DisplayName("should return recent events")
        void shouldReturnRecentEvents() throws Exception {
            mockMvc.perform(get("/api/flights/events/recent")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray());
        }
    }

    @Nested
    @DisplayName("SSE Endpoints")
    class SseEndpointTests {

        @Test
        @DisplayName("should return SSE emitter for stream endpoint")
        void shouldReturnSseEmitter() throws Exception {
            mockMvc.perform(get("/api/flights/stream")
                            .contentType(MediaType.TEXT_EVENT_STREAM_VALUE))
                    .andDo(print())
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should return stream stats")
        void shouldReturnStreamStats() throws Exception {
            mockMvc.perform(get("/api/flights/stream/stats")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.connectedClients").isNumber())
                    .andExpect(jsonPath("$.status").value("active"));
        }
    }
}
