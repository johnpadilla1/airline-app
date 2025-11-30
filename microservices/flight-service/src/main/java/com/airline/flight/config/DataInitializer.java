package com.airline.flight.config;

import com.airline.model.entity.Flight;
import com.airline.model.enums.FlightStatus;
import com.airline.flight.repository.FlightRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final FlightRepository flightRepository;

    @Override
    public void run(String... args) {
        if (flightRepository.count() == 0) {
            log.info("Initializing flight data...");
            initializeFlights();
            log.info("Flight data initialized with {} flights", flightRepository.count());
        } else {
            log.info("Flight data already exists ({} flights)", flightRepository.count());
        }
    }

    private void initializeFlights() {
        LocalDateTime now = LocalDateTime.now();

        List<Flight> flights = List.of(
            createFlight("AA274", "AA", "American Airlines", "JFK", "New York", "SFO", "San Francisco",
                    now.plusHours(1), now.plusHours(4).plusMinutes(53), FlightStatus.ON_TIME, "25", "B", "Embraer E175"),
            createFlight("UA490", "UA", "United Airlines", "LAX", "Los Angeles", "ORD", "Chicago",
                    now.plusHours(2), now.plusHours(5).plusMinutes(32), FlightStatus.ON_TIME, "42", "7", "Boeing 737-900"),
            createFlight("DL1089", "DL", "Delta Air Lines", "ATL", "Atlanta", "BOS", "Boston",
                    now.plusMinutes(30), now.plusHours(3).plusMinutes(5), FlightStatus.BOARDING, "18", "S", "Airbus A321"),
            createFlight("SW2456", "WN", "Southwest Airlines", "DEN", "Denver", "PHX", "Phoenix",
                    now.plusHours(3), now.plusHours(5).plusMinutes(15), FlightStatus.ON_TIME, "C24", "C", "Boeing 737 MAX 8"),
            createFlight("AA891", "AA", "American Airlines", "MIA", "Miami", "DFW", "Dallas",
                    now.plusHours(1).plusMinutes(30), now.plusHours(4).plusMinutes(45), FlightStatus.ON_TIME, "D12", "D", "Boeing 787-9"),
            createFlight("UA223", "UA", "United Airlines", "SFO", "San Francisco", "SEA", "Seattle",
                    now.plusMinutes(45), now.plusHours(2).plusMinutes(30), FlightStatus.BOARDING, "87", "3", "Airbus A320"),
            createFlight("DL567", "DL", "Delta Air Lines", "MSP", "Minneapolis", "DTW", "Detroit",
                    now.minusHours(1), now.plusHours(1), FlightStatus.IN_FLIGHT, "G5", "G", "Boeing 717-200"),
            createFlight("JB422", "B6", "JetBlue Airways", "BOS", "Boston", "FLL", "Fort Lauderdale",
                    now.plusHours(4), now.plusHours(7).plusMinutes(30), FlightStatus.SCHEDULED, "C32", "C", "Airbus A321neo"),
            createFlight("AS109", "AS", "Alaska Airlines", "SEA", "Seattle", "ANC", "Anchorage",
                    now.plusHours(2).plusMinutes(15), now.plusHours(5).plusMinutes(45), FlightStatus.ON_TIME, "N8", "N", "Boeing 737-900ER"),
            createFlight("F9876", "F9", "Frontier Airlines", "DEN", "Denver", "LAS", "Las Vegas",
                    now.plusMinutes(20), now.plusHours(2).plusMinutes(5), FlightStatus.DELAYED, "B45", "B", "Airbus A320neo"),
            createFlight("NK234", "NK", "Spirit Airlines", "FLL", "Fort Lauderdale", "ATL", "Atlanta",
                    now.plusHours(5), now.plusHours(7).plusMinutes(15), FlightStatus.SCHEDULED, "H2", "H", "Airbus A321"),
            createFlight("WN789", "WN", "Southwest Airlines", "MDW", "Chicago Midway", "BWI", "Baltimore",
                    now.minusMinutes(30), now.plusHours(2).plusMinutes(10), FlightStatus.IN_FLIGHT, "A5", "A", "Boeing 737-800"),
            createFlight("AA456", "AA", "American Airlines", "DFW", "Dallas", "LAX", "Los Angeles",
                    now.minusHours(3), now.minusHours(1), FlightStatus.LANDED, "A22", "A", "Airbus A321neo"),
            createFlight("DL890", "DL", "Delta Air Lines", "JFK", "New York", "ATL", "Atlanta",
                    now.plusMinutes(90), now.plusHours(4), FlightStatus.ON_TIME, "B8", "4", "Boeing 757-200"),
            createFlight("UA678", "UA", "United Airlines", "ORD", "Chicago", "DEN", "Denver",
                    now.plusHours(6), now.plusHours(8).plusMinutes(30), FlightStatus.SCHEDULED, "C15", "1", "Boeing 737 MAX 9"),
            createFlight("JB199", "B6", "JetBlue Airways", "JFK", "New York", "LAX", "Los Angeles",
                    now.plusMinutes(15), now.plusHours(5).plusMinutes(45), FlightStatus.DELAYED, "22", "5", "Airbus A321LR"),
            createFlight("AS445", "AS", "Alaska Airlines", "PDX", "Portland", "SFO", "San Francisco",
                    now.plusHours(3).plusMinutes(30), now.plusHours(5), FlightStatus.ON_TIME, "D3", "D", "Embraer E175"),
            createFlight("HA28", "HA", "Hawaiian Airlines", "HNL", "Honolulu", "LAX", "Los Angeles",
                    now.minusHours(2), now.plusHours(3), FlightStatus.IN_FLIGHT, "33", "2", "Airbus A330-200"),
            createFlight("AA1234", "AA", "American Airlines", "PHX", "Phoenix", "JFK", "New York",
                    now.plusHours(1).plusMinutes(15), now.plusHours(6), FlightStatus.ON_TIME, "E7", "4", "Boeing 787-8"),
            createFlight("DL333", "DL", "Delta Air Lines", "SLC", "Salt Lake City", "LAX", "Los Angeles",
                    now.minusHours(4), now.minusHours(2), FlightStatus.LANDED, "F12", "2", "Airbus A319"),
            createFlight("UA999", "UA", "United Airlines", "EWR", "Newark", "SFO", "San Francisco",
                    now.plusHours(2).plusMinutes(45), now.plusHours(6).plusMinutes(30), FlightStatus.ON_TIME, "71", "A", "Boeing 777-200"),
            createFlight("SW111", "WN", "Southwest Airlines", "HOU", "Houston Hobby", "DAL", "Dallas Love",
                    now.plusMinutes(50), now.plusHours(2), FlightStatus.BOARDING, "12", "A", "Boeing 737-700"),
            createFlight("NK567", "NK", "Spirit Airlines", "LAS", "Las Vegas", "DFW", "Dallas",
                    now.plusHours(4).plusMinutes(30), now.plusHours(7).plusMinutes(45), FlightStatus.SCHEDULED, "D8", "D", "Airbus A320neo"),
            createFlight("F9123", "F9", "Frontier Airlines", "PHX", "Phoenix", "DEN", "Denver",
                    now.plusHours(1).plusMinutes(45), now.plusHours(4), FlightStatus.CANCELLED, "C33", "3", "Airbus A321"),
            createFlight("AS789", "AS", "Alaska Airlines", "LAX", "Los Angeles", "SEA", "Seattle",
                    now.plusHours(5).plusMinutes(15), now.plusHours(7).plusMinutes(45), FlightStatus.BOARDING, "45B", "B", "Boeing 737-900")
        );

        flightRepository.saveAll(flights);
    }

    private Flight createFlight(String flightNumber, String airline, String airlineName,
                                String origin, String originCity, String destination, String destinationCity,
                                LocalDateTime scheduledDeparture, LocalDateTime scheduledArrival,
                                FlightStatus status, String gate, String terminal, String aircraft) {
        return Flight.builder()
                .flightNumber(flightNumber)
                .airline(airline)
                .airlineName(airlineName)
                .origin(origin)
                .originCity(originCity)
                .destination(destination)
                .destinationCity(destinationCity)
                .scheduledDeparture(scheduledDeparture)
                .scheduledArrival(scheduledArrival)
                .status(status)
                .gate(gate)
                .terminal(terminal)
                .delayMinutes(status == FlightStatus.DELAYED ? 30 : 0)
                .aircraft(aircraft)
                .build();
    }
}
