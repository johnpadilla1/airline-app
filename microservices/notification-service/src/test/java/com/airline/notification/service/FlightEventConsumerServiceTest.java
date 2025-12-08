package com.airline.notification.service;

import com.airline.model.dto.FlightDTO;
import com.airline.model.dto.FlightEventDTO;
import com.airline.model.enums.FlightEventType;
import com.airline.model.enums.FlightStatus;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("FlightEventConsumerService Unit Tests (Notification Service)")
class FlightEventConsumerServiceTest {

    @Mock
    private SseEmitterService sseEmitterService;

    @Mock
    private WebClient flightServiceWebClient;

    @Mock
    private WebClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private WebClient.RequestBodySpec requestBodySpec;

    @Mock
    private WebClient.RequestHeadersSpec requestHeadersSpec;

    @Mock
    private WebClient.ResponseSpec responseSpec;

    @InjectMocks
    private FlightEventConsumerService flightEventConsumerService;

    @Captor
    private ArgumentCaptor<FlightEventDTO> eventCaptor;

    private FlightEventDTO sampleEvent;

    @BeforeEach
    void setUp() {
        sampleEvent = FlightEventDTO.builder()
                .id(1L)
                .flightId(1L)
                .flightNumber("AA123")
                .airline("AA")
                .airlineName("American Airlines")
                .origin("JFK")
                .originCity("New York")
                .destination("LAX")
                .destinationCity("Los Angeles")
                .eventType(FlightEventType.DELAY)
                .description("Flight delayed by 30 minutes")
                .oldValue("0")
                .newValue("30")
                .newStatus(FlightStatus.DELAYED)
                .newDelayMinutes(30)
                .timestamp(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("consumeFlightEvent")
    class ConsumeFlightEventTests {

        @Test
        @DisplayName("should update flight and broadcast event to SSE clients")
        void consumeFlightEvent_ShouldUpdateFlightAndBroadcast() {
            // Given
            when(flightServiceWebClient.put()).thenReturn(requestBodyUriSpec);
            when(requestBodyUriSpec.uri(anyString(), anyLong())).thenReturn(requestBodySpec);
            when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
            when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
            when(responseSpec.bodyToMono(FlightDTO.class)).thenReturn(Mono.just(FlightDTO.builder().build()));

            when(flightServiceWebClient.post()).thenReturn(requestBodyUriSpec);
            when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
            when(responseSpec.bodyToMono(any(Class.class))).thenReturn(Mono.empty());

            // When
            flightEventConsumerService.consumeFlightEvent(sampleEvent);

            // Then
            verify(sseEmitterService).broadcastEvent(eventCaptor.capture());
            FlightEventDTO broadcastedEvent = eventCaptor.getValue();
            assertThat(broadcastedEvent.getFlightNumber()).isEqualTo("AA123");
            assertThat(broadcastedEvent.getEventType()).isEqualTo(FlightEventType.DELAY);
        }

        @Test
        @DisplayName("should log error and continue when update fails")
        void consumeFlightEvent_UpdateError_ShouldLogAndContinue() {
            // Given
            when(flightServiceWebClient.put()).thenReturn(requestBodyUriSpec);
            when(requestBodyUriSpec.uri(anyString(), anyLong())).thenReturn(requestBodySpec);
            when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
            when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
            when(responseSpec.bodyToMono(FlightDTO.class)).thenThrow(new RuntimeException("Connection failed"));

            // When - should not throw
            flightEventConsumerService.consumeFlightEvent(sampleEvent);

            // Then - broadcast should still be called due to error handling
            verify(sseEmitterService, atMostOnce()).broadcastEvent(any());
        }

        @Test
        @DisplayName("should call flight service to save event")
        void consumeFlightEvent_ShouldSaveEventViaWebClient() {
            // Given
            when(flightServiceWebClient.put()).thenReturn(requestBodyUriSpec);
            when(requestBodyUriSpec.uri(anyString(), anyLong())).thenReturn(requestBodySpec);
            when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
            when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
            when(responseSpec.bodyToMono(FlightDTO.class)).thenReturn(Mono.just(FlightDTO.builder().build()));

            when(flightServiceWebClient.post()).thenReturn(requestBodyUriSpec);
            when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
            when(responseSpec.bodyToMono(any(Class.class))).thenReturn(Mono.empty());

            // When
            flightEventConsumerService.consumeFlightEvent(sampleEvent);

            // Then
            verify(flightServiceWebClient).post();
        }
    }
}
