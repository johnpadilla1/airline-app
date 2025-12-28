package com.airline.repository;

import com.airline.entity.Flight;
import com.airline.enums.FlightStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FlightRepository extends JpaRepository<Flight, Long> {

    Optional<Flight> findByFlightNumber(String flightNumber);

    List<Flight> findByStatus(FlightStatus status);

    List<Flight> findByAirline(String airline);

    List<Flight> findByOrigin(String origin);

    List<Flight> findByDestination(String destination);

    List<Flight> findByStatusNot(FlightStatus status);
}
