# MenuSync Frontend

The MenuSync frontend is a responsive, real-time web application built with **React** and **TypeScript**. It serves two primary user journeys: the **Diner (Customer)** and the **Officiant (Manager)**.

## 📸 Screenshots

| User Interface | Mobile View |
| :---: | :---: |
| ![Frontend UI](https://via.placeholder.com/400x250?text=Frontend+UI+Dashboard) | ![Mobile View](https://via.placeholder.com/400x250?text=Mobile+View) |

| Availability Badges | Real-time Updates |
| :---: | :---: |
| ![Availability Badges](https://via.placeholder.com/400x250?text=Availability+Badges) | ![Real-time Updates](https://via.placeholder.com/400x250?text=Real-time+Updates) |

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
├── App.tsx
├── components/         # Reusable UI components
│   ├── AdminDashboard.tsx
│   ├── AvailabilityBadge.tsx
│   ├── Header.tsx
│   ├── LoginView.tsx
│   ├── ManagerPanel.tsx
│   ├── MapView.tsx
│   ├── MenuView.tsx
│   ├── ProfileView.tsx
│   └── RestaurantCard.tsx
├── constants.ts
├── index.html
├── index.tsx
├── menusync/
├── metadata.json
├── package.json
├── public/             # Static assets
├── reports/
├── services/           # API and WebSocket service logic
├── test-setup.ts
├── tsconfig.json
├── types.ts
├── vite.config.ts
└── vitest.config.ts
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
