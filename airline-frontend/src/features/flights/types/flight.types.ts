/**
 * Flight status enumeration
 * Represents all possible states of a flight in the system
 */
export enum FlightStatus {
  SCHEDULED = 'SCHEDULED',
  ON_TIME = 'ON_TIME',
  BOARDING = 'BOARDING',
  DEPARTED = 'DEPARTED',
  IN_FLIGHT = 'IN_FLIGHT',
  LANDED = 'LANDED',
  ARRIVED = 'ARRIVED',
  DELAYED = 'DELAYED',
  CANCELLED = 'CANCELLED',
}

/**
 * Flight data interface
 * Represents a complete flight with all relevant information
 */
export interface Flight {
  /** Unique flight identifier (e.g., "AA1234") */
  flightNumber: string;
  /** Airline name */
  airline: string;
  /** Origin airport code (e.g., "JFK") */
  origin: string;
  /** Origin city name */
  originCity: string;
  /** Destination airport code (e.g., "LAX") */
  destination: string;
  /** Destination city name */
  destinationCity: string;
  /** Current flight status */
  status: FlightStatus;
  /** Scheduled departure time (ISO 8601) */
  scheduledDeparture: string;
  /** Actual departure time (ISO 8601) - null if not departed */
  actualDeparture: string | null;
  /** Scheduled arrival time (ISO 8601) */
  scheduledArrival: string;
  /** Actual arrival time (ISO 8601) - null if not arrived */
  actualArrival: string | null;
  /** Gate number */
  gate: string | null;
  /** Terminal number */
  terminal: string | null;
  /** Delay in minutes (0 if not delayed) */
  delayMinutes: number;
  /** Aircraft type (e.g., "Boeing 737") */
  aircraft?: string;
  /** Check-in desk number */
  checkInDesk?: string;
  /** Baggage claim carousel number */
  baggageClaim?: string;
  /** Flight ID (unique database identifier) */
  id?: string;
}

/**
 * Flight event interface
 * Represents an event/update for a specific flight
 */
export interface FlightEvent {
  /** Unique event identifier */
  id: string;
  /** Associated flight number */
  flightNumber: string;
  /** Event type */
  eventType: string;
  /** Event description */
  description: string;
  /** Timestamp when event occurred (ISO 8601) */
  timestamp: string;
  /** Previous value (for change events) */
  previousValue?: string;
  /** New value (for change events) */
  newValue?: string;
  /** Additional event metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Recent event interface for event ticker
 */
export interface RecentEvent {
  /** Event identifier */
  id: string;
  /** Flight number */
  flightNumber: string;
  /** Event type */
  type: string;
  /** Event message */
  message: string;
  /** Timestamp */
  timestamp: string;
}

/**
 * SSE Event data interface
 * Server-Sent Events payload structure
 */
export interface SSEFlightUpdate {
  type: 'FLIGHT_UPDATE' | 'heartbeat' | 'connected';
  data?: Flight;
  flightNumber?: string;
  timestamp?: string;
}

/**
 * Flight statistics interface
 */
export interface FlightStats {
  total: number;
  onTime: number;
  scheduled: number;
  boarding: number;
  inFlight: number;
  delayed: number;
  cancelled: number;
  landed: number;
}

/**
 * Flight filters interface
 */
export interface FlightFilters {
  /** Search query string */
  searchQuery: string;
  /** Status filter */
  statusFilter: FlightStatus | 'all';
}

/**
 * Flight update function type
 * Used for optimistic updates
 */
export type FlightUpdateFunction = (flight: Flight) => Flight;
