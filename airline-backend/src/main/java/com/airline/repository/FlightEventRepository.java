package com.airline.repository;

import com.airline.model.entity.FlightEvent;
import com.airline.model.enums.FlightEventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FlightEventRepository extends JpaRepository<FlightEvent, Long> {

    List<FlightEvent> findByFlightNumberOrderByEventTimestampDesc(String flightNumber);

    List<FlightEvent> findByFlightNumberAndEventType(String flightNumber, FlightEventType eventType);

    List<FlightEvent> findByEventTimestampAfterOrderByEventTimestampDesc(LocalDateTime timestamp);

    List<FlightEvent> findTop10ByOrderByEventTimestampDesc();

    List<FlightEvent> findByFlightIdOrderByEventTimestampDesc(Long flightId);
}
