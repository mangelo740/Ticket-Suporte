# Project Summary
The **Ticket Support System** is a robust web application designed to streamline the management of support requests for technical support teams. It enables users to efficiently submit, track, and manage support tickets through a user-friendly interface. The system leverages SQLite for reliable data storage and features an administrative dashboard for real-time ticket management, including filtering and detailed insights. Recent updates have focused on improving the user interface with a dark theme and yellow accents for buttons and banners.

# Project Module Description
- **Ticket Submission**: Users can easily submit new support tickets via a streamlined form.
- **Admin Panel**: Admins have access to view, filter, and manage tickets with detailed information.
- **File Upload**: Users can attach files to tickets, with image previews supported.
- **Notes and Comments**: Users can add notes for better tracking and collaboration.
- **API Integration**: A RESTful API enables CRUD operations on tickets and associated data.

# Directory Tree
```
sistema-tickets/
├── db/                     # SQLite database files
├── dist/                   # Production-ready files
│   ├── assets/             # Static resources (CSS/JS)
│   ├── index.html          # Ticket submission page
│   ├── admin.html          # Admin panel
│   ├── 404.html            # 404 error page
│   └── server.js           # Express server for production
├── src/                    # Source code (development)
│   ├── api/                # API routes
│   │   └── ticketRoutes.js  # Routes for ticket management
│   ├── db/                 # Database modules
│   │   └── database.js      # SQLite client and operations
│   ├── db-migration.js      # Script for migrating data from localStorage
│   ├── styles.css           # Original CSS styles
│   ├── script.js            # JavaScript for the ticket form
│   └── admin.js             # JavaScript for the admin panel
├── package.json            # Project configuration
├── .gitignore              # Git ignored files
└── README.md               # Documentation
```

# File Description Inventory
- **db/**: Contains SQLite database files.
- **dist/**: Contains production-ready files, including minified assets and HTML pages.
- **src/api/ticketRoutes.js**: Handles API requests for ticket management.
- **src/db/database.js**: Manages SQLite database operations.
- **src/db-migration.js**: Script for migrating data from localStorage to SQLite.
- **dist/server.js**: Sets up an Express server to serve the application.

# Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Express.js (for serving the application in production)
- **Database**: SQLite (using better-sqlite3)
- **Security**: Helmet for secure HTTP headers
- **Performance**: Compression middleware for gzip

# Usage
### Installation
```bash
# Clone the repository
git clone https://github.com/seu-usuario/sistema-tickets.git
cd sistema-tickets

# Install dependencies
npm install
```

### Execution
```bash
# Start in production mode
npm start

# Start in development mode
npm run dev
```

### Build
```bash
# Build minified files
npm run build
```

### Data Migration
To migrate existing tickets from localStorage to SQLite:
```bash
# First, export data from localStorage to a JSON file
# Place the file in /data/tickets.json

# Run the migration script
node src/db-migration.js
```
