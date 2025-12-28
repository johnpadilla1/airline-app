import axios, { AxiosInstance } from 'axios';
import { Flight, FlightEvent, RecentEvent } from '@/shared/types';

/**
 * Flight Service
 * Handles all flight-related API calls with full TypeScript type safety
 */

const API_BASE_URL = '/api';

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Flight Service API
 * Provides methods for interacting with flight data
 */
export const flightService = {
  /**
   * Get all flights
   * @returns Promise<Flight[]> Array of all flights
   */
  getAllFlights: async (): Promise<Flight[]> => {
    const response = await api.get<Flight[]>('/flights');
    return response.data;
  },

  /**
   * Get flight by database ID
   * @param id - Flight ID
   * @returns Promise<Flight> Flight object
   */
  getFlightById: async (id: string): Promise<Flight> => {
    const response = await api.get<Flight>(`/flights/${id}`);
    return response.data;
  },

  /**
   * Get flight by flight number
   * @param flightNumber - Flight number (e.g., "AA1234")
   * @returns Promise<Flight> Flight object
   */
  getFlightByNumber: async (flightNumber: string): Promise<Flight> => {
    const response = await api.get<Flight>(`/flights/number/${flightNumber}`);
    return response.data;
  },

  /**
   * Get flights by status
   * @param status - Flight status filter
   * @returns Promise<Flight[]> Array of flights matching the status
   */
  getFlightsByStatus: async (status: string): Promise<Flight[]> => {
    const response = await api.get<Flight[]>(`/flights/status/${status}`);
    return response.data;
  },

  /**
   * Search flights by query
   * @param query - Search query (flight number, origin, destination, etc.)
   * @returns Promise<Flight[]> Array of flights matching the search query
   */
  searchFlights: async (query: string): Promise<Flight[]> => {
    const encodedQuery = encodeURIComponent(query);
    const response = await api.get<Flight[]>(`/flights/search?q=${encodedQuery}`);
    return response.data;
  },

  /**
   * Get flight events/history
   * @param flightNumber - Flight number
   * @returns Promise<FlightEvent[]> Array of flight events
   */
  getFlightEvents: async (flightNumber: string): Promise<FlightEvent[]> => {
    const response = await api.get<FlightEvent[]>(`/flights/${flightNumber}/events`);
    return response.data;
  },

  /**
   * Get recent flight events
   * @returns Promise<RecentEvent[]> Array of recent events
   */
  getRecentEvents: async (): Promise<RecentEvent[]> => {
    const response = await api.get<RecentEvent[]>('/flights/events/recent');
    return response.data;
  },

  /**
   * Get SSE stream statistics
   * @returns Promise with stream stats
   */
  getStreamStats: async (): Promise<Record<string, unknown>> => {
    const response = await api.get<Record<string, unknown>>('/flights/stream/stats');
    return response.data;
  },
};

export default flightService;
