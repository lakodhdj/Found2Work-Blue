# Found2Work Project Instructions

## Project Overview
Found2Work is a modern, full-featured job search and vacancy posting platform built with React and Vite. The application supports three types of users: Job Seekers, Employers, and Administrators.

## Architecture

### Component Structure
- **App.jsx**: Main application component with user state management and routing logic
- **Login.jsx**: Authentication component with user type selector
- **UserDashboard.jsx**: Interface for job seekers
- **EmployerDashboard.jsx**: Interface for employers
- **AdminDashboard.jsx**: Interface for administrators

### Data Management
- Local state management using React hooks (useState)
- Mock data for demonstrations
- Each user type has separate data and functionality

### Styling
- Global styles in `src/styles/index.css`
- Component-specific styles in separate CSS files
- Responsive design with mobile-first approach
- CSS variables for consistent theming

## Key Features

### For Job Seekers
- Search and filter job listings
- Save favorite jobs
- Apply to positions
- View profile and application history

### For Employers
- Post new job vacancies
- Manage published vacancies
- View application statistics
- Edit and delete listings

### For Administrators
- View platform statistics
- Manage user accounts
- Review and handle reports
- System settings and configuration

## Development

### Running the Project
```bash
npm install
npm run dev
```

The application runs on http://localhost:3000

### Building for Production
```bash
npm run build
```

### Project Structure
```
work-site/
├── public/
├── src/
│   ├── components/
│   │   ├── Login.jsx
│   │   ├── UserDashboard.jsx
│   │   ├── EmployerDashboard.jsx
│   │   └── AdminDashboard.jsx
│   ├── styles/
│   │   ├── App.css
│   │   ├── Login.css
│   │   ├── Dashboard.css
│   │   └── index.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## Design System

### Color Palette
- **Primary**: #6366f1 (Indigo)
- **Primary Dark**: #4f46e5
- **Primary Light**: #818cf8
- **Secondary**: #ec4899 (Pink)
- **Success**: #10b981 (Green)
- **Warning**: #f59e0b (Amber)
- **Danger**: #ef4444 (Red)

### Typography
- Font Family: System UI stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', etc.)
- Use semantic HTML and proper heading hierarchy

### Spacing
- Base unit: 1rem (16px)
- Consistent gaps and padding throughout
- Mobile-responsive breakpoints at 768px and 480px

## Demo Credentials
- Email: demo@found2work.com
- Password: demo123
- User Types: User (Job Seeker), Employer, Admin

## Future Enhancement Ideas
- Backend API integration
- Database connectivity
- Real-time notifications
- Advanced search with AI
- User ratings and reviews
- Social media integration
- PDF resume export
- Video interview feature

## Dependencies
- react: ^18.2.0
- react-dom: ^18.2.0
- vite: ^5.0.8
- @vitejs/plugin-react: ^4.2.1

## Notes
- The application uses mock data for demonstration purposes
- State is managed locally in React components
- No backend API calls are currently implemented
- All data is reset on page refresh

---
Created: March 2024
Version: 1.0.0
