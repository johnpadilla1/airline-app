package com.airline.service;

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
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FlightEventConsumerService Unit Tests")
class FlightEventConsumerServiceTest {

    @Mock
    private FlightRepository flightRepository;

    @Mock
    private FlightEventRepository flightEventRepository;

    @Mock
    private SseEmitterService sseEmitterService;

    @InjectMocks
    private FlightEventConsumerService flightEventConsumerService;

    @Captor
    private ArgumentCaptor<Flight> flightCaptor;

    @Captor
    private ArgumentCaptor<FlightEvent> eventCaptor;

    @Captor
    private ArgumentCaptor<FlightEventDTO> eventDtoCaptor;

    private Flight sampleFlight;

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
    }

    @Nested
    @DisplayName("consumeFlightEvent - DELAY")
    class ConsumeDelayEventTests {

        @Test
        @DisplayName("should update flight with delay and broadcast to SSE clients")
        void consumeFlightEvent_Delay_ShouldUpdateFlightAndBroadcast() {
            // Given
            FlightEventDTO eventDTO = FlightEventDTO.builder()
                    .flightNumber("AA123")
                    .eventType(FlightEventType.DELAY)
                    .previousValue("0")
                    .newValue("30")
                    .description("Flight delayed by 30 minutes")
                    .eventTimestamp(LocalDateTime.now())
                    .build();

            when(flightRepository.findByFlightNumber("AA123")).thenReturn(Optional.of(sampleFlight));
            when(flightRepository.save(any(Flight.class))).thenReturn(sampleFlight);
            when(flightEventRepository.save(any(FlightEvent.class))).thenReturn(FlightEvent.builder().id(1L).build());

            // When
            flightEventConsumerService.consumeFlightEvent(eventDTO);

            // Then
            verify(flightRepository).save(flightCaptor.capture());
            Flight savedFlight = flightCaptor.getValue();
            assertThat(savedFlight.getDelayMinutes()).isEqualTo(30);
            assertThat(savedFlight.getStatus()).isEqualTo(FlightStatus.DELAYED);

            verify(flightEventRepository).save(eventCaptor.capture());
            assertThat(eventCaptor.getValue().getEventType()).isEqualTo(FlightEventType.DELAY);

            verify(sseEmitterService).broadcast(any(FlightEventDTO.class));
        }
    }

    @Nested
    @DisplayName("consumeFlightEvent - GATE_CHANGE")
    class ConsumeGateChangeEventTests {

        @Test
        @DisplayName("should update flight gate")
        void consumeFlightEvent_GateChange_ShouldUpdateGate() {
            // Given
            FlightEventDTO eventDTO = FlightEventDTO.builder()
                    .flightNumber("AA123")
                    .eventType(FlightEventType.GATE_CHANGE)
                    .previousValue("A1")
                    .newValue("B5")
                    .description("Gate changed from A1 to B5")
                    .eventTimestamp(LocalDateTime.now())
                    .build();

            when(flightRepository.findByFlightNumber("AA123")).thenReturn(Optional.of(sampleFlight));
            when(flightRepository.save(any(Flight.class))).thenReturn(sampleFlight);
            when(flightEventRepository.save(any(FlightEvent.class))).thenReturn(FlightEvent.builder().id(1L).build());

            // When
            flightEventConsumerService.consumeFlightEvent(eventDTO);

            // Then
            verify(flightRepository).save(flightCaptor.capture());
            Flight savedFlight = flightCaptor.getValue();
            assertThat(savedFlight.getGate()).isEqualTo("B5");

            verify(sseEmitterService).broadcast(any(FlightEventDTO.class));
        }
    }

    @Nested
    @DisplayName("consumeFlightEvent - BOARDING_STARTED")
    class ConsumeBoardingEventTests {

        @Test
        @DisplayName("should update flight status to BOARDING")
        void consumeFlightEvent_BoardingStarted_ShouldUpdateStatus() {
            // Given
            FlightEventDTO eventDTO = FlightEventDTO.builder()
                    .flightNumber("AA123")
                    .eventType(FlightEventType.BOARDING_STARTED)
                    .description("Boarding has started")
                    .eventTimestamp(LocalDateTime.now())
                    .build();

            when(flightRepository.findByFlightNumber("AA123")).thenReturn(Optional.of(sampleFlight));
            when(flightRepository.save(any(Flight.class))).thenReturn(sampleFlight);
            when(flightEventRepository.save(any(FlightEvent.class))).thenReturn(FlightEvent.builder().id(1L).build());

            // When
            flightEventConsumerService.consumeFlightEvent(eventDTO);

            // Then
            verify(flightRepository).save(flightCaptor.capture());
            Flight savedFlight = flightCaptor.getValue();
            assertThat(savedFlight.getStatus()).isEqualTo(FlightStatus.BOARDING);
        }
    }

    @Nested
    @DisplayName("consumeFlightEvent - CANCELLATION")
    class ConsumeCancellationEventTests {

        @Test
        @DisplayName("should update flight status to CANCELLED")
        void consumeFlightEvent_Cancellation_ShouldSetCancelledStatus() {
            // Given
            FlightEventDTO eventDTO = FlightEventDTO.builder()
                    .flightNumber("AA123")
                    .eventType(FlightEventType.CANCELLATION)
                    .description("Flight has been cancelled")
                    .eventTimestamp(LocalDateTime.now())
                    .build();

            when(flightRepository.findByFlightNumber("AA123")).thenReturn(Optional.of(sampleFlight));
            when(flightRepository.save(any(Flight.class))).thenReturn(sampleFlight);
            when(flightEventRepository.save(any(FlightEvent.class))).thenReturn(FlightEvent.builder().id(1L).build());

            // When
            flightEventConsumerService.consumeFlightEvent(eventDTO);

            // Then
            verify(flightRepository).save(flightCaptor.capture());
            Flight savedFlight = flightCaptor.getValue();
            assertThat(savedFlight.getStatus()).isEqualTo(FlightStatus.CANCELLED);
        }
    }

    @Nested
    @DisplayName("consumeFlightEvent - REINSTATEMENT")
    class ConsumeReinstatementEventTests {

        @Test
        @DisplayName("should reset flight status and delay")
        void consumeFlightEvent_Reinstatement_ShouldResetStatusAndDelay() {
            // Given
            sampleFlight.setStatus(FlightStatus.CANCELLED);
            sampleFlight.setDelayMinutes(60);

            FlightEventDTO eventDTO = FlightEventDTO.builder()
                    .flightNumber("AA123")
                    .eventType(FlightEventType.REINSTATEMENT)
                    .description("Flight has been reinstated")
                    .eventTimestamp(LocalDateTime.now())
                    .build();

            when(flightRepository.findByFlightNumber("AA123")).thenReturn(Optional.of(sampleFlight));
            when(flightRepository.save(any(Flight.class))).thenReturn(sampleFlight);
            when(flightEventRepository.save(any(FlightEvent.class))).thenReturn(FlightEvent.builder().id(1L).build());

            // When
            flightEventConsumerService.consumeFlightEvent(eventDTO);

            // Then
            verify(flightRepository).save(flightCaptor.capture());
            Flight savedFlight = flightCaptor.getValue();
            assertThat(savedFlight.getStatus()).isEqualTo(FlightStatus.ON_TIME);
            assertThat(savedFlight.getDelayMinutes()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("consumeFlightEvent - Flight Not Found")
    class ConsumeEventFlightNotFoundTests {

        @Test
        @DisplayName("should log warning and not process when flight not found")
        void consumeFlightEvent_FlightNotFound_ShouldLogWarning() {
            // Given
            FlightEventDTO eventDTO = FlightEventDTO.builder()
                    .flightNumber("XX999")
                    .eventType(FlightEventType.DELAY)
                    .newValue("30")
                    .eventTimestamp(LocalDateTime.now())
                    .build();

            when(flightRepository.findByFlightNumber("XX999")).thenReturn(Optional.empty());

            // When
            flightEventConsumerService.consumeFlightEvent(eventDTO);

            // Then
            verify(flightRepository).findByFlightNumber("XX999");
            verify(flightRepository, never()).save(any());
            verify(flightEventRepository, never()).save(any());
            verify(sseEmitterService, never()).broadcast(any());
        }
    }

    @Nested
    @DisplayName("consumeFlightEvent - DEPARTED")
    class ConsumeDepartedEventTests {

        @Test
        @DisplayName("should update status to DEPARTED and set actual departure time")
        void consumeFlightEvent_Departed_ShouldUpdateStatusAndTime() {
            // Given
            FlightEventDTO eventDTO = FlightEventDTO.builder()
                    .flightNumber("AA123")
                    .eventType(FlightEventType.DEPARTED)
                    .description("Flight has departed")
                    .eventTimestamp(LocalDateTime.now())
                    .build();

            when(flightRepository.findByFlightNumber("AA123")).thenReturn(Optional.of(sampleFlight));
            when(flightRepository.save(any(Flight.class))).thenReturn(sampleFlight);
            when(flightEventRepository.save(any(FlightEvent.class))).thenReturn(FlightEvent.builder().id(1L).build());

            // When
            flightEventConsumerService.consumeFlightEvent(eventDTO);

            // Then
            verify(flightRepository).save(flightCaptor.capture());
            Flight savedFlight = flightCaptor.getValue();
            assertThat(savedFlight.getStatus()).isEqualTo(FlightStatus.DEPARTED);
            assertThat(savedFlight.getActualDeparture()).isNotNull();
        }
    }

    @Nested
    @DisplayName("consumeFlightEvent - ARRIVED")
    class ConsumeArrivedEventTests {

        @Test
        @DisplayName("should update status to ARRIVED and set actual arrival time")
        void consumeFlightEvent_Arrived_ShouldUpdateStatusAndTime() {
            // Given
            FlightEventDTO eventDTO = FlightEventDTO.builder()
                    .flightNumber("AA123")
                    .eventType(FlightEventType.ARRIVED)
                    .description("Flight has arrived")
                    .eventTimestamp(LocalDateTime.now())
                    .build();

            when(flightRepository.findByFlightNumber("AA123")).thenReturn(Optional.of(sampleFlight));
            when(flightRepository.save(any(Flight.class))).thenReturn(sampleFlight);
            when(flightEventRepository.save(any(FlightEvent.class))).thenReturn(FlightEvent.builder().id(1L).build());

            // When
            flightEventConsumerService.consumeFlightEvent(eventDTO);

            // Then
            verify(flightRepository).save(flightCaptor.capture());
            Flight savedFlight = flightCaptor.getValue();
            assertThat(savedFlight.getStatus()).isEqualTo(FlightStatus.ARRIVED);
            assertThat(savedFlight.getActualArrival()).isNotNull();
        }
    }
}
