# MOWED (Mathematical Optimization With End-user Devices)

MOWED is a web-based application that brings the power of mathematical optimization to end-users, making it accessible and user-friendly for various applications.

## Tagline

"MOWED: Mowing down inequalities"

## Description

MOWED aims to democratize access to optimization tools, bridging the gap between optimization experts and the general public. It provides a user-friendly interface for various optimization problems, starting with personal finance management.

## Features

- Modular architecture for easy addition of new optimization problems
- Personal Finance module for basic financial optimization
- Data persistence using localStorage
- Interactive UI with real-time optimization results
- Visualization of results using Chart.js
- State management with Vuex
- Responsive design for various device sizes

## Technical Stack

### Frontend
- **Framework**: Vue.js 3
- **Build Tool**: Vite
- **State Management**: Vuex 4
- **UI Components**: Custom Vue components
- **Styling**: CSS with scoped styles in Vue components

### Data Management
- **Local Storage**: Browser's localStorage API for data persistence
- **State Management**: Vuex store for application-wide state

### Optimization Engine
- Currently using simple JavaScript functions for optimization
- Designed to be extensible for more complex algorithms in the future

### Testing
- **Unit Testing**: Jest
- **End-to-End Testing**: Cypress
- **Component Testing**: Vue Test Utils

## Project Structure

The MOWED project follows a typical Vue.js application structure with some custom directories for optimization modules. Here's an overview of the main directories and their purposes:
mowed/
├── public/                     # Static assets served as-is
│   ├── favicon.ico             # Website favicon
│   └── index.html              # Main HTML file
├── src/                        # Source files for the application
│   ├── assets/                 # Static assets that will be processed by Vite
│   ├── components/             # Vue components
│   ├── core/                   # Core functionality and interfaces
│   │   └── ModuleInterface.js  # Base class for optimization modules
│   ├── modules/                # Optimization module implementations
│   │   └── PersonalFinance.js  # Personal Finance module
│   ├── store/                  # Vuex store for state management
│   │   └── index.js            # Main store file
│   ├── utils/                  # Utility functions
│   │   └── storage.js          # LocalStorage utilities
│   ├── App.vue                 # Root Vue component
│   └── main.js                 # Application entry point
├── tests/                      # Test files
│   ├── unit/                   # Unit tests (Jest)
│   └── e2e/                    # End-to-end tests (Cypress)
├── .gitignore                  # Git ignore file
├── package.json                # NPM package configuration
├── vite.config.js              # Vite configuration
├── jest.config.js              # Jest configuration for unit tests
├── cypress.config.js           # Cypress configuration for e2e tests
└── README.md                   # This file

### Directory Purposes:

- `public/`: Contains static assets that are served as-is. The `index.html` file here is the main entry point for the application.

- `src/`: The main source directory for the application code.
  - `assets/`: Static files that will be processed by Vite (e.g., images, styles).
  - `components/`: Vue components used throughout the application.
  - `core/`: Core functionality, including the `ModuleInterface` base class for optimization modules.
  - `modules/`: Implementation of specific optimization modules (e.g., PersonalFinance).
  - `store/`: Vuex store for centralized state management.
  - `utils/`: Utility functions, including storage helpers for localStorage.

- `tests/`: Contains all test files.
  - `unit/`: Jest unit tests for individual components and functions.
  - `e2e/`: Cypress end-to-end tests for testing the application as a whole.

- Configuration files:
  - `vite.config.js`: Configuration for the Vite build tool.
  - `jest.config.js`: Configuration for Jest unit testing.
  - `cypress.config.js`: Configuration for Cypress e2e testing.
  - `package.json`: NPM package configuration and script definitions.

This structure is designed to keep the codebase organized and modular, allowing for easy expansion with new optimization modules and features.

### Data Visualization
- Chart.js for creating interactive and responsive charts

### Module System
- Custom module interface for creating new optimization modules
- Dynamic module loading using Vue's component system

## Getting Started

### Prerequisites

- Node.js (version 14 or later recommended)
- npm (usually comes with Node.js)

### Installation

1. Clone the repository:
git clone https://github.com/bkhsoftware/mowed.git
cd mowed

2. Install dependencies:
npm install

3. Start the development server:
npm run dev

4. Open your browser and navigate to `http://localhost:3000`

## Running Tests

- To run unit tests:
npm run test:unit

- To run end-to-end tests:
npm run test:e2e

## Building for Production

To create a production build:
npm run build
Copy
The built files will be in the `dist/` directory.

## Adding a New Module

1. Create a new file in `src/modules/` for your module (e.g., `NewModule.js`)
2. Implement the module interface (see `PersonalFinance.js` for an example)
3. Create a corresponding Vue component in `src/components/`
4. Register the module in `src/main.js`
5. Add the module to the module selector in `src/components/ModuleSelector.vue`

## State Management

The Vuex store is defined in `src/store/index.js`. It handles:

- Current selected module
- Module-specific data
- Application-wide settings (if any)

## Data Persistence

Data is persisted using the browser's localStorage. The implementation can be found in `src/utils/storage.js`.

## Built With

- [Vue.js](https://vuejs.org/) - The web framework used
- [Vuex](https://vuex.vuejs.org/) - State management
- [Vite](https://vitejs.dev/) - Build tool and development server
- [Chart.js](https://www.chartjs.org/) - Used for data visualization
- [Jest](https://jestjs.io/) - Testing framework
- [Cypress](https://www.cypress.io/) - End-to-end testing framework

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/bkhsoftware/MOWED/tags).

## Authors

* **Björn Kenneth Holmström** [BjornKennethHolmstrom](https://bjornkennethholmstrom.wordpress.com/)

## License

This project is licensed under a custom License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Claude A.I.
* Friends and family for support and infrastructure
