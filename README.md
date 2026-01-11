# Saree E-Commerce Platform

A full-stack e-commerce platform for selling sarees, built with modern web technologies.

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Razorpay** for payment integration
- **Multer** for file uploads

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Axios** for API communication
- **Context API** for state management

### DevOps
- **Nginx** for reverse proxy and serving static files

## Project Structure

```
SareeWeb/
├── backend/          # Express.js API server
├── frontend/         # React.js frontend application
├── docs/             # Documentation
├── nginx/            # Nginx configuration
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Razorpay account (for payments)

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saree-db
   JWT_SECRET=your-secret-key-here
   RAZORPAY_KEY_ID=your-razorpay-key
   RAZORPAY_KEY_SECRET=your-razorpay-secret
   FRONTEND_URL=http://localhost:5173
   ADMIN_EMAIL=admin@sareestore.com
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   ```
   VITE_API_URL=http://localhost:5000/api
   VITE_APP_NAME=Saree Store
   VITE_RAZORPAY_KEY=your-razorpay-key
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`

## Development

### Backend Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (when implemented)

### Frontend Scripts
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## API Documentation

See [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for detailed API endpoints.

## Deployment

See [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for production deployment instructions.

## Database Schema

See [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for database structure.

## Architecture

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for system architecture details.

## Environment Variables

### Backend
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `RAZORPAY_KEY_ID` - Razorpay key ID
- `RAZORPAY_KEY_SECRET` - Razorpay secret key
- `FRONTEND_URL` - Frontend URL for CORS
- `ADMIN_EMAIL` - Admin email for initial setup

### Frontend
- `VITE_API_URL` - Backend API URL
- `VITE_APP_NAME` - Application name
- `VITE_RAZORPAY_KEY` - Razorpay public key

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
