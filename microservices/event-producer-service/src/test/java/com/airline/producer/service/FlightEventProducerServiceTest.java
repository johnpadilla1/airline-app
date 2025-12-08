package com.airline.producer.service;

import com.airline.model.dto.FlightDTO;
import com.airline.model.dto.FlightEventDTO;
import com.airline.model.enums.FlightEventType;
import com.airline.model.enums.FlightStatus;
import com.airline.producer.config.KafkaTopicConfig;
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
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FlightEventProducerService Unit Tests (Event Producer Service)")
class FlightEventProducerServiceTest {

    @Mock
    private KafkaTemplate<String, FlightEventDTO> kafkaTemplate;

    @Mock
    private WebClient flightServiceWebClient;

    @Mock
    private WebClient.RequestHeadersUriSpec requestHeadersUriSpec;

    @Mock
    private WebClient.RequestHeadersSpec requestHeadersSpec;

    @Mock
    private WebClient.ResponseSpec responseSpec;

    @InjectMocks
    private FlightEventProducerService flightEventProducerService;

    @Captor
    private ArgumentCaptor<FlightEventDTO> eventCaptor;

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
    @DisplayName("generateRandomEvent")
    class GenerateRandomEventTests {

        @Test
        @DisplayName("should fetch flight and publish event to Kafka")
        void generateRandomEvent_ShouldFetchFlightAndPublish() {
            // Given
            when(flightServiceWebClient.get()).thenReturn(requestHeadersUriSpec);
            when(requestHeadersUriSpec.uri(anyString())).thenReturn(requestHeadersSpec);
            when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
            when(responseSpec.bodyToMono(FlightDTO.class)).thenReturn(Mono.just(sampleFlight));

            CompletableFuture<SendResult<String, FlightEventDTO>> future = new CompletableFuture<>();
            future.complete(mock(SendResult.class));
            when(kafkaTemplate.send(anyString(), anyString(), any(FlightEventDTO.class)))
                    .thenReturn(future);

            // When
            flightEventProducerService.generateRandomEvent();

            // Then
            verify(kafkaTemplate).send(eq(KafkaTopicConfig.FLIGHT_EVENTS_TOPIC), 
                    eq("AA123"), eventCaptor.capture());
            FlightEventDTO sentEvent = eventCaptor.getValue();
            assertThat(sentEvent.getFlightNumber()).isEqualTo("AA123");
            assertThat(sentEvent.getEventType()).isNotNull();
        }

        @Test
        @DisplayName("should log warning when no flight returned")
        void generateRandomEvent_NoFlight_ShouldLogWarning() {
            // Given
            when(flightServiceWebClient.get()).thenReturn(requestHeadersUriSpec);
            when(requestHeadersUriSpec.uri(anyString())).thenReturn(requestHeadersSpec);
            when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
            when(responseSpec.bodyToMono(FlightDTO.class)).thenReturn(Mono.empty());

            // When
            flightEventProducerService.generateRandomEvent();

            // Then
            verify(kafkaTemplate, never()).send(anyString(), anyString(), any(FlightEventDTO.class));
        }

        @Test
        @DisplayName("should handle WebClient error gracefully")
        void generateRandomEvent_WebClientError_ShouldHandleGracefully() {
            // Given
            when(flightServiceWebClient.get()).thenReturn(requestHeadersUriSpec);
            when(requestHeadersUriSpec.uri(anyString())).thenReturn(requestHeadersSpec);
            when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
            when(responseSpec.bodyToMono(FlightDTO.class)).thenThrow(new RuntimeException("Connection refused"));

            // When - should not throw
            flightEventProducerService.generateRandomEvent();

            // Then
            verify(kafkaTemplate, never()).send(anyString(), anyString(), any(FlightEventDTO.class));
        }
    }

    @Nested
    @DisplayName("createRandomEvent - Event Types")
    class CreateRandomEventTests {

        @Test
        @DisplayName("should create delay event with correct structure")
        void createRandomEvent_Delay_ShouldBuildCorrectDTO() throws Exception {
            // Given
            sampleFlight.setStatus(FlightStatus.ON_TIME);
            
            java.lang.reflect.Method method = FlightEventProducerService.class
                    .getDeclaredMethod("createRandomEvent", FlightDTO.class);
            method.setAccessible(true);

            // When
            FlightEventDTO event = (FlightEventDTO) method.invoke(flightEventProducerService, sampleFlight);

            // Then
            assertThat(event.getFlightNumber()).isEqualTo("AA123");
            assertThat(event.getFlightId()).isEqualTo(1L);
            assertThat(event.getTimestamp()).isNotNull();
        }

