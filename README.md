# CertPilot

CertPilot is a web application that helps you manage SSL certificates and AWS resources. It provides a user-friendly interface for managing AWS credentials and Route53 DNS records.

## Features

- User authentication (register, login, logout)
- Secure AWS credentials management via web UI
- Route53 DNS record management
- SSL certificate setup and management
- Modern, responsive UI with Tailwind CSS
- Consistent component library for streamlined UX

## UI/UX Features

- Modern color scheme with comprehensive design system
- Responsive design optimized for all device sizes
- Interactive components with hover effects and animations
- Accessible form elements with validation states
- Consistent card layout system with various design options
- Status indicators with visual cues for better UX
- Optimized navigation with mobile responsiveness
- Loading states and spinners for better feedback

## Technology Stack

- **Frontend**: React, Tailwind CSS, React Router, Axios, React Hook Form
- **Backend**: Node.js, Express, MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **AWS Integration**: AWS SDK for JavaScript

## Getting Started

### Prerequisites

- Docker and Docker Compose
- AWS account with appropriate permissions

### Running with Docker (Recommended)

#### Production

1. Clone the repository
```
git clone https://github.com/yourusername/certpilot.git
cd certpilot
```

2. Start the application with Docker Compose
```
docker-compose up -d
```

3. Access the application at `http://localhost`

#### Development

1. Clone the repository
```
git clone https://github.com/yourusername/certpilot.git
cd certpilot
```

2. Start the development environment
```
docker-compose -f docker-compose.dev.yml up -d
```

3. Access the application at `http://localhost:3000`
   - Backend API is available at `http://localhost:5001/api`
   - MongoDB is available at `mongodb://localhost:27017/certpilot`

### Manual Installation (Without Docker)

#### Prerequisites
- Node.js (v14+)
- MongoDB
- npm or yarn

1. Clone the repository
```
git clone https://github.com/yourusername/certpilot.git
cd certpilot
```

2. Install backend dependencies
```
cd backend
npm install
```

3. Install frontend dependencies
```
cd ../frontend
npm install
```

4. Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/certpilot
JWT_SECRET=your_jwt_secret_here
```

5. Start the backend server
```
cd backend
npm run dev
```

6. Start the frontend development server
```
cd frontend
npm run dev
```

7. Access the application at `http://localhost:3000`

## UI Components

CertPilot includes a comprehensive set of reusable UI components:

- `Button` - Customizable button with multiple variants and states
- `Card` - Flexible card component with various styling options
- `Input` - Form input with validation states and icons
- `StatusBadge` - Visual status indicators
- `AlertBanner` - Notification banners for user feedback
- `Modal` - Dialog component with animations
- `Spinner` - Loading indicators
- `Navbar` - Responsive navigation with mobile support

## AWS Permissions

The application requires AWS credentials with the following permissions:

- Route53 access for DNS record management
- Ability to list and modify hosted zones

For security best practices, it's recommended to create a dedicated IAM user with only the necessary permissions.

## Security Considerations

- AWS credentials are encrypted before being stored in the database
- Authentication is required for all sensitive operations
- JWT tokens are used for secure API access

## License

This project is licensed under the MIT License. 