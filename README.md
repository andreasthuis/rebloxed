# Rebloxed

**Rebloxed** is a lightweight custom launcher for Roblox that is built with Tauri, React, and TypeScript.

---

## Features

### Account Manager

Easily switch between multiple Roblox accounts without having to log in repeatedly.

### Modern User Interface

Enjoy a clean and responsive dark-themed interface made with React.

### Lightweight Architecture

Designed with Rust through Tauri for minimal CPU and memory use.

---

## Tech Stack

- **Frontend:** React + Vite
- **Language:** TypeScript
- **Backend:** Rust (Tauri)

---

## Getting Started

### Prerequisites

Make sure you have the following tools installed:

- **Rust** (via `rustup`)
- **Node.js** (latest LTS is recommended)
- **System dependencies for Tauri** (check the official Tauri documentation for your OS)

---

### Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/rebloxed.git
cd rebloxed
```

Install dependencies:

```bash
npm install
```

Run in development mode:

```bash
npm run tauri dev
```

Build for production:

```bash
npm run tauri build
```

---

## Project Structure

```
src/                  # React frontend (components, hooks, styles)
src-tauri/            # Rust backend (system commands, file I/O, process handling)
src-tauri/capabilities/ # Tauri permission configurations
```

---

## Contributing

### Recommended Development Setup

For the best development experience, use:

- Visual Studio Code
- Tauri Extension
- rust-analyzer
- ESLint

Contributions are welcome. Please test your changes and follow the existing project structure.

---

## Disclaimer

Rebloxed is a third-party tool that is not affiliated with, maintained by, or endorsed by Roblox Corporation. Use this software responsibly and follow Roblox’s Terms of Service.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.