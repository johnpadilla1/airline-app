import { Flight, FlightEvent, RecentEvent } from './flight.types';

/**
 * API response wrapper
 * Standard response format for all API calls
 */
export interface ApiResponse<T> {
  /** Response data */
  data: T;
  /** Response status code */
  status: number;
  /** Response status message */
  message?: string;
}

/**
 * API error response
 */
export interface ApiError {
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** HTTP status code */
  status?: number;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Data items */
  data: T[];
  /** Current page number */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Flight service API interface
 * Defines all flight-related API operations
 */
export interface FlightServiceApi {
  /** Get all flights */
  getAllFlights(): Promise<Flight[]>;
  /** Get flight by ID */
  getFlightById(id: string): Promise<Flight>;
  /** Get flights by status */
  getFlightsByStatus(status: string): Promise<Flight[]>;
  /** Search flights */
  searchFlights(query: string): Promise<Flight[]>;
  /** Get flight events */
  getFlightEvents(flightNumber: string): Promise<FlightEvent[]>;
  /** Get recent events */
  getRecentEvents(): Promise<RecentEvent[]>;
}

/**
 * Chat message interface
 */
export interface ChatMessage {
  /** Message ID */
  id: string;
  /** Message content */
  content: string;
  /** Message role */
  role: 'user' | 'assistant' | 'system';
  /** Timestamp */
  timestamp: string;
  /** Whether message is streaming */
  isStreaming?: boolean;
  /** SQL query if present */
  sqlQuery?: string;
}

/**
 * Chat service API interface
 */
export interface ChatServiceApi {
  /** Send chat message */
  sendMessage(message: string, history: ChatMessage[]): Promise<ReadableStream>;
  /** Clear chat history */
  clearHistory(): Promise<void>;
}

/**
 * Query keys for React Query
 * Provides type-safe query key factory
 */
export interface QueryKeys {
  flights: ['flights'];
  flight: (id: string) => ['flight', string];
  flightEvents: (flightNumber: string) => ['flightEvents', string];
  recentEvents: ['recentEvents'];
  latestEvent: ['latestEvent'];
}

/**
 * React Query options type
 */
export interface QueryOptions<T> {
  /** Query key */
  queryKey: readonly unknown[];
  /** Query function */
  queryFn: () => Promise<T>;
  /** Enable/disable query */
  enabled?: boolean;
  /** Refetch interval in ms */
  refetchInterval?: number;
  /** Stale time in ms */
  staleTime?: number;
  /** Cache time in ms */
  gcTime?: number;
}
