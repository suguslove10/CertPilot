# CertPilot Frontend

Modern UI/UX improvements for CertPilot - a certificate management application.

## UI/UX Improvements

This version includes major UI/UX improvements:

- Modern color scheme and design language
- Responsive design for all devices
- Improved navigation with active state indicators
- Enhanced card components with hover effects
- Status badges with icons for better visibility
- Alert banners for notifications and warnings
- Consistent typography with Inter font
- Smooth animations and transitions
- Better table styling for data display

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Rebuilding the Application

If you're updating from an older version:

1. Install Tailwind CSS dependencies:
```bash
npm install -D tailwindcss postcss autoprefixer
```

2. Run the build to generate the new UI:
```bash
npm run build
```

## Technologies Used

- React
- React Router
- Tailwind CSS
- Axios for API requests
- React Toastify for notifications

## Project Structure

- `src/components` - Reusable UI components
- `src/pages` - Main application screens
- `src/context` - React context providers 