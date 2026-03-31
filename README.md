# Rebloxed

**Rebloxed** is a high-performance, lightweight custom launcher for Roblox built with Tauri, React, and TypeScript.

---

## Overview

Rebloxed streamlines the process of launching Roblox by removing unnecessary overhead and giving users direct control over client behavior. It is designed for users who want improved performance, easier account management, and deeper customization options.

---

## Features

### Account Manager

Switch between multiple Roblox accounts without repeated logins.

### Modern User Interface

A clean, responsive dark-themed interface built with React.

### Lightweight Architecture

Powered by Rust through Tauri for minimal CPU and memory usage.

---

## Tech Stack

* **Frontend:** React + Vite
* **Language:** TypeScript
* **Backend:** Rust (Tauri)

---

## Getting Started

### Prerequisites

Make sure the following tools are installed:

* **Rust** (via `rustup`)
* **Node.js** (latest LTS recommended)
* **System dependencies for Tauri** (refer to official Tauri documentation for your OS)

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

* Visual Studio Code
* Tauri Extension
* rust-analyzer
* ESLint

Contributions are welcome. Please ensure your changes are well-tested and follow the existing project structure.

---

## Disclaimer

Rebloxed is a third-party tool and is not affiliated with, maintained by, or endorsed by Roblox Corporation. Use this software responsibly and ensure compliance with Roblox’s Terms of Service.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
