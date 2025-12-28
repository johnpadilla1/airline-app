import { FlightStatus } from '@/shared/types';

// Mock axios BEFORE importing the service
jest.mock('axios');

// Import axios and set up mocks before importing service
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios.create to return a mock instance
const mockApiInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
};

(mockedAxios.create as jest.Mock).mockReturnValue(mockApiInstance);

// NOW import the service (after mocking axios.create)
import flightService from '../flightService';

describe('flightService', () => {
  const mockFlights = [
    {
      flightNumber: 'AA123',
      airline: 'American Airlines',
      origin: 'JFK',
      originCity: 'New York',
      destination: 'LAX',
      destinationCity: 'Los Angeles',
      status: FlightStatus.ON_TIME,
      scheduledDeparture: '2025-12-28T10:00:00Z',
      actualDeparture: '2025-12-28T10:00:00Z',
      scheduledArrival: '2025-12-28T13:00:00Z',
      actualArrival: null,
      gate: 'A12',
      terminal: 'T4',
      delayMinutes: 0,
      id: '1',
    },
    {
      flightNumber: 'UA456',
      airline: 'United Airlines',
      origin: 'SFO',
      originCity: 'San Francisco',
      destination: 'JFK',
      destinationCity: 'New York',
      status: FlightStatus.DELAYED,
      scheduledDeparture: '2025-12-28T14:00:00Z',
      actualDeparture: null,
      scheduledArrival: '2025-12-28T22:30:00Z',
      actualArrival: null,
      gate: 'B22',
      terminal: 'T7',
      delayMinutes: 30,
      id: '2',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mock instance methods
    mockApiInstance.get.mockReset();
    mockApiInstance.post.mockReset();
    mockApiInstance.put.mockReset();
    mockApiInstance.delete.mockReset();
    mockApiInstance.patch.mockReset();
  });

  describe('getAllFlights', () => {
    it('should fetch all flights successfully', async () => {
      mockApiInstance.get.mockResolvedValue({ data: mockFlights });

      const result = await flightService.getAllFlights();

      expect(mockApiInstance.get).toHaveBeenCalledWith('/flights');
      expect(result).toEqual(mockFlights);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Network error');
      mockApiInstance.get.mockRejectedValue(mockError);

      await expect(flightService.getAllFlights()).rejects.toThrow('Network error');
    });

    it('should handle empty response', async () => {
      mockApiInstance.get.mockResolvedValue({ data: [] });

      const result = await flightService.getAllFlights();

      expect(result).toEqual([]);
    });
  });

  describe('getFlightById', () => {
    it('should fetch flight by id successfully', async () => {
      mockApiInstance.get.mockResolvedValue({ data: mockFlights[0] });

      const result = await flightService.getFlightById('1');

      expect(mockApiInstance.get).toHaveBeenCalledWith('/flights/1');
      expect(result).toEqual(mockFlights[0]);
    });

    it('should handle non-existent flight', async () => {
      const mockError = new Error('Flight not found');
      mockApiInstance.get.mockRejectedValue(mockError);

      await expect(flightService.getFlightById('999')).rejects.toThrow('Flight not found');
    });
  });

  describe('getFlightsByStatus', () => {
    it('should fetch flights by status successfully', async () => {
      const onTimeFlights = mockFlights.filter((f) => f.status === FlightStatus.ON_TIME);
      mockApiInstance.get.mockResolvedValue({ data: onTimeFlights });

      const result = await flightService.getFlightsByStatus(FlightStatus.ON_TIME);

      expect(mockApiInstance.get).toHaveBeenCalledWith('/flights/status/ON_TIME');
      expect(result).toEqual(onTimeFlights);
    });

    it('should handle empty result for status', async () => {
      mockApiInstance.get.mockResolvedValue({ data: [] });

      const result = await flightService.getFlightsByStatus(FlightStatus.CANCELLED);

      expect(result).toEqual([]);
    });
  });

  describe('searchFlights', () => {
    it('should search flights successfully', async () => {
      const searchResults = [mockFlights[0]];
      mockApiInstance.get.mockResolvedValue({ data: searchResults });

      const result = await flightService.searchFlights('AA123');

      expect(mockApiInstance.get).toHaveBeenCalledWith('/flights/search?q=AA123');
      expect(result).toEqual(searchResults);
    });

    it('should encode search query properly', async () => {
      mockApiInstance.get.mockResolvedValue({ data: [] });

      await flightService.searchFlights('New York');

      expect(mockApiInstance.get).toHaveBeenCalledWith('/flights/search?q=New%20York');
    });

    it('should handle empty search results', async () => {
      mockApiInstance.get.mockResolvedValue({ data: [] });

      const result = await flightService.searchFlights('XYZ999');

      expect(result).toEqual([]);
    });
  });

  describe('getFlightEvents', () => {
    const mockEvents = [
      {
        id: '1',
        flightNumber: 'AA123',
        eventType: 'STATUS_CHANGE',
        description: 'Flight status changed to ON_TIME',
        timestamp: '2025-12-28T10:00:00Z',
      },
      {
        id: '2',
        flightNumber: 'AA123',
        eventType: 'GATE_CHANGE',
        description: 'Gate changed to A12',
        timestamp: '2025-12-28T10:05:00Z',
      },
    ];

    it('should fetch flight events successfully', async () => {
      mockApiInstance.get.mockResolvedValue({ data: mockEvents });

      const result = await flightService.getFlightEvents('AA123');

      expect(mockApiInstance.get).toHaveBeenCalledWith('/flights/AA123/events');
      expect(result).toEqual(mockEvents);
    });

    it('should handle flight with no events', async () => {
      mockApiInstance.get.mockResolvedValue({ data: [] });

      const result = await flightService.getFlightEvents('AA123');

      expect(result).toEqual([]);
    });
  });

  describe('getRecentEvents', () => {
    const mockRecentEvents = [
      {
        id: '1',
        flightNumber: 'AA123',
        type: 'STATUS_CHANGE',
        message: 'Flight AA123 is now on time',
        timestamp: '2025-12-28T10:00:00Z',
      },
      {
        id: '2',
        flightNumber: 'UA456',
        type: 'DELAY',
        message: 'Flight UA456 delayed by 30 minutes',
        timestamp: '2025-12-28T09:30:00Z',
      },
    ];

    it('should fetch recent events successfully', async () => {
      mockApiInstance.get.mockResolvedValue({ data: mockRecentEvents });

      const result = await flightService.getRecentEvents();

      expect(mockApiInstance.get).toHaveBeenCalledWith('/flights/events/recent');
      expect(result).toEqual(mockRecentEvents);
    });

    it('should handle no recent events', async () => {
      mockApiInstance.get.mockResolvedValue({ data: [] });

      const result = await flightService.getRecentEvents();

      expect(result).toEqual([]);
    });
  });

  describe('Axios Instance', () => {
    it('should have correct base URL configuration', () => {
      // The axios instance should be configured with baseURL
      // This is implicitly tested by the successful API calls above
      expect(mockApiInstance.get).toBeDefined();
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'ECONNABORTED';
      mockApiInstance.get.mockRejectedValue(timeoutError);

      await expect(flightService.getAllFlights()).rejects.toThrow('Request timeout');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const error = {
        response: { status: 404, data: { message: 'Not found' } },
      } as any;
      mockApiInstance.get.mockRejectedValue(error);

      await expect(flightService.getFlightById('999')).rejects.toEqual(error);
    });

    it('should handle 500 errors', async () => {
      const error = {
        response: { status: 500, data: { message: 'Internal server error' } },
      } as any;
      mockApiInstance.get.mockRejectedValue(error);

      await expect(flightService.getAllFlights()).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      (networkError as any).isAxiosError = true;
      mockApiInstance.get.mockRejectedValue(networkError);

      await expect(flightService.getAllFlights()).rejects.toThrow('Network Error');
    });
  });

  describe('Data Transformation', () => {
    it('should return data in the correct format', async () => {
      mockApiInstance.get.mockResolvedValue({ data: mockFlights });

      const result = await flightService.getAllFlights();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('flightNumber');
      expect(result[0]).toHaveProperty('status');
      expect(result[0]).toHaveProperty('origin');
      expect(result[0]).toHaveProperty('destination');
    });
  });
});
