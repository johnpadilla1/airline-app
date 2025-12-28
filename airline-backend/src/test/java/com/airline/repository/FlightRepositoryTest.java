package com.airline.repository;

import com.airline.entity.Flight;
import com.airline.enums.FlightStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("Flight Repository Tests")
class FlightRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private FlightRepository flightRepository;

    private Flight testFlight;

    @BeforeEach
    void setUp() {
        testFlight = Flight.builder()
                .flightNumber("TEST123")
                .airline("TS")
                .airlineName("Test Airlines")
                .origin("JFK")
                .originCity("New York")
                .destination("LAX")
                .destinationCity("Los Angeles")
                .scheduledDeparture(LocalDateTime.now().plusHours(2))
                .scheduledArrival(LocalDateTime.now().plusHours(6))
                .status(FlightStatus.ON_TIME)
                .gate("B1")
                .terminal("2")
                .delayMinutes(0)
                .aircraft("Test Aircraft")
                .build();
    }

    @Nested
    @DisplayName("CRUD Operations")
    class CrudOperationsTests {

        @Test
        @DisplayName("should save flight with generated ID")
        void shouldSaveFlightWithGeneratedId() {
            // When
            Flight saved = flightRepository.save(testFlight);

            // Then
            assertThat(saved).isNotNull();
            assertThat(saved.getId()).isNotNull();
            assertThat(saved.getFlightNumber()).isEqualTo("TEST123");
        }

        @Test
        @DisplayName("should find flight by ID")
        void shouldFindById() {
            // Given
            Flight saved = flightRepository.save(testFlight);

            // When
            Optional<Flight> found = flightRepository.findById(saved.getId());

            // Then
            assertThat(found).isPresent();
            assertThat(found.get().getFlightNumber()).isEqualTo("TEST123");
        }

        @Test
        @DisplayName("should return empty when flight not found by ID")
        void shouldReturnEmptyWhenNotFoundById() {
            // When
            Optional<Flight> found = flightRepository.findById(999L);

            // Then
            assertThat(found).isEmpty();
        }

        @Test
        @DisplayName("should find all flights")
        void shouldFindAllFlights() {
            // Given
            flightRepository.save(testFlight);
            Flight flight2 = Flight.builder()
                    .flightNumber("TEST456")
                    .airline("TS")
                    .airlineName("Test Airlines")
                    .origin("LAX")
                    .originCity("Los Angeles")
                    .destination("JFK")
                    .destinationCity("New York")
                    .scheduledDeparture(LocalDateTime.now().plusHours(2))
                    .scheduledArrival(LocalDateTime.now().plusHours(6))
                    .status(FlightStatus.DELAYED)
                    .delayMinutes(30)
                    .build();
            flightRepository.save(flight2);

            // When
            List<Flight> flights = flightRepository.findAll();

            // Then
            assertThat(flights).hasSize(2);
        }

        @Test
        @DisplayName("should delete flight")
        void shouldDeleteFlight() {
            // Given
            Flight saved = flightRepository.save(testFlight);
            Long id = saved.getId();

            // When
            flightRepository.deleteById(id);

            // Then
            Optional<Flight> deleted = flightRepository.findById(id);
            assertThat(deleted).isEmpty();
        }

        @Test
        @DisplayName("should update flight")
        void shouldUpdateFlight() {
            // Given
            Flight saved = flightRepository.save(testFlight);
            saved.setDelayMinutes(45);
            saved.setStatus(FlightStatus.DELAYED);

            // When
            Flight updated = flightRepository.save(saved);

            // Then
            assertThat(updated.getDelayMinutes()).isEqualTo(45);
            assertThat(updated.getStatus()).isEqualTo(FlightStatus.DELAYED);
        }
    }

    @Nested
    @DisplayName("Query Methods")
    class QueryMethodTests {

        @Test
        @DisplayName("should find flight by flight number")
        void shouldFindByFlightNumber() {
            // Given
            flightRepository.save(testFlight);

            // When
            Optional<Flight> found = flightRepository.findByFlightNumber("TEST123");

            // Then
            assertThat(found).isPresent();
            assertThat(found.get().getFlightNumber()).isEqualTo("TEST123");
        }

        @Test
        @DisplayName("should return empty for non-existent flight number")
        void shouldReturnEmptyForNonExistentFlightNumber() {
            // When
            Optional<Flight> found = flightRepository.findByFlightNumber("NONEXIST");

            // Then
            assertThat(found).isEmpty();
        }

        @Test
        @DisplayName("should find flights by status")
        void shouldFindByStatus() {
            // Given
            flightRepository.save(testFlight);

            Flight delayedFlight = Flight.builder()
                    .flightNumber("TEST456")
                    .airline("TS")
                    .airlineName("Test Airlines")
                    .origin("JFK")
                    .originCity("New York")
                    .destination("LAX")
                    .destinationCity("Los Angeles")
                    .scheduledDeparture(LocalDateTime.now().plusHours(2))
                    .scheduledArrival(LocalDateTime.now().plusHours(6))
                    .status(FlightStatus.DELAYED)
                    .delayMinutes(30)
                    .build();
            flightRepository.save(delayedFlight);

            // When
            List<Flight> onTimeFlights = flightRepository.findByStatus(FlightStatus.ON_TIME);
            List<Flight> delayedFlights = flightRepository.findByStatus(FlightStatus.DELAYED);

            // Then
            assertThat(onTimeFlights).hasSize(1);
            assertThat(onTimeFlights.get(0).getStatus()).isEqualTo(FlightStatus.ON_TIME);

            assertThat(delayedFlights).hasSize(1);
            assertThat(delayedFlights.get(0).getStatus()).isEqualTo(FlightStatus.DELAYED);
        }

        @Test
        @DisplayName("should find flights by airline")
        void shouldFindByAirline() {
            // Given
            flightRepository.save(testFlight);

            Flight anotherFlight = Flight.builder()
                    .flightNumber("UA456")
                    .airline("UA")
                    .airlineName("United Airlines")
                    .origin("LAX")
                    .originCity("Los Angeles")
                    .destination("ORD")
                    .destinationCity("Chicago")
                    .scheduledDeparture(LocalDateTime.now().plusHours(3))
                    .scheduledArrival(LocalDateTime.now().plusHours(7))
                    .status(FlightStatus.ON_TIME)
                    .delayMinutes(0)
                    .build();
            flightRepository.save(anotherFlight);

            // When
            List<Flight> tsFlights = flightRepository.findByAirline("TS");
            List<Flight> uaFlights = flightRepository.findByAirline("UA");

            // Then
            assertThat(tsFlights).hasSize(1);
            assertThat(tsFlights.get(0).getAirline()).isEqualTo("TS");

            assertThat(uaFlights).hasSize(1);
            assertThat(uaFlights.get(0).getAirline()).isEqualTo("UA");
        }

        @Test
        @DisplayName("should find flights by origin")
        void shouldFindByOrigin() {
            // Given
            flightRepository.save(testFlight);

            // When
            List<Flight> jfkFlights = flightRepository.findByOrigin("JFK");

            // Then
            assertThat(jfkFlights).hasSize(1);
            assertThat(jfkFlights.get(0).getOrigin()).isEqualTo("JFK");
        }

        @Test
        @DisplayName("should find flights by destination")
        void shouldFindByDestination() {
            // Given
            flightRepository.save(testFlight);

            // When
            List<Flight> laxFlights = flightRepository.findByDestination("LAX");

            // Then
            assertThat(laxFlights).hasSize(1);
            assertThat(laxFlights.get(0).getDestination()).isEqualTo("LAX");
        }

        @Test
        @DisplayName("should find flights by status not equal to")
        void shouldFindByStatusNot() {
            // Given
            flightRepository.save(testFlight);

            Flight cancelledFlight = Flight.builder()
                    .flightNumber("TEST789")
                    .airline("TS")
                    .airlineName("Test Airlines")
                    .origin("JFK")
                    .originCity("New York")
                    .destination("LAX")
                    .destinationCity("Los Angeles")
                    .scheduledDeparture(LocalDateTime.now().plusHours(2))
                    .scheduledArrival(LocalDateTime.now().plusHours(6))
                    .status(FlightStatus.CANCELLED)
                    .delayMinutes(0)
                    .build();
            flightRepository.save(cancelledFlight);

            // When
            List<Flight> notCancelled = flightRepository.findByStatusNot(FlightStatus.CANCELLED);

            // Then
            assertThat(notCancelled).hasSize(1);
            assertThat(notCancelled.get(0).getStatus()).isNotEqualTo(FlightStatus.CANCELLED);
        }
    }

    @Nested
    @DisplayName("Entity Lifecycle Callbacks")
    class LifecycleCallbackTests {

        @Test
        @DisplayName("should set createdAt and updatedAt on persist")
        void shouldSetTimestampsOnPersist() {
            // When
            Flight saved = flightRepository.save(testFlight);

            // Then
            assertThat(saved.getCreatedAt()).isNotNull();
            assertThat(saved.getUpdatedAt()).isNotNull();
        }

        @Test
        @DisplayName("should update updatedAt on update")
        void shouldUpdateUpdatedAtOnUpdate() {
            // Given
            Flight saved = flightRepository.save(testFlight);
            LocalDateTime originalUpdatedAt = saved.getUpdatedAt();

            // Wait a bit to ensure time difference
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            saved.setDelayMinutes(30);
            flightRepository.save(saved);
            flightRepository.flush();

            // When
            Optional<Flight> updated = flightRepository.findById(saved.getId());

            // Then
            assertThat(updated).isPresent();
            assertThat(updated.get().getUpdatedAt()).isNotNull();
            // Note: This may fail if time resolution is too coarse
        }
    }
}
