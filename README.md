# School Equipment Lending Portal

A full-stack web application for managing school equipment lending built with React, Node.js, and MongoDB.

## Features

- 🔐 User Authentication & Role-based Access (Student, Staff, Admin)
- 📦 Equipment Management (CRUD operations)
- 📚 Borrowing & Return Requests
- 📊 Dashboard with Analytics
- ⏰ Due Date Tracking & Overdue Notifications
- 🛠️ Damage/Repair Log System

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Material-UI (MUI)
- Axios

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Swagger API Documentation

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ideya-mani/School-Equipment-Lending-Portal.git
   cd school-equipment-portal 


MongoDB compass
create collection name: equipment_lending

Backend Setup

# bash
cd server
npm install
# Create .env file with:
# MONGODB_URI=mongodb://localhost:27017/equipment_lending
# JWT_SECRET=your_jwt_secret_key_here
# PORT=5000
npm run dev


Frontend Setup

# bash
cd client
npm install
npm run dev
Access the Application

Frontend: http://localhost:3000

Backend API: http://localhost:5000

API Docs: http://localhost:5000/api-docs

Default Login Credentials
Admin: admin@school.edu / password123

Staff: staff@school.edu / password123

Student: student@school.edu / password123

Project Structure

school-equipment-portal/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   └── services/      # API services
└── server/                # Node.js backend
    ├── models/            # MongoDB models
    ├── routes/            # API routes
    ├── middleware/        # Custom middleware
    └── scripts/           # Database scripts


API Documentation
Swagger documentation available at: http://localhost:5000/api-docs