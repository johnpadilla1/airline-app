package com.airline.config;

import com.airline.model.entity.Flight;
import com.airline.model.enums.FlightStatus;
import com.airline.repository.FlightRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final FlightRepository flightRepository;
    private final Random random = new Random();

    // Airlines with codes and full names
    private static final String[][] AIRLINES = {
            {"AA", "American Airlines"},
            {"UA", "United Airlines"},
            {"DL", "Delta Air Lines"},
            {"SW", "Southwest Airlines"},
            {"JB", "JetBlue Airways"},
            {"AS", "Alaska Airlines"},
            {"NK", "Spirit Airlines"},
            {"F9", "Frontier Airlines"}
    };

    // Airports with codes and city names
    private static final String[][] AIRPORTS = {
            {"JFK", "New York"},
            {"LAX", "Los Angeles"},
            {"ORD", "Chicago"},
            {"DFW", "Dallas"},
            {"DEN", "Denver"},
            {"SFO", "San Francisco"},
            {"SEA", "Seattle"},
            {"ATL", "Atlanta"},
            {"MIA", "Miami"},
            {"BOS", "Boston"},
            {"PHX", "Phoenix"},
            {"IAH", "Houston"},
            {"LAS", "Las Vegas"},
            {"MCO", "Orlando"},
            {"EWR", "Newark"}
    };

    // Aircraft types
    private static final String[] AIRCRAFT = {
            "Boeing 737-800",
            "Boeing 737 MAX 8",
            "Boeing 787-9",
            "Boeing 777-300ER",
            "Airbus A320",
            "Airbus A321neo",
            "Airbus A350-900",
            "Embraer E175"
    };

    // Terminals
    private static final String[] TERMINALS = {"A", "B", "C", "D", "E", "1", "2", "3"};

    @Override
    public void run(String... args) {
        if (flightRepository.count() > 0) {
            log.info("Database already contains flights. Skipping initialization.");
            return;
        }

        log.info("Initializing database with 25 sample flights...");

        List<Flight> flights = new ArrayList<>();
        LocalDateTime baseTime = LocalDateTime.now().plusHours(1).withMinute(0).withSecond(0).withNano(0);

        for (int i = 0; i < 25; i++) {
            Flight flight = createFlight(i, baseTime.plusMinutes(i * 30L));
            flights.add(flight);
        }

        flightRepository.saveAll(flights);
        log.info("Successfully initialized {} flights", flights.size());
    }

    private Flight createFlight(int index, LocalDateTime departureTime) {
        String[] airline = AIRLINES[index % AIRLINES.length];
        String[] origin = AIRPORTS[index % AIRPORTS.length];
        String[] destination = AIRPORTS[(index + 5) % AIRPORTS.length];

        // Ensure origin and destination are different
        if (origin[0].equals(destination[0])) {
            destination = AIRPORTS[(index + 7) % AIRPORTS.length];
        }

        // Flight duration between 1-6 hours
        int flightDurationMinutes = 60 + random.nextInt(300);

        // Generate realistic flight number
        String flightNumber = airline[0] + (100 + random.nextInt(900));

        // Random gate
        String gate = TERMINALS[random.nextInt(TERMINALS.length)] + (1 + random.nextInt(30));

        // Random terminal
        String terminal = TERMINALS[random.nextInt(TERMINALS.length)];

        // Initial status - weighted towards ON_TIME
        FlightStatus status = getInitialStatus(index);

        // Initial delay (only if status is DELAYED)
        int delayMinutes = 0;
        if (status == FlightStatus.DELAYED) {
            delayMinutes = 15 + random.nextInt(60);
        }

        return Flight.builder()
                .flightNumber(flightNumber)
                .airline(airline[0])
                .airlineName(airline[1])
                .origin(origin[0])
                .originCity(origin[1])
                .destination(destination[0])
                .destinationCity(destination[1])
                .scheduledDeparture(departureTime)
                .scheduledArrival(departureTime.plusMinutes(flightDurationMinutes))
                .status(status)
                .gate(gate)
                .terminal(terminal)
                .delayMinutes(delayMinutes)
                .aircraft(AIRCRAFT[random.nextInt(AIRCRAFT.length)])
                .build();
    }

    private FlightStatus getInitialStatus(int index) {
        // Ensure a good distribution of statuses with at least 8 ON_TIME flights
        // Out of 25 flights:
        // - 8 ON_TIME (indices 0-7)
        // - 4 SCHEDULED (indices 8-11)
        // - 4 BOARDING (indices 12-15)
        // - 3 IN_FLIGHT (indices 16-18)
        // - 3 DELAYED (indices 19-21)
        // - 2 LANDED (indices 22-23)
        // - 1 CANCELLED (index 24)
        
        if (index < 8) {
            return FlightStatus.ON_TIME;
        } else if (index < 12) {
            return FlightStatus.SCHEDULED;
        } else if (index < 16) {
            return FlightStatus.BOARDING;
        } else if (index < 19) {
            return FlightStatus.IN_FLIGHT;
        } else if (index < 22) {
            return FlightStatus.DELAYED;
        } else if (index < 24) {
            return FlightStatus.LANDED;
        } else {
            return FlightStatus.CANCELLED;
        }
    }
}
