# Airline Event-Driven Flight Tracker — Implementation Plan

## Overview
Build a Spring Boot + React application with Kafka-based event publishing/consuming for flight status updates, SSE for real-time browser push, PostgreSQL persistence, and Docker Compose infrastructure.

## Architecture
- **Backend**: Spring Boot 3.x with Spring Kafka, Spring Data JPA, SSE
- **Frontend**: React 18 with Vite, TanStack Query, Axios
- **Message Broker**: Apache Kafka (KRaft mode)
- **Database**: PostgreSQL
- **Monitoring**: Kafka UI

## Steps

### 1. Set up Docker Compose Infrastructure
Create `docker-compose.yml` with:
- **Kafka** (KRaft mode - no Zookeeper needed)
- **PostgreSQL** for flight data persistence
- **Kafka UI** (`provectuslabs/kafka-ui`) for topic/message visualization

Configure service networking and health checks.

### 2. Create Spring Boot Backend
**Dependencies** (`pom.xml`):
- `spring-boot-starter-web`
- `spring-boot-starter-data-jpa`
- `spring-kafka`
- `postgresql`
- `lombok` (optional)

**Package Structure**:
```
com.airline/
├── config/
│   ├── KafkaConfig.java
│   └── KafkaTopicConfig.java
├── controller/
│   └── FlightController.java
├── service/
│   ├── FlightService.java
│   ├── FlightEventProducerService.java
│   ├── FlightEventConsumerService.java
│   └── SseEmitterService.java
├── model/
│   ├── entity/
│   │   ├── Flight.java
│   │   └── FlightEvent.java
│   ├── dto/
│   │   ├── FlightDTO.java
│   │   └── FlightEventDTO.java
│   └── enums/
│       └── FlightEventType.java
└── repository/
    ├── FlightRepository.java
    └── FlightEventRepository.java
```

### 3. Define Domain Models & Seed Data
**Flight Entity**:
- `id`, `flightNumber`, `airline`, `origin`, `destination`
- `scheduledDeparture`, `scheduledArrival`, `actualDeparture`, `actualArrival`
- `status`, `gate`, `terminal`, `delayMinutes`

**FlightEvent Entity**:
- `id`, `flightNumber`, `eventType`, `previousValue`, `newValue`
- `eventTimestamp`, `processedTimestamp`, `flight` (ManyToOne)

**FlightEventType Enum**:
- `DELAY`, `GATE_CHANGE`, `CANCELLATION`, `BOARDING_STARTED`, `BOARDING_COMPLETED`, `DEPARTED`, `ARRIVED`

**Seed 25 Realistic Flights**:
- Airlines: AA (American), UA (United), DL (Delta), SW (Southwest), JB (JetBlue)
- Routes: JFK→LAX, ORD→DFW, SFO→MIA, BOS→SEA, ATL→DEN, etc.
- Initial statuses: ON_TIME, BOARDING, DELAYED

### 4. Configure Kafka Producer with Weighted Events
**FlightEventProducerService**:
- `@Scheduled(fixedRate = 30000)` — publish every 30 seconds
- Randomly select an existing flight from database
- Generate event with weighted distribution:
  - 60% DELAY (add 15-90 minutes)
  - 20% GATE_CHANGE (assign new gate)
  - 10% BOARDING_STARTED
  - 10% CANCELLATION
- Publish to `flight-events` topic with `flightNumber` as key

### 5. Implement Kafka Consumer
**FlightEventConsumerService**:
- `@KafkaListener(topics = "flight-events", groupId = "airline-consumer-group")`
- Process event and update `Flight` entity:
  - DELAY → update `delayMinutes`, set status to DELAYED
  - GATE_CHANGE → update `gate` field
  - BOARDING_STARTED → set status to BOARDING
  - CANCELLATION → set status to CANCELLED
- Persist `FlightEvent` audit record
- Notify SSE clients of the update

### 6. Add SSE Endpoint for Real-Time Updates
**SseEmitterService**:
- Maintain list of connected `SseEmitter` instances
- Broadcast method to send events to all clients
- Handle client disconnection cleanup

**FlightController**:
- `GET /api/flights/stream` → returns `SseEmitter`
- Content-Type: `text/event-stream`

### 7. Build REST API Layer
**Endpoints**:
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/flights` | List all flights |
| GET | `/api/flights/{id}` | Get flight by ID |
| GET | `/api/flights/{flightNumber}/events` | Get event history for flight |
| GET | `/api/flights/stream` | SSE stream for real-time updates |

### 8. Create React Frontend
**Setup**:
```bash
npm create vite@latest airline-frontend -- --template react
npm install @tanstack/react-query axios
```

**Component Structure**:
```
src/
├── components/
│   ├── FlightList/
│   │   ├── FlightList.jsx
│   │   ├── FlightGrid.jsx
│   │   ├── FlightCard.jsx
│   │   └── FlightList.css
│   ├── FlightDetails/
│   │   └── FlightDetails.jsx
│   └── ViewToggle/
│       └── ViewToggle.jsx
├── hooks/
│   └── useFlights.js
├── services/
│   └── flightService.js
├── App.jsx
└── main.jsx
```

### 9. Implement SSE + Polling in Frontend
**SSE Connection**:
```javascript
const eventSource = new EventSource('/api/flights/stream');
eventSource.onmessage = (event) => {
  const flightUpdate = JSON.parse(event.data);
  // Update React Query cache or local state
};
```

**TanStack Query with Fallback Polling**:
```javascript
useQuery({
  queryKey: ['flights'],
  queryFn: fetchFlights,
  refetchInterval: 30 * 60 * 1000, // 30 minutes
});
```

**View Toggle**:
- State: `viewMode` = 'grid' | 'card'
- Grid view: Table layout with columns
- Card view: Responsive card grid

## Configuration Files

### application.yml
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/airline_db
    username: airline
    password: airline123
  jpa:
    hibernate:
      ddl-auto: update
  kafka:
    bootstrap-servers: localhost:9092
    consumer:
      group-id: airline-consumer-group
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: "com.airline.model.dto"
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: airline_db
      POSTGRES_USER: airline
      POSTGRES_PASSWORD: airline123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  kafka:
    image: apache/kafka:3.7.0
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    ports:
      - "9092:9092"

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    environment:
      KAFKA_CLUSTERS_0_NAME: airline-cluster
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
    ports:
      - "8080:8080"
    depends_on:
      - kafka

volumes:
  postgres_data:
```

## Testing the Flow
1. Start infrastructure: `docker-compose up -d`
2. Start Spring Boot backend
3. Start React frontend: `npm run dev`
4. Open Kafka UI at `http://localhost:8080` to monitor events
5. Watch flights update in real-time every 30 seconds
6. Toggle between grid and card views
