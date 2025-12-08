package com.airline.service;

import com.airline.model.dto.FlightDTO;
import com.airline.model.dto.FlightEventDTO;
import com.airline.model.entity.Flight;
import com.airline.model.entity.FlightEvent;
import com.airline.model.enums.FlightEventType;
import com.airline.model.enums.FlightStatus;
import com.airline.repository.FlightEventRepository;
import com.airline.repository.FlightRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FlightService Unit Tests")
class FlightServiceTest {

    @Mock
    private FlightRepository flightRepository;

    @Mock
    private FlightEventRepository flightEventRepository;

    @InjectMocks
    private FlightService flightService;

    private Flight sampleFlight;
    private FlightEvent sampleEvent;

    @BeforeEach
    void setUp() {
        sampleFlight = Flight.builder()
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

        sampleEvent = FlightEvent.builder()
                .id(1L)
                .flightNumber("AA123")
                .eventType(FlightEventType.GATE_CHANGE)
                .previousValue("A1")
                .newValue("B2")
                .description("Gate changed from A1 to B2")
                .eventTimestamp(LocalDateTime.now())
                .processedTimestamp(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("getAllFlights")
    class GetAllFlightsTests {

        @Test
        @DisplayName("should return all flights as DTOs")
        void getAllFlights_ShouldReturnAllFlights() {
            // Given
            Flight flight2 = Flight.builder()
                    .id(2L)
                    .flightNumber("UA456")
                    .airline("UA")
                    .airlineName("United Airlines")
                    .origin("LAX")
                    .originCity("Los Angeles")
                    .destination("ORD")
                    .destinationCity("Chicago")
                    .scheduledDeparture(LocalDateTime.now().plusHours(3))
                    .scheduledArrival(LocalDateTime.now().plusHours(7))
                    .status(FlightStatus.DELAYED)
                    .gate("C3")
                    .terminal("2")
                    .delayMinutes(30)
                    .aircraft("Airbus A320")
                    .build();

            when(flightRepository.findAll()).thenReturn(Arrays.asList(sampleFlight, flight2));

            // When
            List<FlightDTO> result = flightService.getAllFlights();

            // Then
            assertThat(result).hasSize(2);
            assertThat(result.get(0).getFlightNumber()).isEqualTo("AA123");
            assertThat(result.get(1).getFlightNumber()).isEqualTo("UA456");
            verify(flightRepository).findAll();
        }

        @Test
        @DisplayName("should return empty list when no flights exist")
        void getAllFlights_ShouldReturnEmptyList_WhenNoFlights() {
            // Given
            when(flightRepository.findAll()).thenReturn(Collections.emptyList());

            // When
            List<FlightDTO> result = flightService.getAllFlights();

            // Then
            assertThat(result).isEmpty();
            verify(flightRepository).findAll();
        }
    }

    @Nested
    @DisplayName("getFlightById")
    class GetFlightByIdTests {

        @Test
        @DisplayName("should return flight when it exists")
        void getFlightById_ShouldReturnFlight_WhenExists() {
            // Given
            when(flightRepository.findById(1L)).thenReturn(Optional.of(sampleFlight));
            when(flightEventRepository.findByFlightNumberOrderByEventTimestampDesc(anyString()))
                    .thenReturn(Collections.emptyList());

            // When
            Optional<FlightDTO> result = flightService.getFlightById(1L);

            // Then
            assertThat(result).isPresent();
            assertThat(result.get().getFlightNumber()).isEqualTo("AA123");
            assertThat(result.get().getAirline()).isEqualTo("AA");
            verify(flightRepository).findById(1L);
        }

        @Test
        @DisplayName("should return empty when flight does not exist")
        void getFlightById_ShouldReturnEmpty_WhenNotExists() {
            // Given
            when(flightRepository.findById(999L)).thenReturn(Optional.empty());

            // When
            Optional<FlightDTO> result = flightService.getFlightById(999L);

            // Then
            assertThat(result).isEmpty();
            verify(flightRepository).findById(999L);
        }
    }

    @Nested
    @DisplayName("getFlightByNumber")
    class GetFlightByNumberTests {

        @Test
        @DisplayName("should return flight when it exists")
        void getFlightByNumber_ShouldReturnFlight_WhenExists() {
            // Given
            when(flightRepository.findByFlightNumber("AA123")).thenReturn(Optional.of(sampleFlight));
            when(flightEventRepository.findByFlightNumberOrderByEventTimestampDesc(anyString()))
                    .thenReturn(Collections.emptyList());

            // When
            Optional<FlightDTO> result = flightService.getFlightByNumber("AA123");

            // Then
            assertThat(result).isPresent();
            assertThat(result.get().getFlightNumber()).isEqualTo("AA123");
            verify(flightRepository).findByFlightNumber("AA123");
        }

        @Test
        @DisplayName("should return empty when flight does not exist")
        void getFlightByNumber_ShouldReturnEmpty_WhenNotExists() {
            // Given
            when(flightRepository.findByFlightNumber("XX999")).thenReturn(Optional.empty());

            // When
            Optional<FlightDTO> result = flightService.getFlightByNumber("XX999");

            // Then
            assertThat(result).isEmpty();
            verify(flightRepository).findByFlightNumber("XX999");
        }
    }

    @Nested
    @DisplayName("getFlightsByStatus")
    class GetFlightsByStatusTests {

        @Test
        @DisplayName("should return flights filtered by status")
        void getFlightsByStatus_ShouldReturnFilteredFlights() {
            // Given
            when(flightRepository.findByStatus(FlightStatus.ON_TIME))
                    .thenReturn(Collections.singletonList(sampleFlight));

            // When
            List<FlightDTO> result = flightService.getFlightsByStatus(FlightStatus.ON_TIME);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStatus()).isEqualTo(FlightStatus.ON_TIME);
            verify(flightRepository).findByStatus(FlightStatus.ON_TIME);
        }

        @Test
        @DisplayName("should return empty list when no flights match status")
        void getFlightsByStatus_ShouldReturnEmpty_WhenNoMatch() {
            // Given
            when(flightRepository.findByStatus(FlightStatus.CANCELLED))
                    .thenReturn(Collections.emptyList());

            // When
            List<FlightDTO> result = flightService.getFlightsByStatus(FlightStatus.CANCELLED);

            // Then
            assertThat(result).isEmpty();
            verify(flightRepository).findByStatus(FlightStatus.CANCELLED);
        }
    }

    @Nested
    @DisplayName("getFlightsByAirline")
    class GetFlightsByAirlineTests {

        @Test
        @DisplayName("should return flights filtered by airline")
        void getFlightsByAirline_ShouldReturnFilteredFlights() {
            // Given
            when(flightRepository.findByAirline("AA"))
                    .thenReturn(Collections.singletonList(sampleFlight));

            // When
            List<FlightDTO> result = flightService.getFlightsByAirline("AA");

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getAirline()).isEqualTo("AA");
            verify(flightRepository).findByAirline("AA");
        }
    }

