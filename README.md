# EventHub — Event and Participant Management System

Fullstack event management application — Django REST Framework + React.

---

## Authors

- Abdelkarim El Massaoudi
- Nassim Touat
- Meriem Sohbi

---

## Tech Stack

| Layer | Technology |
|---|---|
| Main backend | Django 5.2 + Django REST Framework |
| Alternative backend | Node.js / Express (comparison lab) |
| Frontend | React |
| Local database | SQLite |
| Production database | PostgreSQL (Render) |
| Backend deployment | Render |
| Frontend deployment | Vercel |

---

## Run the project locally

### 1. Clone the repo

```bash
git clone https://github.com/yourname/eventhub.git
cd eventhub/projet
```

---

### 2. Django Backend

```bash
cd Django

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Apply migrations (creates db.sqlite3)
python Src/manage.py migrate

# Create a superuser (Admin)
python Src/manage.py createsuperuser

# Start the server
python Src/manage.py runserver
```

> API available at: `http://localhost:8000/api`

---

### 3. React Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create the .env file manually with:
# REACT_APP_API_URL=http://localhost:8000/api

# Start the development server
npm start
```

> Frontend available at: `http://localhost:3000`

---

### 4. Node.js Backend (optional — comparison LAB 8 only)

```bash
cd NodeJS

npm install
node server.js
```

> Runs at: `http://localhost:5000` (not used in production)

---

## Permissions

**Admin**
- View all users
- Change user roles
- Full CRUD on all events, participants, and registrations

**Editor**
- Create events
- Edit / delete their own events
- Manage their own participants and registrations

**Viewer**
- Read-only access to events, participants, and registrations
- No write actions allowed

