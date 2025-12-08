package com.airline.service;

import com.airline.model.dto.FlightEventDTO;
import com.airline.model.enums.FlightEventType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SseEmitterService Unit Tests")
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
        @DisplayName("should create and return a new SSE emitter")
        void createEmitter_ShouldReturnEmitterAndAddToList() {
            // When
            SseEmitter emitter = sseEmitterService.createEmitter();

            // Then
            assertThat(emitter).isNotNull();
            assertThat(sseEmitterService.getClientCount()).isEqualTo(1);
        }

        @Test
        @DisplayName("should increment client count for each emitter created")
        void createEmitter_ShouldIncrementClientCount() {
            // When
            sseEmitterService.createEmitter();
            sseEmitterService.createEmitter();
            sseEmitterService.createEmitter();

            // Then
            assertThat(sseEmitterService.getClientCount()).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("broadcast")
    class BroadcastTests {

        @Test
        @DisplayName("should not throw when no emitters are connected")
        void broadcast_NoEmitters_ShouldNotThrow() {
            // Given
            FlightEventDTO event = FlightEventDTO.builder()
                    .flightNumber("AA123")
                    .eventType(FlightEventType.GATE_CHANGE)
                    .previousValue("A1")
                    .newValue("B2")
                    .description("Gate changed")
                    .eventTimestamp(LocalDateTime.now())
                    .build();

            // When & Then
            assertThatNoException().isThrownBy(() -> sseEmitterService.broadcast(event));
        }

        @Test
        @DisplayName("should attempt to send to all connected emitters")
        void broadcast_ShouldSendToAllEmitters() throws Exception {
            // Given
            SseEmitter mockEmitter1 = mock(SseEmitter.class);
            SseEmitter mockEmitter2 = mock(SseEmitter.class);
            
            // Use reflection to add mock emitters to the internal list
            Field emittersField = SseEmitterService.class.getDeclaredField("emitters");
            emittersField.setAccessible(true);
            @SuppressWarnings("unchecked")
            List<SseEmitter> emitters = (List<SseEmitter>) emittersField.get(sseEmitterService);
            emitters.add(mockEmitter1);
            emitters.add(mockEmitter2);

            FlightEventDTO event = FlightEventDTO.builder()
                    .flightNumber("AA123")
                    .eventType(FlightEventType.DELAY)
                    .newValue("30")
                    .description("Flight delayed")
                    .eventTimestamp(LocalDateTime.now())
                    .build();

            // When
            sseEmitterService.broadcast(event);

            // Then
            verify(mockEmitter1).send(any(SseEmitter.SseEventBuilder.class));
            verify(mockEmitter2).send(any(SseEmitter.SseEventBuilder.class));
        }

        @Test
        @DisplayName("should remove dead emitters on IO exception")
        void broadcast_ShouldRemoveDeadEmitters() throws Exception {
            // Given
            SseEmitter mockEmitter = mock(SseEmitter.class);
            doThrow(new IOException("Connection closed")).when(mockEmitter).send(any(SseEmitter.SseEventBuilder.class));
            
            Field emittersField = SseEmitterService.class.getDeclaredField("emitters");
            emittersField.setAccessible(true);
            @SuppressWarnings("unchecked")
            List<SseEmitter> emitters = (List<SseEmitter>) emittersField.get(sseEmitterService);
            emitters.add(mockEmitter);

            assertThat(sseEmitterService.getClientCount()).isEqualTo(1);

            FlightEventDTO event = FlightEventDTO.builder()
                    .flightNumber("AA123")
                    .eventType(FlightEventType.GATE_CHANGE)
                    .newValue("B2")
                    .build();

            // When
            sseEmitterService.broadcast(event);

            // Then
            assertThat(sseEmitterService.getClientCount()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("getClientCount")
    class GetClientCountTests {

        @Test
        @DisplayName("should return zero when no clients connected")
        void getClientCount_ShouldReturnZero_WhenNoClients() {
            // When & Then
            assertThat(sseEmitterService.getClientCount()).isEqualTo(0);
        }

        @Test
        @DisplayName("should return correct count of connected clients")
        void getClientCount_ShouldReturnCorrectCount() {
            // Given
            sseEmitterService.createEmitter();
            sseEmitterService.createEmitter();

            // When & Then
            assertThat(sseEmitterService.getClientCount()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("sendHeartbeat")
    class SendHeartbeatTests {

        @Test
        @DisplayName("should not throw when no emitters are connected")
        void sendHeartbeat_NoEmitters_ShouldNotThrow() {
            // When & Then
            assertThatNoException().isThrownBy(() -> sseEmitterService.sendHeartbeat());
        }

        @Test
        @DisplayName("should remove dead emitters on heartbeat failure")
        void sendHeartbeat_ShouldRemoveDeadEmitters() throws Exception {
            // Given
            SseEmitter mockEmitter = mock(SseEmitter.class);
            doThrow(new IOException("Connection closed")).when(mockEmitter).send(any(SseEmitter.SseEventBuilder.class));
            
            Field emittersField = SseEmitterService.class.getDeclaredField("emitters");
            emittersField.setAccessible(true);
            @SuppressWarnings("unchecked")
            List<SseEmitter> emitters = (List<SseEmitter>) emittersField.get(sseEmitterService);
            emitters.add(mockEmitter);

            assertThat(sseEmitterService.getClientCount()).isEqualTo(1);

            // When
            sseEmitterService.sendHeartbeat();

            // Then
            assertThat(sseEmitterService.getClientCount()).isEqualTo(0);
        }
    }
}
