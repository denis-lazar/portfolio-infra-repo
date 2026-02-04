# MenuSync Frontend

The MenuSync frontend is a responsive, real-time web application built with **React** and **TypeScript**. It serves two primary user journeys: the **Diner (Customer)** and the **Officiant (Manager)**.

![Frontend UI](https://via.placeholder.com/800x400?text=MenuSync+Frontend+UI+Dashboard)

## 🛠️ Tech Stack

- **Framework:** [React 18](https://reactjs.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** Tailwind CSS (via components)
- **Real-time:** WebSockets
- **State Management:** React Hooks & Context API
- **Testing:** [Vitest](https://vitest.dev/) & React Testing Library

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
```bash
cd Application/frontend
npm install
```

### Running Locally
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

---

## 🏗️ Project Structure

```text
frontend/
├── components/         # Reusable UI components (Dashboard, Map, Cards)
├── services/           # API and WebSocket service logic
├── public/             # Static assets (images, favicon)
├── App.tsx             # Main application entry and routing
├── index.tsx           # React DOM rendering
├── types.ts            # Global TypeScript interfaces
└── vite.config.ts      # Vite configuration
```

### Key Components
- **`AdminDashboard.tsx`**: Management interface for toggling availability.
- **`MapView.tsx`**: Discovery interface for customers to find restaurants.
- **`MenuView.tsx`**: Real-time menu display with availability badges.
- **`geminiService.ts`**: AI-assisted service integration (optional/future).

---

## 🧪 Testing

We use **Vitest** for unit and component testing to ensure UI reliability.

### Run Tests
```bash
npm test
```

### Test Coverage
We aim for high coverage on critical path components like availability toggles and real-time state updates.
- `AdminDashboard.test.tsx`
- `LoginView.test.tsx`
- `MenuView.test.tsx`

---

## 📡 WebSocket Integration

The frontend maintains a persistent WebSocket connection to the backend to receive live updates. When a manager makes a change, the UI updates automatically without a page refresh, ensuring customers always see the latest availability.

---

## 🌐 Deployment

The frontend is built into static assets using:
```bash
npm run build
```
The resulting `dist/` folder is served by Nginx in the production cluster.
