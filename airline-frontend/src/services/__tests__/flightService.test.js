import axios from 'axios';
import flightService from '../flightService';

// Mock axios
jest.mock('axios', () => ({
    create: jest.fn(() => ({
        get: jest.fn(),
    })),
}));

describe('flightService', () => {
    let mockApi;

    beforeEach(() => {
        // Reset mock and create fresh instance
        jest.clearAllMocks();
        mockApi = {
            get: jest.fn(),
        };
        axios.create.mockReturnValue(mockApi);
    });

    describe('API Configuration', () => {
        it('creates axios instance with correct base URL', () => {
            // Re-import to trigger axios.create
            jest.isolateModules(() => {
                require('../flightService');
            });

            expect(axios.create).toHaveBeenCalledWith({
                baseURL: '/api',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        });
    });

    describe('getAllFlights', () => {
        it('calls correct endpoint', async () => {
            const mockFlights = [
                { id: 1, flightNumber: 'AA123' },
                { id: 2, flightNumber: 'UA456' },
            ];

            // Need to re-import to use fresh mock
            jest.isolateModules(async () => {
                const mockApiInstance = {
                    get: jest.fn().mockResolvedValue({ data: mockFlights }),
                };
                axios.create.mockReturnValue(mockApiInstance);

                const { flightService: service } = require('../flightService');

                const result = await service.getAllFlights();

                expect(mockApiInstance.get).toHaveBeenCalledWith('/flights');
                expect(result).toEqual(mockFlights);
            });
        });
    });

    describe('getFlightById', () => {
        it('calls correct endpoint with flight ID', async () => {
            jest.isolateModules(async () => {
                const mockFlight = { id: 1, flightNumber: 'AA123' };
                const mockApiInstance = {
                    get: jest.fn().mockResolvedValue({ data: mockFlight }),
                };
                axios.create.mockReturnValue(mockApiInstance);

                const { flightService: service } = require('../flightService');

                const result = await service.getFlightById(1);

                expect(mockApiInstance.get).toHaveBeenCalledWith('/flights/1');
                expect(result).toEqual(mockFlight);
            });
        });
    });

    describe('getFlightByNumber', () => {
        it('calls correct endpoint with flight number', async () => {
            jest.isolateModules(async () => {
                const mockFlight = { id: 1, flightNumber: 'AA123' };
                const mockApiInstance = {
                    get: jest.fn().mockResolvedValue({ data: mockFlight }),
                };
                axios.create.mockReturnValue(mockApiInstance);

                const { flightService: service } = require('../flightService');

                const result = await service.getFlightByNumber('AA123');

                expect(mockApiInstance.get).toHaveBeenCalledWith('/flights/number/AA123');
                expect(result).toEqual(mockFlight);
            });
        });
    });

    describe('getFlightsByStatus', () => {
        it('calls correct endpoint with status', async () => {
            jest.isolateModules(async () => {
                const mockFlights = [{ id: 1, flightNumber: 'AA123', status: 'DELAYED' }];
                const mockApiInstance = {
                    get: jest.fn().mockResolvedValue({ data: mockFlights }),
                };
                axios.create.mockReturnValue(mockApiInstance);

                const { flightService: service } = require('../flightService');

                const result = await service.getFlightsByStatus('DELAYED');

                expect(mockApiInstance.get).toHaveBeenCalledWith('/flights/status/DELAYED');
                expect(result).toEqual(mockFlights);
            });
        });
    });

    describe('getFlightEvents', () => {
        it('calls correct endpoint with flight number', async () => {
            jest.isolateModules(async () => {
                const mockEvents = [
                    { id: 1, eventType: 'DELAY' },
                    { id: 2, eventType: 'GATE_CHANGE' },
                ];
                const mockApiInstance = {
                    get: jest.fn().mockResolvedValue({ data: mockEvents }),
                };
                axios.create.mockReturnValue(mockApiInstance);

                const { flightService: service } = require('../flightService');

                const result = await service.getFlightEvents('AA123');

                expect(mockApiInstance.get).toHaveBeenCalledWith('/flights/AA123/events');
                expect(result).toEqual(mockEvents);
            });
        });
    });

    describe('getRecentEvents', () => {
        it('calls correct endpoint', async () => {
            jest.isolateModules(async () => {
                const mockEvents = [
                    { id: 1, eventType: 'DELAY', flightNumber: 'AA123' },
                ];
                const mockApiInstance = {
                    get: jest.fn().mockResolvedValue({ data: mockEvents }),
                };
                axios.create.mockReturnValue(mockApiInstance);

                const { flightService: service } = require('../flightService');

                const result = await service.getRecentEvents();

                expect(mockApiInstance.get).toHaveBeenCalledWith('/flights/events/recent');
                expect(result).toEqual(mockEvents);
            });
        });
    });

    describe('getStreamStats', () => {
        it('calls correct endpoint', async () => {
            jest.isolateModules(async () => {
                const mockStats = { connectedClients: 5, activeStreams: 3 };
                const mockApiInstance = {
                    get: jest.fn().mockResolvedValue({ data: mockStats }),
                };
                axios.create.mockReturnValue(mockApiInstance);

                const { flightService: service } = require('../flightService');

                const result = await service.getStreamStats();

                expect(mockApiInstance.get).toHaveBeenCalledWith('/flights/stream/stats');
                expect(result).toEqual(mockStats);
            });
        });
    });

    describe('Error Handling', () => {
        it('propagates errors from API calls', async () => {
            jest.isolateModules(async () => {
                const mockError = new Error('Network Error');
                const mockApiInstance = {
                    get: jest.fn().mockRejectedValue(mockError),
                };
                axios.create.mockReturnValue(mockApiInstance);

                const { flightService: service } = require('../flightService');

                await expect(service.getAllFlights()).rejects.toThrow('Network Error');
            });
        });
    });
});
