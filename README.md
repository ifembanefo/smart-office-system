# Smart Office System — Jalousie Control & Preference Aggregation

A web-based system for evaluating preference aggregation methods (Simple Averaging vs. Weighted Aggregation) in a shared office environment with automated blind control.

## Project Overview

This thesis prototype implements:
- **Consent modal** for GDPR-compliant user participation
- **Preference aggregation wizard** where users enter their preferences and select a partner profile
- **Two aggregation methods**:
  - **Condition A**: Simple Averaging — `(Profile A + Profile B) / 2`
  - **Condition B**: Weighted Aggregation (WOWA) — weighted ordered weighted averaging
- **Real-time blind position simulation** with video feedback
- **WebSocket integration** for live updates between frontend and backend

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | FastAPI (Python), Uvicorn, WebSockets |
| **Data** | In-memory preference store (no database) |

---

## Backend Setup

### Prerequisites
- Python 3.8+
- pip / venv

### Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # macOS/Linux
   # OR
   venv\Scripts\activate  # Windows
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

### Running the Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

The backend will be available at **http://localhost:8000**

**API Documentation** (auto-generated): http://localhost:8000/docs

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/blind/state` | Get current blind position & auto mode state |
| `POST` | `/api/blind/position` | Set blind position manually |
| `POST` | `/api/blind/preference` | Submit user preference to collection |
| `POST` | `/api/blind/aggregate/simple` | Calculate simple average aggregation |
| `POST` | `/api/blind/aggregate/wowa` | Calculate WOWA aggregation |
| `GET` | `/api/blind/preferences` | Fetch all collected preferences |
| `WS` | `/ws` | WebSocket for real-time updates |

---

## Frontend Setup

### Prerequisites
- Node.js 16+ & npm

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Running the Frontend (Development)

```bash
cd frontend
npm run dev
```

The frontend will be available at **http://localhost:5173** (or next available port)

### Build for Production

```bash
npm run build
npm run preview
```

---

## Running Both Services

### Option 1: Separate Terminals

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Using Claude Code

If using Claude Code CLI:
```bash
cd path/to/jalousie-app
# Backend will start on :8000
# Frontend will start on :5173
```

---

## User Flow

### 1. Consent Modal
- Displayed on first visit
- Collects consent for data usage
- Stored in `localStorage` as `consent=true`
- Restart with "Restart Evaluation" button in header

### 2. Preference Aggregation
1. Click **"Aggregate My Preferences"** under User Profiles
2. **Step 1**: Adjust sliders (Height, Angle, Temperature, Light)
3. **Step 2**: Choose aggregation method:
   - **Condition A**: Simple Averaging
   - **Condition B**: Weighted Aggregation (WOWA)
4. **Step 3**: View aggregated Profile C with breakdown:
   - Your values
   - Partner's values
   - Aggregated result
   - Formula explanation

### 3. Blind Simulation
- Real-time video showing blind position changes
- Updates via WebSocket when aggregation is applied
- 4-quarter automation logic maps temp/light to blind position

### 4. Data Collection
- All preferences are anonymously stored in the backend
- View collected data: **http://localhost:8000/api/blind/preferences**

---

## Architecture

### Backend Structure
```
backend/
├── app/
│   ├── main.py                 # FastAPI app setup, CORS config
│   ├── models/
│   │   └── sensor.py           # Pydantic models (UserPreference, BlindPosition, etc.)
│   ├── routers/
│   │   └── blind.py            # API endpoints
│   ├── services/
│   │   ├── automation.py       # Blind automation logic
│   │   ├── aggregation.py      # Simple average & WOWA aggregation
│   │   ├── calculation.py      # Temperature conversion, thresholds
│   │   ├── preference_store.py # In-memory preference collection
│   │   └── wowa.py             # WOWA operator implementation
│   └── websocket/
│       └── manager.py          # WebSocket connection manager
├── venv/                        # Python virtual environment
└── requirements.txt             # Dependencies
```

### Frontend Structure
```
frontend/src/
├── components/
│   ├── ConsentModal/           # GDPR consent on first visit
│   ├── PreferenceWizard/       # Multi-step aggregation flow
│   ├── AggregatedProfileCard/  # Displays aggregation result
│   ├── BlindControl/           # Manual blind control sliders
│   ├── SensorPanel/            # Temp/Light input controls
│   ├── VideoSimulation/        # Blind position video feedback
│   └── PresetButtons/          # Scene & profile shortcuts
├── hooks/
│   ├── useWebSocket.ts         # WebSocket connection hook
│   └── useModal.ts             # Modal state management
├── services/
│   └── api.ts                  # API client functions
├── types/
│   └── index.ts                # TypeScript interfaces
├── pages/
│   └── Dashboard.tsx           # Main page layout
└── main.tsx                     # React entry point
```

---

## Key Features

### Consent & Privacy
- GDPR-compliant consent modal on first visit
- No personally identifiable information collected
- Anonymous preference submission
- Data stored only for research purposes

### Aggregation Methods

#### Simple Averaging (Condition A)
```
aggregated = (user_value + partner_value) / 2
```

#### WOWA (Condition B)
```
aggregated = Σ ω_i · v_(i)
where ω_i = w*(Σβ_{1..i}) - w*(Σβ_{1..i-1})
```

Combines:
- **Weighted Mean**: respects source importance (β)
- **OWA**: respects value ordering (a, b parameters)

### Real-Time Updates
- WebSocket connection for live blind position updates
- 4-quarter automation maps sensor values to blind position
- Blind simulation shows visual feedback

---

## Troubleshooting

### Backend won't start
1. Ensure Python venv is activated: `source venv/bin/activate`
2. Check port 8000 is not in use: `lsof -i :8000`
3. Reinstall dependencies: `pip install -r requirements.txt`

### Frontend won't connect to backend
1. Ensure backend is running on http://localhost:8000
2. Check Vite proxy config in `frontend/vite.config.ts`:
   ```js
   proxy: {
     '/api': 'http://localhost:8000',
     '/ws': { target: 'ws://localhost:8000', ws: true },
   }
   ```

### Preferences not being saved
1. Backend must be running (not just frontend)
2. Check browser console for network errors
3. Verify WebSocket connection in DevTools Network tab

### Clear consent modal to re-test
In browser DevTools Console:
```javascript
localStorage.removeItem('consent')
location.reload()
```

---

## Testing the Aggregation Flow

1. Open http://localhost:5173 → Consent modal appears
2. Check consent & proceed
3. Click **"Aggregate My Preferences"**
4. Adjust sliders to your preferences
5. Select **Condition A** (Simple Averaging)
6. View aggregated result with formula breakdown
7. Check backend: http://localhost:8000/api/blind/preferences

Expected output (JSON):
```json
{
  "preferences": [
    {
      "partner_profile": "student",
      "height": 65.0,
      "angle": 89.0,
      "temp": 25.0,
      "licht": 2100.0,
      "mode": "slider",
      "method": "simple_average",
      "aggregated": {
        "height": 72.5,
        "angle": 87.0,
        "temp": 26.0,
        "licht": 1650.0
      }
    }
  ]
}
```

---

## License

Academic research project for TH Mannheim thesis evaluation.

---

## Contact

**Author**: Ife Mbanefo  
**Thesis**: Smart Office System - Preference Aggregation Evaluation  
**Date**: 2026
