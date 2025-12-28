package com.airline.controller;

import com.airline.model.dto.FlightDTO;
import com.airline.model.enums.FlightStatus;
import com.airline.service.FlightService;
import com.airline.service.SseEmitterService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FlightController.class)
@DisplayName("Flight Controller Web Layer Tests")
class FlightControllerWebTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FlightService flightService;

    @MockBean
    private SseEmitterService sseEmitterService;

    private FlightDTO sampleFlight;

    @BeforeEach
    void setUp() {
        sampleFlight = FlightDTO.builder()
                .id(1L)
                .flightNumber("AA123")
                .airline("AA")
                .airlineName("American Airlines")
                .origin("JFK")
                .originCity("New York")
                .destination("LAX")
                .destinationCity("Los Angeles")
                .scheduledDeparture(LocalDateTime.now().plusHours(2))
                .scheduledArrival(LocalDateTime.now().plusHours(6))
                .status(FlightStatus.ON_TIME)
                .gate("A1")
                .terminal("1")
                .delayMinutes(0)
                .aircraft("Boeing 737")
                .build();
    }

    @Nested
    @DisplayName("GET /api/flights")
    class GetAllFlightsTests {

        @Test
        @DisplayName("should return 200 with flights list")
        void shouldReturn200WithFlights() throws Exception {
            when(flightService.getAllFlights()).thenReturn(List.of(sampleFlight));

            mockMvc.perform(get("/api/flights")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].flightNumber").value("AA123"));
        }

        @Test
        @DisplayName("should return 200 with empty list when no flights")
        void shouldReturn200WithEmptyList() throws Exception {
            when(flightService.getAllFlights()).thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/flights")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$", hasSize(0)));
        }
    }

    @Nested
    @DisplayName("GET /api/flights/{id}")
    class GetFlightByIdTests {

        @Test
        @DisplayName("should return 200 with flight when found")
        void shouldReturn200WhenFound() throws Exception {
            when(flightService.getFlightById(1L)).thenReturn(java.util.Optional.of(sampleFlight));

            mockMvc.perform(get("/api/flights/1")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.flightNumber").value("AA123"));
        }

        @Test
        @DisplayName("should return 404 when not found")
        void shouldReturn404WhenNotFound() throws Exception {
            when(flightService.getFlightById(999L)).thenReturn(java.util.Optional.empty());

            mockMvc.perform(get("/api/flights/999")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/flights/status/{status}")
    class GetFlightsByStatusTests {

        @Test
        @DisplayName("should return flights with specified status")
        void shouldReturnFlightsWithStatus() throws Exception {
            when(flightService.getFlightsByStatus(FlightStatus.ON_TIME))
                    .thenReturn(List.of(sampleFlight));

            mockMvc.perform(get("/api/flights/status/ON_TIME")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("ON_TIME"));
        }
    }

    @Nested
    @DisplayName("GET /api/flights/airline/{airline}")
    class GetFlightsByAirlineTests {

        @Test
        @DisplayName("should return flights for specified airline")
        void shouldReturnFlightsForAirline() throws Exception {
            when(flightService.getFlightsByAirline("AA")).thenReturn(List.of(sampleFlight));

            mockMvc.perform(get("/api/flights/airline/AA")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].airline").value("AA"));
        }
    }
}
