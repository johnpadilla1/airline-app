import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const flightService = {
  // Get all flights
  getAllFlights: async () => {
    const response = await api.get('/flights');
    return response.data;
  },

  // Get flight by ID
  getFlightById: async (id) => {
    const response = await api.get(`/flights/${id}`);
    return response.data;
  },

  // Get flight by flight number
  getFlightByNumber: async (flightNumber) => {
    const response = await api.get(`/flights/number/${flightNumber}`);
    return response.data;
  },

  // Get flights by status
  getFlightsByStatus: async (status) => {
    const response = await api.get(`/flights/status/${status}`);
    return response.data;
  },

  // Get flight events
  getFlightEvents: async (flightNumber) => {
    const response = await api.get(`/flights/${flightNumber}/events`);
    return response.data;
  },

  // Get recent events
  getRecentEvents: async () => {
    const response = await api.get('/flights/events/recent');
    return response.data;
  },

  // Get SSE stream stats
  getStreamStats: async () => {
    const response = await api.get('/flights/stream/stats');
    return response.data;
  },
};

export default flightService;
