-- Initial schema for airline backend
-- This migration creates the base tables for flights and flight events

-- Create flights table
CREATE TABLE IF NOT EXISTS flights (
    id BIGSERIAL PRIMARY KEY,
    flight_number VARCHAR(10) NOT NULL UNIQUE,
    airline VARCHAR(10) NOT NULL,
    airline_name VARCHAR(255) NOT NULL,
    origin VARCHAR(3) NOT NULL,
    origin_city VARCHAR(255) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    destination_city VARCHAR(255) NOT NULL,
    scheduled_departure TIMESTAMP NOT NULL,
    scheduled_arrival TIMESTAMP NOT NULL,
    actual_departure TIMESTAMP,
    actual_arrival TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    gate VARCHAR(10),
    terminal VARCHAR(10),
    delay_minutes INTEGER DEFAULT 0,
    aircraft VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Create flight_events table
CREATE TABLE IF NOT EXISTS flight_events (
    id BIGSERIAL PRIMARY KEY,
    flight_number VARCHAR(10) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    previous_value VARCHAR(255),
    new_value VARCHAR(255),
    description VARCHAR(500),
    event_timestamp TIMESTAMP NOT NULL,
    processed_timestamp TIMESTAMP NOT NULL,
    flight_id BIGINT,
    CONSTRAINT fk_flight_events_flight FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_flights_flight_number ON flights(flight_number);
CREATE INDEX IF NOT EXISTS idx_flights_status ON flights(status);
CREATE INDEX IF NOT EXISTS idx_flights_airline ON flights(airline);
CREATE INDEX IF NOT EXISTS idx_flights_origin ON flights(origin);
CREATE INDEX IF NOT EXISTS idx_flights_destination ON flights(destination);
CREATE INDEX IF NOT EXISTS idx_flights_scheduled_departure ON flights(scheduled_departure);

CREATE INDEX IF NOT EXISTS idx_flight_events_flight_number ON flight_events(flight_number);
CREATE INDEX IF NOT EXISTS idx_flight_events_event_timestamp ON flight_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_flight_events_processed_timestamp ON flight_events(processed_timestamp DESC);
