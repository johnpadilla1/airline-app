package com.airline.flight.service;

import com.airline.model.dto.FlightDTO;
import com.airline.model.dto.FlightEventDTO;
import com.airline.model.entity.Flight;
import com.airline.model.entity.FlightEvent;
import com.airline.model.enums.FlightEventType;
import com.airline.model.enums.FlightStatus;
import com.airline.flight.repository.FlightEventRepository;
import com.airline.flight.repository.FlightRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FlightService Unit Tests (Microservices)")
class FlightServiceTest {

    @Mock
    private FlightRepository flightRepository;

    @Mock
    private FlightEventRepository flightEventRepository;

    @InjectMocks
    private FlightService flightService;

    @Captor
    private ArgumentCaptor<Flight> flightCaptor;

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
                .flightId(1L)
                .flightNumber("AA123")
                .eventType(FlightEventType.GATE_CHANGE)
                .oldValue("A1")
                .newValue("B2")
                .description("Gate changed from A1 to B2")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("getAllFlights")
    class GetAllFlightsTests {

        @Test
        @DisplayName("should return all flights as DTOs")
        void getAllFlights_ShouldReturnMappedDTOs() {
            // Given
            when(flightRepository.findAll()).thenReturn(Arrays.asList(sampleFlight));
            when(flightEventRepository.findTop5ByFlightIdOrderByCreatedAtDesc(anyLong()))
                    .thenReturn(Collections.emptyList());

            // When
            List<FlightDTO> result = flightService.getAllFlights();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getFlightNumber()).isEqualTo("AA123");
            assertThat(result.get(0).getAirline()).isEqualTo("AA");
            verify(flightRepository).findAll();
        }

