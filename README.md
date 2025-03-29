# Startup Platform

A web application that connects startups with skilled contributors. Startups can post tasks and find talent, while contributors can discover opportunities that match their skills and get compensated in cash or equity.

## Features

- **User Authentication**: Register and login as either a startup or a contributor
- **Startup Dashboard**: Manage tasks, review applications, and track progress
- **Contributor Dashboard**: Browse available tasks, apply, and submit completed work
- **Task Management**: Create, view, and manage tasks with detailed information
- **Skill Matching**: Match tasks with contributors based on required skills
- **Review System**: Evaluate submissions and provide feedback

## Tech Stack

- **Frontend**: React.js with React Router for routing
- **Styling**: Tailwind CSS for responsive UI
- **Authentication**: Context API for managing user authentication state

## Project Structure

```
src/
├── components/
│   ├── common/           # Shared components (Navbar, Footer, etc.)
│   ├── contributor/      # Contributor-specific components
│   ├── startup/          # Startup-specific components
│   └── task/             # Task-related components
├── contexts/             # React context providers
├── pages/                # Page components
│   ├── auth/             # Authentication pages
│   ├── contributor/      # Contributor pages
│   ├── startup/          # Startup pages
│   └── task/             # Task-related pages
├── services/             # API service layer
└── utils/                # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or later)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/startup-platform.git
cd startup-platform
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npm start
# or
yarn start
```

4. Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## Development Setup

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
REACT_APP_API_URL=http://localhost:8000/api
```

### Mock Data

The current implementation uses mock data for demonstration purposes. In a production environment, you would replace the mock data with actual API calls.

### Authentication

The `AuthContext.jsx` file contains a simplified authentication system. In a real environment, you would replace this with an actual authentication provider (Firebase, Auth0, etc.).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Component Documentation

### Common Components

- **Footer**: Displays copyright information and links
- **Navbar**: Navigation component with responsive mobile menu
- **PrivateRoute**: Route wrapper for authenticated pages
- **SkillBadge**: Displays a skill with category-based styling
- **SkillSelector**: Component for selecting skills from available options
- **TaskCard**: Card component for displaying task information

### Task Components

- **ReviewForm**: Form for reviewing task submissions
- **TaskSubmissionForm**: Form for submitting completed tasks

### Pages

- **Home**: Landing page with calls to action
- **Login/Register**: Authentication pages
- **Dashboard**: User dashboard (startup or contributor)
- **TaskBrowser**: Browse and filter available tasks
- **TaskDetail**: Detailed view of a task with actions
- **Profile**: User profile management
- **TaskCreate**: Form for creating new tasks
- **TaskManage**: Manage tasks created by a startup

## Deployment

Build the app for production:

```bash
npm run build
# or
yarn build
```

This creates a `build` folder with optimized production files.

Deploy these files to your hosting provider of choice (Netlify, Vercel, AWS, etc.).

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [React.js](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
