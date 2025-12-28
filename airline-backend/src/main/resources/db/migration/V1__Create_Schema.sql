-- Initial schema creation for Airline Flight Tracker
-- This migration creates the flights and flight_events tables

-- Create flights table
CREATE TABLE IF NOT EXISTS flights (
    id BIGSERIAL PRIMARY KEY,
    flight_number VARCHAR(50) NOT NULL UNIQUE,
    airline VARCHAR(10) NOT NULL,
    airline_name VARCHAR(100) NOT NULL,
    origin VARCHAR(10) NOT NULL,
    origin_city VARCHAR(100) NOT NULL,
    destination VARCHAR(10) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    scheduled_departure TIMESTAMP NOT NULL,
    scheduled_arrival TIMESTAMP NOT NULL,
    actual_departure TIMESTAMP,
    actual_arrival TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    gate VARCHAR(10),
    terminal VARCHAR(10),
    delay_minutes INTEGER NOT NULL DEFAULT 0,
    aircraft VARCHAR(50),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

-- Create flight_events table
CREATE TABLE IF NOT EXISTS flight_events (
    id BIGSERIAL PRIMARY KEY,
    flight_number VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    previous_value VARCHAR(255),
    new_value VARCHAR(255),
    description TEXT,
    event_timestamp TIMESTAMP NOT NULL,
    processed_timestamp TIMESTAMP,
    flight_id BIGINT REFERENCES flights(id) ON DELETE CASCADE
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
CREATE INDEX IF NOT EXISTS idx_flight_events_flight_id ON flight_events(flight_id);

-- Add comments for documentation
COMMENT ON TABLE flights IS 'Stores flight information including schedule, status, and details';
COMMENT ON TABLE flight_events IS 'Stores event history and changes for flights';

COMMENT ON COLUMN flights.flight_number IS 'Unique flight identifier (e.g., AA123)';
COMMENT ON COLUMN flights.status IS 'Current flight status: ON_TIME, DELAYED, CANCELLED, etc.';
COMMENT ON COLUMN flights.delay_minutes IS 'Number of minutes the flight is delayed';
COMMENT ON COLUMN flight_events.event_type IS 'Type of event: STATUS_CHANGE, GATE_CHANGE, DELAY_UPDATE, etc.';
COMMENT ON COLUMN flight_events.event_timestamp IS 'When the event actually occurred';
COMMENT ON COLUMN flight_events.processed_timestamp IS 'When the event was processed/recorded';
