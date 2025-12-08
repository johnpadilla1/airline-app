package com.airline.notification.service;

import com.airline.model.dto.FlightEventDTO;
import com.airline.model.enums.FlightEventType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SseEmitterService Unit Tests (Notification Service)")
class SseEmitterServiceTest {

    private SseEmitterService sseEmitterService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        sseEmitterService = new SseEmitterService(objectMapper);
    }

    @Nested
    @DisplayName("createEmitter")
    class CreateEmitterTests {

        @Test
        @DisplayName("should add emitter to the list")
        void createEmitter_ShouldAddToEmittersList() {
            // When
            SseEmitter emitter = sseEmitterService.createEmitter();

            // Then
            assertThat(emitter).isNotNull();
            assertThat(sseEmitterService.getConnectionCount()).isEqualTo(1);
        }

        @Test
        @DisplayName("should create multiple emitters")
        void createEmitter_ShouldAddMultiple() {
            // When
            sseEmitterService.createEmitter();
            sseEmitterService.createEmitter();
            sseEmitterService.createEmitter();

            // Then
            assertThat(sseEmitterService.getConnectionCount()).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("broadcastEvent")
    class BroadcastEventTests {

        @Test
        @DisplayName("should send event to all connected clients")
        void broadcastEvent_ShouldSendToAllClients() throws Exception {
            // Given
            SseEmitter mockEmitter1 = mock(SseEmitter.class);
            SseEmitter mockEmitter2 = mock(SseEmitter.class);
            
            Field emittersField = SseEmitterService.class.getDeclaredField("emitters");
            emittersField.setAccessible(true);
            @SuppressWarnings("unchecked")
            List<SseEmitter> emitters = (List<SseEmitter>) emittersField.get(sseEmitterService);
            emitters.add(mockEmitter1);
            emitters.add(mockEmitter2);

            FlightEventDTO event = FlightEventDTO.builder()
                    .flightNumber("AA123")
                    .eventType(FlightEventType.GATE_CHANGE)
                    .newValue("B2")
                    .timestamp(LocalDateTime.now())
                    .build();

            // When
            sseEmitterService.broadcastEvent(event);

            // Then
            verify(mockEmitter1).send(any(SseEmitter.SseEventBuilder.class));
            verify(mockEmitter2).send(any(SseEmitter.SseEventBuilder.class));
        }

        @Test
        @DisplayName("should skip broadcast when no clients connected")
        void broadcastEvent_NoClients_ShouldSkip() {
            // Given
            FlightEventDTO event = FlightEventDTO.builder()
                    .flightNumber("AA123")
                    .eventType(FlightEventType.DELAY)
                    .build();

            // When & Then
            assertThatNoException().isThrownBy(() -> sseEmitterService.broadcastEvent(event));
        }

        @Test
        @DisplayName("should remove dead emitters on broadcast failure")
        void broadcastEvent_ShouldRemoveDeadEmitters() throws Exception {
            // Given
            SseEmitter mockEmitter = mock(SseEmitter.class);
            doThrow(new IOException("Connection closed")).when(mockEmitter).send(any(SseEmitter.SseEventBuilder.class));
            
            Field emittersField = SseEmitterService.class.getDeclaredField("emitters");
            emittersField.setAccessible(true);
            @SuppressWarnings("unchecked")
            List<SseEmitter> emitters = (List<SseEmitter>) emittersField.get(sseEmitterService);
            emitters.add(mockEmitter);

            FlightEventDTO event = FlightEventDTO.builder()
                    .flightNumber("AA123")
                    .eventType(FlightEventType.GATE_CHANGE)
                    .build();

            // When
            sseEmitterService.broadcastEvent(event);

            // Then
            assertThat(sseEmitterService.getConnectionCount()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("getConnectionCount")
    class GetConnectionCountTests {

        @Test
        @DisplayName("should return correct size of emitters list")
        void getConnectionCount_ShouldReturnCorrectSize() {
            // When
            sseEmitterService.createEmitter();
            sseEmitterService.createEmitter();

            // Then
            assertThat(sseEmitterService.getConnectionCount()).isEqualTo(2);
        }

        @Test
        @DisplayName("should return zero when no connections")
        void getConnectionCount_NoConnections_ShouldReturnZero() {
            // When & Then
            assertThat(sseEmitterService.getConnectionCount()).isEqualTo(0);
        }
    }
}
