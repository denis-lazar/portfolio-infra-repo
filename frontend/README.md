# MenuSync Frontend

The MenuSync frontend is a responsive, real-time web application built with **React** and **TypeScript**. It serves two primary user journeys: the **Diner (Customer)** and the **Officiant (Manager)**.

![Frontend](docs/images/Pasted%20image%2020260208012909.png)

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
├── src/                       # All source code
│   ├── App.tsx                # Main routing and entry component
│   ├── index.tsx              # React DOM bootstrap
│   ├── types.ts               # Global TS interfaces/types
│   ├── constants.ts           # Global config & API URLs
│   ├── components/            # Feature-organized UI components
│   │   ├── auth/
│   │   │   └── LoginView.tsx         # Authentication UI
│   │   ├── restaurant/
│   │   │   ├── RestaurantCard.tsx    # Summary card for search results
│   │   │   ├── MenuView.tsx          # Digital menu display
│   │   │   ├── AvailabilityBadge.tsx # Real-time status indicator
│   │   │   └── MapView.tsx           # Restaurant discovery map
│   │   ├── manager/
│   │   │   └── ManagerPanel.tsx      # Manager controls panel
│   │   ├── admin/
│   │   │   └── AdminDashboard.tsx    # Admin management interface
│   │   ├── profile/
│   │   │   └── ProfileView.tsx       # User account details
│   │   └── layout/
│   │       └── Header.tsx            # Navigation bar
│   └── services/              # Business logic & communication
│       ├── api.ts             # REST & WebSocket client
│       └── geminiService.ts   # AI assistant integration
├── public/                    # Static assets (favicons, icons)
├── index.html                 # HTML entry point
├── test-setup.ts              # Vitest configuration
├── tsconfig.json              # TypeScript compiler settings
├── vite.config.ts             # Build system config
├── vitest.config.ts           # Unit test runner config
├── package.json               # Dependencies & scripts
├── metadata.json              # App manifest data
└── reports/                   # Test & coverage reports
```

### Key Components
- **`src/components/admin/AdminDashboard.tsx`**: Admin management interface.
- **`src/components/manager/ManagerPanel.tsx`**: Manager availability controls.
- **`src/components/restaurant/MapView.tsx`**: Discovery interface for customers.
- **`src/components/restaurant/MenuView.tsx`**: Real-time menu display with availability badges.
- **`src/services/geminiService.ts`**: AI-assisted service integration.

---

## 🧪 Testing

We use **Vitest** for unit and component testing to ensure UI reliability.

### Run Tests
```bash
npm test
```

### Test Coverage
We aim for high coverage on critical path components like availability toggles and real-time state updates.
- `src/components/admin/AdminDashboard.test.tsx`
- `src/components/auth/LoginView.test.tsx`
- `src/components/restaurant/MenuView.test.tsx`
- `src/components/manager/ManagerPanel.test.tsx`
- `src/components/restaurant/AvailabilityBadge.test.tsx`
- `src/services/api.test.ts`

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


