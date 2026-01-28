# MenuSync Frontend

The MenuSync Frontend is a modern, responsive Progressive Web Application (PWA) built with React and TypeScript, optimized for speed and real-time user feedback.

## 🛠️ Technology Stack

- **Framework:** [React 19](https://react.dev/) - Utilizing the latest features for component-based UI development.
- **Build Tool:** [Vite](https://vitejs.dev/) - Next-generation frontend tooling for ultra-fast development.
- **Language:** [TypeScript](https://www.typescriptlang.org/) - Ensuring type safety and maintainable code.
- **Mapping:** [Leaflet.js](https://leafletjs.com/) & [React Leaflet](https://react-leaflet.js.org/) - Interactive maps with custom markers and dark-mode tiles.
- **Styling:** CSS-in-JS and modern CSS principles for a premium, responsive UI.
- **Testing:** [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Fast, modern testing for UI components.

## 📁 Folder Structure

```text
frontend/
├── components/         # Reusable UI components (MapView, MenuView, ManagerPanel)
├── services/           # API clients and WebSocket listeners
├── public/             # Static assets (high-resolution meal images)
├── App.tsx             # Root component and navigation logic
├── index.tsx           # Application entry point
├── constants.ts        # Shared configuration and static data
├── types.ts            # TypeScript interface definitions
└── vite.config.ts      # Vite configuration
```

## ⚙️ How It Works

### 1. Real-time UI Updates
The application maintains a persistent WebSocket connection to the backend. When a "menu_update" or "availability_change" event is received, the frontend updates the local state immediately, causing components (like badges or buttons) to re-render without a full page refresh.

### 2. Dual-View System
- **Discovery View:** A map-centric interface for customers to find restaurants and see high-level availability (e.g., "5 dishes ready").
- **Manager View:** A secure panel for restaurant staff to toggle ingredient and hardware statuses with a single tap.

### 3. High Performance
In production, the frontend is served by **Nginx**. Static assets are served directly from a shared volume, bypassing the application server for maximum speed and reduced latency.

## 🧪 Testing
Run the frontend test suite:
```bash
npm test
```
Or to run tests with coverage:
```bash
npx vitest run --coverage
```