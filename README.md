# TMDS (Tamper Monitoring and Detection System)

TMDS is a secure web platform designed for monitoring, protecting, and detecting unauthorized changes or anomalous activities in medical databases. The system includes a React-based security frontend, a Node.js Express backend with cryptographic database integrity validation, and a Python Flask machine learning module for anomaly detection.

---

## 🌟 Key Features

*   **Cryptographic Database Integrity Validation**: Detects direct backend tampering on medical records by validating SHA-256 hashes generated from the data model fields.
*   **AI-Powered Anomaly Detection**: Employs an **Isolation Forest** unsupervised machine learning model to evaluate user access logs, identify abnormal login times/roles/actions, and output confidence values for security alerts.
*   **Role-Based Access Control (RBAC)**: Secure access roles for **Admin**, **Doctor**, and **Receptionist** with fine-grained permissions.
*   **Security Auditing & Alerts**: Visualizes real-time audit logs, activity patterns, brute-force security notifications, and simulated database attacks.
*   **Attack Simulator**: Built-in simulator to view the system’s real-time detection reactions under scenarios like credential stuffing, unauthorized edits, and SQL injection / direct tampering.

---

## 🛠️ Technology Stack

### Frontend
*   **Core**: React, Vite
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **Routing**: React Router DOM

### Backend
*   **Core**: Node.js, Express.js
*   **Database**: MongoDB / Mongoose (with automated local JSON file fallback if MongoDB is not detected)
*   **Authentication**: JSON Web Tokens (JWT) & bcryptjs password hashing
*   **Security**: Helmet, express-rate-limit

### AI Anomaly Module
*   **Core**: Python, Flask
*   **Machine Learning**: Scikit-Learn (`IsolationForest`), Pandas, NumPy
*   **CORS**: Flask-CORS

---

## 📁 Repository Structure

```
S4DS/
├── ai-module/         # Python Flask Anomaly Detection API
├── backend/           # Node.js Express Server
├── frontend/          # Vite + React Client Dashboard
├── LICENSE            # MIT License File
└── run-all.bat        # Windows Batch script to launch all modules
```

---

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16+)
*   [Python 3](https://www.python.org/) (v3.8+)
*   [MongoDB](https://www.mongodb.com/) (Optional, falls back automatically to local mock JSON database files in `backend/data/` if not available)

### Installation & Setup

#### 1. Setup the AI Module
1. Navigate to the `ai-module` directory:
   ```bash
   cd ai-module
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the Flask application:
   ```bash
   python app.py
   ```
   *The AI API runs on `http://127.0.0.1:5002`.*

#### 2. Setup the Backend
1. Navigate to the `backend` directory:
   ```bash
   cd ../backend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` root directory (refer to `.env` template):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/tmds
   JWT_SECRET=tmds_super_secure_jwt_secret_key
   AI_MODULE_URL=http://127.0.0.1:5002
   NODE_ENV=development
   ```
4. Start the Express server:
   ```bash
   npm start
   ```
   *The backend server runs on `http://localhost:5000`.*

#### 3. Setup the Frontend
1. Navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The web client runs on `http://localhost:5173`.*

---

## 🔑 Demo Access Accounts

If the database is empty, the server automatically seeds the following credentials:

| Username | Password | Role | Access Scope |
| :--- | :--- | :--- | :--- |
| **admin** | `admin123` | Admin | Full Access, Security Dashboard, Audits |
| **dr_smith** | `doctor123` | Doctor | View, Add, and Modify Patient Records |
| **receptionist_amy** | `recep123` | Receptionist | Read-Only Patient Records |

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.