        @Test
        @DisplayName("should return empty list when no flights exist")
        void getAllFlights_ShouldReturnEmpty_WhenNoFlights() {
            // Given
            when(flightRepository.findAll()).thenReturn(Collections.emptyList());

            // When
            List<FlightDTO> result = flightService.getAllFlights();

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getFlightById")
    class GetFlightByIdTests {

        @Test
        @DisplayName("should return flight DTO when exists")
        void getFlightById_ShouldReturnFlightDTO() {
            // Given
            when(flightRepository.findById(1L)).thenReturn(Optional.of(sampleFlight));
            when(flightEventRepository.findTop5ByFlightIdOrderByCreatedAtDesc(1L))
                    .thenReturn(Collections.emptyList());

            // When
            Optional<FlightDTO> result = flightService.getFlightById(1L);

            // Then
            assertThat(result).isPresent();
            assertThat(result.get().getFlightNumber()).isEqualTo("AA123");
        }

        @Test
        @DisplayName("should return empty when flight not found")
        void getFlightById_ShouldReturnEmpty_WhenNotFound() {
            // Given
            when(flightRepository.findById(999L)).thenReturn(Optional.empty());

            // When
            Optional<FlightDTO> result = flightService.getFlightById(999L);

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getFlightByNumber")
    class GetFlightByNumberTests {

        @Test
        @DisplayName("should return flight DTO when exists")
        void getFlightByNumber_ShouldReturnFlightDTO() {
            // Given
            when(flightRepository.findByFlightNumber("AA123")).thenReturn(Optional.of(sampleFlight));
            when(flightEventRepository.findTop5ByFlightIdOrderByCreatedAtDesc(1L))
                    .thenReturn(Collections.emptyList());

            // When
            Optional<FlightDTO> result = flightService.getFlightByNumber("AA123");

            // Then
            assertThat(result).isPresent();
            assertThat(result.get().getAirline()).isEqualTo("AA");
        }
    }

    @Nested
    @DisplayName("getFlightsByStatus")
    class GetFlightsByStatusTests {

        @Test
        @DisplayName("should filter flights correctly by status")
        void getFlightsByStatus_ShouldFilterCorrectly() {
            // Given
            when(flightRepository.findByStatus(FlightStatus.ON_TIME))
                    .thenReturn(Arrays.asList(sampleFlight));
            when(flightEventRepository.findTop5ByFlightIdOrderByCreatedAtDesc(anyLong()))
                    .thenReturn(Collections.emptyList());

            // When
            List<FlightDTO> result = flightService.getFlightsByStatus(FlightStatus.ON_TIME);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStatus()).isEqualTo(FlightStatus.ON_TIME);
        }
    }

    @Nested
    @DisplayName("getRandomFlight")
    class GetRandomFlightTests {

        @Test
        @DisplayName("should return a random flight")
        void getRandomFlight_ShouldReturnRandomFlight() {
            // Given
            when(flightRepository.findAll()).thenReturn(Arrays.asList(sampleFlight));
            when(flightEventRepository.findTop5ByFlightIdOrderByCreatedAtDesc(anyLong()))
                    .thenReturn(Collections.emptyList());

            // When
            FlightDTO result = flightService.getRandomFlight();

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getFlightNumber()).isEqualTo("AA123");
        }

        @Test
        @DisplayName("should throw exception when no flights available")
        void getRandomFlight_NoFlights_ShouldThrowException() {
            // Given
            when(flightRepository.findAll()).thenReturn(Collections.emptyList());

            // When & Then
            assertThatThrownBy(() -> flightService.getRandomFlight())
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("No flights available");
        }
    }

    @Nested
    @DisplayName("updateFlightStatus")
    class UpdateFlightStatusTests {

        @Test
        @DisplayName("should update status and save flight")
        void updateFlightStatus_ShouldUpdateAndSave() {
            // Given
            when(flightRepository.findById(1L)).thenReturn(Optional.of(sampleFlight));
            when(flightRepository.save(any(Flight.class))).thenReturn(sampleFlight);
            when(flightEventRepository.findTop5ByFlightIdOrderByCreatedAtDesc(anyLong()))
                    .thenReturn(Collections.emptyList());

            // When
            FlightDTO result = flightService.updateFlightStatus(1L, FlightStatus.BOARDING);

            // Then
            verify(flightRepository).save(flightCaptor.capture());
            assertThat(flightCaptor.getValue().getStatus()).isEqualTo(FlightStatus.BOARDING);
        }

        @Test
        @DisplayName("should throw exception when flight not found")
        void updateFlightStatus_NotFound_ShouldThrow() {
            // Given
            when(flightRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> flightService.updateFlightStatus(999L, FlightStatus.BOARDING))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Flight not found");
        }
    }

    @Nested
    @DisplayName("updateFlightGate")
    class UpdateFlightGateTests {

        @Test
        @DisplayName("should update gate and save flight")
        void updateFlightGate_ShouldUpdateAndSave() {
            // Given
            when(flightRepository.findById(1L)).thenReturn(Optional.of(sampleFlight));
            when(flightRepository.save(any(Flight.class))).thenReturn(sampleFlight);
            when(flightEventRepository.findTop5ByFlightIdOrderByCreatedAtDesc(anyLong()))
                    .thenReturn(Collections.emptyList());

            // When
            FlightDTO result = flightService.updateFlightGate(1L, "C5");

            // Then
            verify(flightRepository).save(flightCaptor.capture());
            assertThat(flightCaptor.getValue().getGate()).isEqualTo("C5");
        }
    }

    @Nested
    @DisplayName("updateFlightDelay")
    class UpdateFlightDelayTests {

        @Test
        @DisplayName("should set DELAYED status when delay is positive")
        void updateFlightDelay_ShouldSetDelayedStatus() {
            // Given
            when(flightRepository.findById(1L)).thenReturn(Optional.of(sampleFlight));
            when(flightRepository.save(any(Flight.class))).thenReturn(sampleFlight);
            when(flightEventRepository.findTop5ByFlightIdOrderByCreatedAtDesc(anyLong()))
                    .thenReturn(Collections.emptyList());

            // When
            FlightDTO result = flightService.updateFlightDelay(1L, 45);

            // Then
            verify(flightRepository).save(flightCaptor.capture());
            Flight saved = flightCaptor.getValue();
            assertThat(saved.getDelayMinutes()).isEqualTo(45);
            assertThat(saved.getStatus()).isEqualTo(FlightStatus.DELAYED);
        }

        @Test
        @DisplayName("should not change status when delay is zero")
        void updateFlightDelay_ZeroDelay_ShouldNotChangeStatus() {
            // Given
            when(flightRepository.findById(1L)).thenReturn(Optional.of(sampleFlight));
            when(flightRepository.save(any(Flight.class))).thenReturn(sampleFlight);
            when(flightEventRepository.findTop5ByFlightIdOrderByCreatedAtDesc(anyLong()))
                    .thenReturn(Collections.emptyList());

            // When
            FlightDTO result = flightService.updateFlightDelay(1L, 0);

            // Then
            verify(flightRepository).save(flightCaptor.capture());
            Flight saved = flightCaptor.getValue();
            assertThat(saved.getDelayMinutes()).isEqualTo(0);
            assertThat(saved.getStatus()).isEqualTo(FlightStatus.ON_TIME);
        }
    }

    @Nested
    @DisplayName("saveFlightEvent")
    class SaveFlightEventTests {

        @Test
        @DisplayName("should persist event to repository")
        void saveFlightEvent_ShouldPersistEvent() {
            // Given
            when(flightEventRepository.save(any(FlightEvent.class))).thenReturn(sampleEvent);

            // When
            FlightEvent result = flightService.saveFlightEvent(sampleEvent);

            // Then
            assertThat(result.getId()).isEqualTo(1L);
            verify(flightEventRepository).save(sampleEvent);
        }
    }

    @Nested
    @DisplayName("getRecentEvents")
    class GetRecentEventsTests {

        @Test
        @DisplayName("should return top 20 recent events")
        void getRecentEvents_ShouldReturnTop20() {
            // Given
            when(flightEventRepository.findTop20ByOrderByCreatedAtDesc())
                    .thenReturn(Arrays.asList(sampleEvent));

            // When
            List<FlightEventDTO> result = flightService.getRecentEvents();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getEventType()).isEqualTo(FlightEventType.GATE_CHANGE);
            verify(flightEventRepository).findTop20ByOrderByCreatedAtDesc();
        }
    }

    @Nested
    @DisplayName("getFlightEvents")
    class GetFlightEventsTests {

        @Test
        @DisplayName("should return events for specific flight")
        void getFlightEvents_ShouldReturnEventsForFlight() {
            // Given
            when(flightEventRepository.findByFlightIdOrderByCreatedAtDesc(1L))
                    .thenReturn(Arrays.asList(sampleEvent));

            // When
            List<FlightEventDTO> result = flightService.getFlightEvents(1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getFlightNumber()).isEqualTo("AA123");
        }
    }
}
