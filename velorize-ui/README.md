# Velorize UI

Frontend application for Velorize - Demand Planning & S&OP for Malaysian SMEs.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI Library:** Material-UI (MUI) v5
- **State Management:** Zustand
- **Data Visualization:** Recharts, TanStack Table
- **HTTP Client:** Axios
- **Form Handling:** React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running (velorize-backend)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Update .env.local with your API URL
```

### Development

```bash
# Run development server
npm run dev

# Open http://localhost:3000
```

### Build

```bash
# Production build
npm run build

# Start production server
npm start
```

### Code Quality

```bash
# Lint code
npm run lint

# Type check
npm run type-check

# Format code (if prettier script added)
npm run format
```

## Project Structure

```
src/
├── app/                # Next.js App Router pages
├── components/        # Reusable components
│   ├── common/       # Generic components (Button, Table, etc.)
│   ├── dashboard/    # Dashboard-specific components
│   └── layout/       # Layout components (Navbar, Sidebar)
├── lib/              # Utilities & helpers
│   ├── api/         # API client & endpoints
│   └── utils/       # Helper functions
├── store/            # Zustand state management
├── types/            # TypeScript types & interfaces
└── styles/           # Global styles & MUI theme
```

## Key Features

- **Dashboard:** Overview metrics, ABC/XYZ analysis
- **Inventory Management:** Stock tracking, A&E reports
- **Demand Forecasting:** SARIMA-based projections
- **Reporting:** Forecast accuracy, margin analysis
- **Data Entry:** Master data management, CSV imports

## Code Style

- Follow the conventions in `/plan/CODE_STYLE_GUIDE.md`
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use MUI `sx` prop for simple styling

## Environment Variables

See `.env.local.example` for required variables.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Material-UI Documentation](https://mui.com/)
- [Project Development Plan](/plan/DEVELOPMENT_PLAN.md)
