# KiranaPulse

KiranaPulse is a full-stack web application designed to help manage and streamline operations. It consists of a React-based frontend and a FastAPI (Python) backend connected to a MongoDB database.

## Project Structure

- `frontend/` - Contains the React UI built with Vite.
- `backend/` - Contains the FastAPI application and backend logic.
- `docs/` - Contains documentation and other resources.

---

## Prerequisites

- **Node.js** (v18+ recommended) for the frontend
- **Python** (v3.10+ recommended) for the backend
- **MongoDB** (Local or Atlas) for the database

---

## Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - On Windows: `venv\Scripts\activate`
   - On Mac/Linux: `source venv/bin/activate`

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the backend server:**
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will be available at `http://localhost:8000`. API documentation is accessible at `http://localhost:8000/docs`.

---

## Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the frontend development server:**
   ```bash
   npm run dev
   ```
   The frontend will typically be accessible at `http://localhost:5173`.

---

## Environment Variables

### Backend
Create a `.env` file in the `backend/` directory with the following variables (example):
```env
MONGODB_URL=mongodb+srv://<user>:<password>@cluster0...
SECRET_KEY=your_super_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend
Create a `.env` file in the `frontend/` directory (you can copy `.env.example` if available). Example:
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## Notes
Ensure your local or remote MongoDB instance is running before starting the backend server.
