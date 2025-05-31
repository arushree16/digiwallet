# DigiWallet - Digital Wallet System

A comprehensive digital wallet system with cash management and fraud detection capabilities. This platform allows users to register, deposit/withdraw virtual cash, and transfer funds to other users. The backend handles transaction processing, session security, and basic fraud detection logic.

## Features

### Core Features
1. **User Authentication & Session Management**
   - User registration and login with secure password hashing (bcrypt)
   - JWT token authentication
   - Protected endpoints with authentication middleware

2. **Wallet Operations**
   - Deposit and withdraw virtual cash
   - Transfer funds between users
   - Transaction history tracking
   - Multi-currency support

3. **Transaction Processing & Validation**
   - Atomic transactions (secure deduction and credit of funds)
   - Validations to prevent overdrafts, negative deposits, or invalid transfers

4. **Fraud Detection Logic**
   - Detection of suspicious patterns:
     - Multiple transfers in a short period
     - Sudden large withdrawals
   - Flagging system for anomalous transactions

5. **Admin & Reporting APIs**
   - View flagged transactions
   - Aggregate total user balances
   - View top users by balance or transaction volume

### Bonus Features
1. **Soft Delete Functionality**
   - Soft delete users and transactions instead of permanently removing them
   - Restore soft-deleted users and transactions
   - View all soft-deleted users and transactions (admin only)

2. **Scheduled Jobs**
   - Daily fraud scan scheduled using node-cron
   - Automated detection of suspicious patterns

3. **Email Alerts**
   - Email notifications for large transactions (over $10,000)
   - Alerts for suspicious activity detected by fraud scan

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt for password hashing, Helmet for HTTP security

## Demo Video

A comprehensive demo of the DigiWallet API functionality is available. The video demonstrates all core and bonus features including authentication, wallet operations, transaction processing, and fraud detection.

### How to Add the Demo Video

For the best GitHub presentation, I recommend:

1. Upload your `Digiwallet_arushree.mov` to YouTube
2. Replace the placeholder below with your YouTube video ID

```markdown
[![DigiWallet Demo](https://img.youtube.com/vi/YOUR_VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)
```

This will create a clickable thumbnail in your README that opens the YouTube video.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local instance or MongoDB Atlas)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/arushree16/digiwallet
   cd digiwallet
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   - Create a `.env` file in the root directory based on `.env.example`
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/digiwallet
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=1d
   ```

4. Run the project

   The TypeScript errors have been fixed, so you can now build and run the project normally:
   ```
   # Build the project
   npm run build
   
   # Start the server
   npm start
   ```

   For development with hot reloading:
   ```
   npm run dev
   ```

## TypeScript Implementation Notes

This project has been fully implemented in TypeScript with proper type definitions. Recent updates include:

- Fixed TypeScript compilation errors while maintaining full functionality
- Improved type definitions for Express middleware functions
- Enhanced tsconfig.json settings for better developer experience
- Ensured all routes and controllers are properly typed

## Bonus Features Implementation

### Soft Delete Functionality
The system implements a soft delete pattern instead of permanently removing data:

- Added `isDeleted` and `deletedAt` fields to User and Transaction models
- Created admin endpoints for soft deleting and restoring users and transactions
- Implemented filters to exclude soft-deleted items from regular queries

### Scheduled Jobs for Fraud Detection
Automated fraud detection runs on a schedule:

- Implemented using `node-cron` to run daily scans
- Created a scheduler service that detects suspicious patterns
- Logs all detected fraud cases for admin review

### Email Alerts for Large Transactions
The system sends alerts for potentially suspicious activity:

- Email notifications for transactions over $10,000
- Alerts when suspicious patterns are detected
- Mock email service implemented for demonstration purposes

## Testing with Postman

The project includes two Postman collections for testing the API:

1. **DigiWallet.postman_collection.json** - Contains endpoints for testing core features

2. **DigiWallet_Bonus_Features.postman_collection.json** - Contains endpoints specifically for testing the bonus features:
   - Soft delete and restore functionality for users and transactions
   - Fraud detection and email alerts

To use these collections:
1. Import them into Postman
2. Create an environment with the following variables:
   - `admin_token`: JWT token for an admin user
3. Use the Login endpoint to get a token and set it as the `admin_token` variable

## API Documentation

### Authentication Endpoints

- **Register User**: `POST /api/auth/register`
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```

- **Login User**: `POST /api/auth/login`
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```

- **Get User Profile**: `GET /api/auth/profile`
  - Requires Authentication

### Wallet Endpoints

- **Deposit Funds**: `POST /api/wallet/deposit`
  ```json
  {
    "amount": 100,
    "currency": "USD"
  }
  ```

- **Withdraw Funds**: `POST /api/wallet/withdraw`
  ```json
  {
    "amount": 50,
    "currency": "USD"
  }
  ```

- **Transfer Funds**: `POST /api/wallet/transfer`
  ```json
  {
    "recipientId": "user_id_here",
    "amount": 25,
    "currency": "USD",
    "description": "Payment for services"
  }
  ```

- **Get Transaction History**: `GET /api/wallet/transactions`
  - Query Parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)
    - `type`: Transaction type (deposit, withdrawal, transfer)

- **Get Balance**: `GET /api/wallet/balance`
  - Query Parameters:
    - `currency`: Currency code (optional, returns all currencies if not specified)

### Admin Endpoints

All admin endpoints require authentication and admin privileges.

- **Get All Users**: `GET /api/admin/users`
- **Get Flagged Transactions**: `GET /api/admin/transactions/flagged`
- **Run Fraud Scan**: `POST /api/admin/fraud-scan/run`
- **Get Total Balance**: `GET /api/admin/balance/total`
- **Get Top Users by Balance**: `GET /api/admin/users/top-by-balance`
- **Get Top Users by Transaction Volume**: `GET /api/admin/users/top-by-volume`

## Security Features

- Password hashing using bcrypt
- JWT token authentication
- Rate limiting for fraud prevention
- Transaction validation
- Secure HTTP headers with Helmet

## Bonus Features

- Scheduled job for daily fraud scans (commented in code, can be enabled with node-cron)
- Soft delete for accounts and transactions
- Multi-currency support

## License

This project is licensed under the ISC License.
