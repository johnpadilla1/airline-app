# Airline App Architecture

This document explains how the Airline Flight Tracker application works in simple terms.

---

## 🏗️ The Big Picture

Think of this app like an **airport control tower** that:
1. Monitors all flights
2. Announces changes to everyone watching
3. Lets you ask questions about flights via AI

---

## 📦 The Components

### 1. Database (PostgreSQL)
- This is like a **filing cabinet** that stores all flight information
- Contains: flight numbers, airlines, origins, destinations, statuses, gates, etc.
- Tables: `flights`, `flight_events`

### 2. Backend (Spring Boot - Java)
- This is the **brain** of the operation
- Handles all the logic: reading/writing to database, processing events, answering AI questions
- Exposes REST APIs for the frontend to consume

### 3. Frontend (React)
- This is the **visual dashboard** you see in the browser
- Shows flight cards, filters, the chat panel, event ticker, etc.
- Built with React + Vite + Tailwind CSS

### 4. Kafka (Message Queue)
- This is like a **bulletin board** or **announcement system**
- When something changes, a message gets posted here
- Anyone interested can listen for announcements

---

## 🔄 How Flight Updates Work (The Kafka Flow)

Here's the step-by-step process:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLIGHT UPDATE FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. PRODUCER (Creates Events)                                           │
│     ┌─────────────────────────────────────────────────────────────┐    │
│     │  FlightEventProducerService.java                            │    │
│     │  - Runs on a schedule (every few seconds)                   │    │
│     │  - Randomly picks a flight                                  │    │
│     │  - Generates a random event (delay, gate change, etc.)      │    │
│     │  - PUBLISHES message to Kafka topic "flight-events"         │    │
│     └─────────────────────────────────────────────────────────────┘    │
│                              │                                          │
│                              ▼                                          │
│  2. KAFKA (Message Broker)                                              │
│     ┌─────────────────────────────────────────────────────────────┐    │
│     │  Topic: "flight-events"                                     │    │
│     │  - Holds messages in a queue                                │    │
│     │  - Multiple consumers can listen                            │    │
│     │  - Messages are delivered reliably                          │    │
│     └─────────────────────────────────────────────────────────────┘    │
│                              │                                          │
│                              ▼                                          │
│  3. CONSUMER (Processes Events)                                         │
│     ┌─────────────────────────────────────────────────────────────┐    │
│     │  FlightEventConsumerService.java                            │    │
│     │  - SUBSCRIBES to "flight-events" topic                      │    │
│     │  - Receives each event message                              │    │
│     │  - Updates the flight in the DATABASE                       │    │
│     │  - Saves the event to flight_events table                   │    │
│     │  - Calls SSE service to notify browsers                     │    │
│     └─────────────────────────────────────────────────────────────┘    │
│                              │                                          │
│                              ▼                                          │
│  4. SSE (Server-Sent Events)                                            │
│     ┌─────────────────────────────────────────────────────────────┐    │
│     │  SseEmitterService.java                                     │    │
│     │  - Maintains open connections to all browsers               │    │
│     │  - BROADCASTS the event to all connected browsers           │    │
│     │  - Frontend receives update instantly (no refresh needed)   │    │
│     └─────────────────────────────────────────────────────────────┘    │
│                              │                                          │
│                              ▼                                          │
│  5. FRONTEND (React)                                                    │
│     ┌─────────────────────────────────────────────────────────────┐    │
│     │  useFlights.js hook                                         │    │
│     │  - Subscribes to SSE stream on page load                    │    │
│     │  - Receives event, updates flight card in real-time         │    │
│     │  - Shows event in the ticker at the bottom                  │    │
│     └─────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Files and What They Do

### Backend Services

| File | Role | What it does |
|------|------|--------------|
| `FlightEventProducerService.java` | **PUBLISHER** | Creates random flight events and sends them to Kafka |
| `FlightEventConsumerService.java` | **SUBSCRIBER** | Listens to Kafka, updates database, triggers SSE |
| `SseEmitterService.java` | **BROADCASTER** | Pushes real-time updates to all connected browsers |
| `FlightService.java` | **Data Access** | CRUD operations for flights |
| `ChatService.java` | **AI Chat** | Handles chat questions, generates SQL, streams answers |

### Frontend Files

