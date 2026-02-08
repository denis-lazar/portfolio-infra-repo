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
├── App.tsx             # Main routing and entry component
├── components/         # Reusable UI components
│   ├── AdminDashboard.tsx # Manager availability controls
│   ├── AvailabilityBadge.tsx # Real-time status indicator
│   ├── Header.tsx      # Navigation bar
│   ├── LoginView.tsx   # Authentication UI
│   ├── ManagerPanel.tsx # Admin utility panel
│   ├── MapView.tsx      # Restaurant discovery map
│   ├── MenuView.tsx     # Digital menu display
│   ├── ProfileView.tsx  # User account details
│   └── RestaurantCard.tsx # Summary card for search results
├── constants.ts        # Global config & API URLs
├── index.html          # HTML entry point
├── index.tsx           # React DOM bootstrap
├── menusync/           # Branding & legacy assets
├── metadata.json       # App manifest data
├── package.json        # Dependencies & scripts
├── public/             # Static assets (favicons, icons)
├── reports/            # Test & coverage reports
├── services/           # Business logic & communication
│   ├── api.ts          # REST client (Axios)
│   └── geminiService.ts # AI assistant integration
├── test-setup.ts       # Vitest configuration
├── tsconfig.json       # TypeScript compiler settings
├── types.ts            # Global TS interfaces/types
├── vite.config.ts      # Build system config
└── vitest.config.ts    # Unit test runner config
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