        @Test
        @DisplayName("should include flight metadata in event")
        void createRandomEvent_ShouldIncludeFlightMetadata() throws Exception {
            // Given
            java.lang.reflect.Method method = FlightEventProducerService.class
                    .getDeclaredMethod("createRandomEvent", FlightDTO.class);
            method.setAccessible(true);

            // When
            FlightEventDTO event = (FlightEventDTO) method.invoke(flightEventProducerService, sampleFlight);

            // Then
            assertThat(event.getAirline()).isEqualTo("AA");
            assertThat(event.getAirlineName()).isEqualTo("American Airlines");
            assertThat(event.getOrigin()).isEqualTo("JFK");
            assertThat(event.getDestination()).isEqualTo("LAX");
        }
    }

    @Nested
    @DisplayName("pickRandomEventType")
    class PickRandomEventTypeTests {

        @Test
        @DisplayName("should return valid event type for ON_TIME status")
        void pickRandomEventType_OnTime_ShouldReturnValidType() throws Exception {
            // Given
            java.lang.reflect.Method method = FlightEventProducerService.class
                    .getDeclaredMethod("pickRandomEventType", FlightStatus.class);
            method.setAccessible(true);

            // When
            FlightEventType eventType = (FlightEventType) method.invoke(flightEventProducerService, FlightStatus.ON_TIME);

            // Then - should be one of the expected types for ON_TIME
            assertThat(eventType).isIn(
                    FlightEventType.STATUS_CHANGE,
                    FlightEventType.GATE_CHANGE,
                    FlightEventType.DELAY,
                    FlightEventType.BOARDING_STARTED,
                    FlightEventType.CANCELLATION
            );
        }

        @Test
        @DisplayName("should return ARRIVAL for IN_FLIGHT status")
        void pickRandomEventType_InFlight_ShouldReturnArrival() throws Exception {
            // Given
            java.lang.reflect.Method method = FlightEventProducerService.class
                    .getDeclaredMethod("pickRandomEventType", FlightStatus.class);
            method.setAccessible(true);

            // When
            FlightEventType eventType = (FlightEventType) method.invoke(flightEventProducerService, FlightStatus.IN_FLIGHT);

            // Then
            assertThat(eventType).isEqualTo(FlightEventType.ARRIVAL);
        }
    }

    @Nested
    @DisplayName("pickNewStatus")
    class PickNewStatusTests {

        @Test
        @DisplayName("should return valid new status for current status")
        void pickNewStatus_ShouldReturnValidNewStatus() throws Exception {
            // Given
            java.lang.reflect.Method method = FlightEventProducerService.class
                    .getDeclaredMethod("pickNewStatus", FlightStatus.class);
            method.setAccessible(true);

            // When
            FlightStatus newStatus = (FlightStatus) method.invoke(flightEventProducerService, FlightStatus.ON_TIME);

            // Then
            assertThat(newStatus).isEqualTo(FlightStatus.BOARDING);
        }

        @Test
        @DisplayName("should return ARRIVED for LANDED status")
        void pickNewStatus_Landed_ShouldReturnArrived() throws Exception {
            // Given
            java.lang.reflect.Method method = FlightEventProducerService.class
                    .getDeclaredMethod("pickNewStatus", FlightStatus.class);
            method.setAccessible(true);

            // When
            FlightStatus newStatus = (FlightStatus) method.invoke(flightEventProducerService, FlightStatus.LANDED);

            // Then
            assertThat(newStatus).isEqualTo(FlightStatus.ARRIVED);
        }

        @Test
        @DisplayName("should return LANDED for IN_FLIGHT status")
        void pickNewStatus_InFlight_ShouldReturnLanded() throws Exception {
            // Given
            java.lang.reflect.Method method = FlightEventProducerService.class
                    .getDeclaredMethod("pickNewStatus", FlightStatus.class);
            method.setAccessible(true);

            // When
            FlightStatus newStatus = (FlightStatus) method.invoke(flightEventProducerService, FlightStatus.IN_FLIGHT);

            // Then
            assertThat(newStatus).isEqualTo(FlightStatus.LANDED);
        }
    }
}
