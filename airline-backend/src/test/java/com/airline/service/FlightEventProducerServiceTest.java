package com.airline.service;

import com.airline.config.KafkaTopicConfig;
import com.airline.model.dto.FlightEventDTO;
import com.airline.model.entity.Flight;
import com.airline.model.enums.FlightStatus;
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
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FlightEventProducerService Unit Tests")
class FlightEventProducerServiceTest {

    @Mock
    private KafkaTemplate<String, FlightEventDTO> kafkaTemplate;

    @Mock
    private FlightRepository flightRepository;

    @InjectMocks
    private FlightEventProducerService flightEventProducerService;

    @Captor
    private ArgumentCaptor<FlightEventDTO> eventCaptor;

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
    @DisplayName("publishRandomFlightEvent")
    class PublishRandomFlightEventTests {

        @Test
        @DisplayName("should publish event to Kafka when active flights exist")
        void publishRandomFlightEvent_ShouldPublishToKafka() {
            // Given
            List<Flight> flights = Arrays.asList(sampleFlight);
            when(flightRepository.findByStatusNot(FlightStatus.CANCELLED)).thenReturn(flights);
            
            CompletableFuture<SendResult<String, FlightEventDTO>> future = new CompletableFuture<>();
            future.complete(mock(SendResult.class));
            when(kafkaTemplate.send(anyString(), anyString(), any(FlightEventDTO.class)))
                    .thenReturn(future);

            // When
            flightEventProducerService.publishRandomFlightEvent();

            // Then
            verify(kafkaTemplate).send(eq(KafkaTopicConfig.FLIGHT_EVENTS_TOPIC), 
                    eq("AA123"), eventCaptor.capture());
            FlightEventDTO sentEvent = eventCaptor.getValue();
            assertThat(sentEvent.getFlightNumber()).isEqualTo("AA123");
            assertThat(sentEvent.getEventType()).isNotNull();
        }

        @Test
        @DisplayName("should not publish when no active flights exist")
        void publishRandomFlightEvent_NoActiveFlights_ShouldNotPublish() {
            // Given
            when(flightRepository.findByStatusNot(FlightStatus.CANCELLED))
                    .thenReturn(Collections.emptyList());

            // When
            flightEventProducerService.publishRandomFlightEvent();

            // Then
            verify(kafkaTemplate, never()).send(anyString(), anyString(), any(FlightEventDTO.class));
        }

        @Test
        @DisplayName("should exclude arrived flights from publishing")
        void publishRandomFlightEvent_ShouldExcludeArrivedFlights() {
            // Given
            Flight arrivedFlight = Flight.builder()
                    .id(2L)
                    .flightNumber("UA456")
                    .status(FlightStatus.ARRIVED)
                    .gate("B2")
                    .delayMinutes(0)
                    .build();

            // Use ArrayList to allow removal of arrived flights
            List<Flight> flights = new java.util.ArrayList<>(Arrays.asList(sampleFlight, arrivedFlight));
            when(flightRepository.findByStatusNot(FlightStatus.CANCELLED)).thenReturn(flights);
            
            CompletableFuture<SendResult<String, FlightEventDTO>> future = new CompletableFuture<>();
            future.complete(mock(SendResult.class));
            when(kafkaTemplate.send(anyString(), anyString(), any(FlightEventDTO.class)))
                    .thenReturn(future);

            // When
            flightEventProducerService.publishRandomFlightEvent();

            // Then
            verify(kafkaTemplate).send(eq(KafkaTopicConfig.FLIGHT_EVENTS_TOPIC), 
                    eq("AA123"), any(FlightEventDTO.class));
        }
    }

    @Nested
    @DisplayName("publishEvent")
    class PublishEventTests {

        @Test
        @DisplayName("should send event directly to Kafka topic")
        void publishEvent_ShouldSendToKafkaTopic() {
            // Given
            FlightEventDTO event = FlightEventDTO.builder()
                    .flightNumber("AA123")
                    .eventType(com.airline.model.enums.FlightEventType.GATE_CHANGE)
                    .previousValue("A1")
                    .newValue("B2")
                    .description("Gate changed")
                    .eventTimestamp(LocalDateTime.now())
                    .build();

            CompletableFuture<SendResult<String, FlightEventDTO>> future = new CompletableFuture<>();
            future.complete(mock(SendResult.class));
            when(kafkaTemplate.send(anyString(), anyString(), any(FlightEventDTO.class)))
                    .thenReturn(future);

            // When
            flightEventProducerService.publishEvent(event);

            // Then
            verify(kafkaTemplate).send(eq(KafkaTopicConfig.FLIGHT_EVENTS_TOPIC), 
                    eq("AA123"), eventCaptor.capture());
            assertThat(eventCaptor.getValue().getNewValue()).isEqualTo("B2");
        }
    }
}