    @Nested
    @DisplayName("getFlightEvents")
    class GetFlightEventsTests {

        @Test
        @DisplayName("should return events for a flight")
        void getFlightEvents_ShouldReturnEventsForFlight() {
            // Given
            when(flightEventRepository.findByFlightNumberOrderByEventTimestampDesc("AA123"))
                    .thenReturn(Collections.singletonList(sampleEvent));

            // When
            List<FlightEventDTO> result = flightService.getFlightEvents("AA123");

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getFlightNumber()).isEqualTo("AA123");
            assertThat(result.get(0).getEventType()).isEqualTo(FlightEventType.GATE_CHANGE);
            verify(flightEventRepository).findByFlightNumberOrderByEventTimestampDesc("AA123");
        }

        @Test
        @DisplayName("should return empty list when no events exist")
        void getFlightEvents_ShouldReturnEmpty_WhenNoEvents() {
            // Given
            when(flightEventRepository.findByFlightNumberOrderByEventTimestampDesc("AA123"))
                    .thenReturn(Collections.emptyList());

            // When
            List<FlightEventDTO> result = flightService.getFlightEvents("AA123");

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getRecentEvents")
    class GetRecentEventsTests {

        @Test
        @DisplayName("should return top 10 recent events")
        void getRecentEvents_ShouldReturnTop10Events() {
            // Given
            when(flightEventRepository.findTop10ByOrderByEventTimestampDesc())
                    .thenReturn(Collections.singletonList(sampleEvent));

            // When
            List<FlightEventDTO> result = flightService.getRecentEvents();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getEventType()).isEqualTo(FlightEventType.GATE_CHANGE);
            verify(flightEventRepository).findTop10ByOrderByEventTimestampDesc();
        }
    }
}
