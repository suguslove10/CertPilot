# CertPilot Frontend

Modern UI/UX improvements for CertPilot - a certificate management application.

## UI/UX Improvements

This version includes major UI/UX improvements:

- Modern color scheme with Indigo-based design system
- Comprehensive component library for consistent UI
- Responsive design optimized for all devices
- Improved navigation with mobile support and active state indicators
- Enhanced card components with hover effects and animations
- Status badges with customizable variants and animations
- Alert banners with auto-close functionality
- Consistent typography with Inter font family
- Smooth animations and transitions with configurable timing
- Better form controls with validation states
- Loading spinners and state indicators for better feedback
- Modal dialogs with backdrop blur and animations
- Accessible components with proper ARIA attributes

## Components

- `Button` - Versatile button component with 11 variants, 5 sizes, and icon support
- `Card` - Flexible card component with multiple styling options and hover effects
- `Input` - Form input with validation states, icons, and help text
- `StatusBadge` - Visual status indicators with customizable sizes and animations
- `AlertBanner` - Notification banners with auto-close functionality
- `Modal` - Dialog component with backdrop, animations, and focus management
- `Spinner` - Loading indicators with various sizes and colors
- `Navbar` - Responsive navigation with mobile drawer and active state tracking

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

2. Initialize Tailwind CSS config:
```bash
npx tailwindcss init -p
```

3. Run the build to generate the new UI:
```bash
npm run build
```

## Technologies Used

- React 18+
- React Router 6+
- Tailwind CSS 3.4+
- Axios for API requests
- React Toastify for notifications

## Project Structure

- `src/components` - Reusable UI components
  - `src/components/index.js` - Central export for all components
- `src/pages` - Main application screens
- `src/context` - React context providers
- `src/tailwind.config.js` - Tailwind CSS configuration
- `src/index.css` - Global styles and Tailwind imports 