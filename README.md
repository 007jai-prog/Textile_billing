# Textile Store POS & Inventory Management System

A full-stack, enterprise-grade Textile Retail Billing, Point-of-Sale (POS), and Inventory Management application with 21+ aesthetic themes, multi-device mobile/tablet responsiveness, thermal/A4 tax invoice printing, and Tamil festival promotional campaigns.

## Project Structure

```
Textile_and_Garments/
├── backend/                  # FastAPI Python Backend
│   ├── app/                  # Application code (routes, models, services)
│   ├── run.py                # Server entry point (runs on http://127.0.0.1:8000)
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React JS + Vite + Tailwind CSS Frontend
│   ├── src/                  # Components, pages, context, and styles
│   ├── public/               # Static assets
│   ├── index.html            # Entry HTML
│   ├── package.json          # Frontend dependencies & scripts
│   └── vite.config.js        # Vite configuration
├── package.json              # Root helper scripts
└── README.md
```

## Getting Started

### 1. Run Backend Server (FastAPI)

```bash
cd backend
python run.py
```
Backend API will be accessible at `http://127.0.0.1:8000` (Swagger docs at `/docs`).

### 2. Run Frontend Application (React + Vite)

You can run directly from root or from the `frontend/` folder:

**From Root:**
```bash
npm run dev
```

**Or inside `frontend/`:**
```bash
cd frontend
npm install
npm run dev
```
Frontend POS interface will be live at `http://localhost:5173`.

### 3. Default Sign-In Credentials

- **Email**: `admin@gmail.com` *(or shorthand username: `admin`)*
- **Password**: `admin`
- **Role**: Store Owner (`ChennaSilks Showroom`)