| File | Role | What it does |
|------|------|--------------|
| `useFlights.js` | **SSE Client** | Connects to SSE stream, receives updates |
| `flightService.js` | **API Client** | Fetches flights from REST API |
| `chatService.js` | **Chat Client** | Sends messages, receives streaming responses |

---

## 📡 SSE vs Kafka - What's the difference?

| | **Kafka** | **SSE** |
|---|-----------|---------|
| **Purpose** | Backend-to-backend messaging | Backend-to-browser updates |
| **Who uses it** | Services talk to each other | Browser receives updates |
| **Direction** | Bidirectional (pub/sub) | One-way (server → browser) |
| **Protocol** | Custom TCP protocol | HTTP |

**Analogy:**
- **Kafka** = Internal radio system between airport staff
- **SSE** = Public announcement speakers in the terminal

---

## 🤖 How the AI Chat Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AI CHAT FLOW                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. User asks: "How many flights are delayed?"                          │
│                              │                                          │
│                              ▼                                          │
│  2. Backend sends question to LLM (via OpenRouter API)                  │
│     - System prompt tells LLM about database schema                     │
│     - LLM generates: "SQL: SELECT COUNT(*) FROM flights WHERE..."       │
│                              │                                          │
│                              ▼                                          │
│  3. Backend extracts SQL, executes it on PostgreSQL                     │
│     - Gets result: [{count: 6}]                                         │
│                              │                                          │
│                              ▼                                          │
│  4. Backend sends results back to LLM                                   │
│     - LLM generates human-friendly answer                               │
│     - Response is STREAMED token-by-token                               │
│                              │                                          │
│                              ▼                                          │
│  5. Frontend displays streaming response with typing effect             │
│     "There are currently 6 delayed flights..."                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### AI Chat Components

1. **AiConfig.java** - Configures the LLM connection (OpenRouter API) and system prompt
2. **ChatService.java** - Orchestrates the chat flow:
   - Receives user question
   - Calls LLM to generate SQL
   - Executes SQL on database
   - Calls LLM again to generate human-friendly answer
   - Streams response back to frontend
3. **ChatController.java** - REST endpoints for chat (`/api/chat` and `/api/chat/stream`)
4. **ChatPanel.jsx** - React component for the chat UI

---

## 🔁 Summary: The Complete Data Flow

### Real-time Flight Updates:
1. **Producer** generates a random event → publishes to **Kafka**
2. **Consumer** reads from **Kafka** → updates **Database** → notifies **SSE**
3. **SSE** pushes update → **Browser** receives it
4. **React** updates UI → you see the flight card change!

### AI Chat:
1. You type question → **Frontend** sends to **Backend**
2. **Backend** asks **LLM** to generate SQL
3. **Backend** runs SQL on **Database**
4. **Backend** asks **LLM** to explain results
5. **Response streams** back token-by-token

---

## 🚀 Running the Application

### Start
```bash
./start.sh
```

This script:
1. Starts Docker containers (PostgreSQL, Kafka, Kafka UI)
2. Starts the Spring Boot backend
3. Starts the React frontend

### Stop
```bash
./stop.sh
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api/flights
- **Kafka UI**: http://localhost:8090
- **SSE Stream**: http://localhost:8080/api/flights/stream

---

## 📁 Project Structure

```
airline app/
├── airline-backend/          # Spring Boot Java backend
│   └── src/main/java/com/airline/
│       ├── config/           # Configuration (AI, Kafka, CORS)
│       ├── controller/       # REST API endpoints
│       ├── model/            # Entities, DTOs, Enums
│       ├── repository/       # Database access (JPA)
│       └── service/          # Business logic
│
├── airline-frontend/         # React frontend
│   └── src/
│       ├── components/       # React components
│       ├── hooks/            # Custom hooks (useFlights)
│       └── services/         # API services
│
├── docker-compose.yml        # Docker infrastructure
├── start.sh                  # Start script
├── stop.sh                   # Stop script
└── APPLICATION.md            # This file
```

---

## 🛠️ Technologies Used

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Spring Boot 3.3, Spring AI 1.0, Spring WebFlux |
| Database | PostgreSQL 15 |
| Messaging | Apache Kafka 3.7 |
| AI | OpenRouter API (Grok model) |
| Real-time | Server-Sent Events (SSE) |
| Containers | Docker, Docker Compose |
