package com.airline.flight.repository;

import com.airline.model.entity.FlightEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlightEventRepository extends JpaRepository<FlightEvent, Long> {
    List<FlightEvent> findByFlightIdOrderByCreatedAtDesc(Long flightId);
    List<FlightEvent> findTop5ByFlightIdOrderByCreatedAtDesc(Long flightId);
    List<FlightEvent> findTop20ByOrderByCreatedAtDesc();
}
