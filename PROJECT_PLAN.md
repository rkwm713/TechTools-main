# TechTools Project Plan

This document outlines the project plan for **TechTools**, a toolkit consisting of a Chrome extension, a web site and a desktop application.  The plan is organized into the standard project‑management phases and includes prompts to guide AI agents at each stage.

## Project Structure

The repository contains three packages in a root folder named `TechTools-main`:

* `TechTools-ext` – the Chrome extension package.
* `TechTools-site` – the web application package.
* `TechTools-desktop` – the Python desktop app.

## 1. Initiation

* **Define objectives** – Clarify the goal of each package and identify common functionality to share across platforms.
* **Feasibility analysis** – Assess the technical feasibility of sharing code between extension, site and desktop, and document any limitations.
* **Prompts for agents**:
  * “Summarize the objectives and scope of TechTools across Chrome extension, web app, and desktop app.”
  * “Evaluate feasibility of reusing core logic across extension, site, and Python desktop app.”

## 2. Planning

* **Detailed requirements** – Document functional and non‑functional requirements for all tools (e.g., calculators, note editor, checklist, settings).
* **Risk management** – Identify potential risks (e.g., UI inconsistency, performance, offline sync) and plan mitigations.
* **Resource and timeline planning** – Break tasks into sprints, assign roles, estimate effort and costs.
* **Architectural design** – Define a modular structure for shared logic and platform‑specific code. Plan how configuration settings will be stored and synchronized.
* **Prompts for agents**:
  * “Create a detailed list of functional requirements for each TechTools component (extension/site/desktop).”
  * “Suggest a modular architecture that allows sharing code between the extension, website and desktop app.”
  * “Draft a risk register and mitigation strategies for cross‑platform development.”

## 3. Implementation / Execution

The development phase should be iterative.  For each tool or feature:

1. **Refactor shared logic** – Extract the core logic of calculators and checklists into reusable modules (JavaScript/TypeScript for web and extension, Python for desktop).
2. **Develop user interfaces**:
   * **Extension** – Maintain MV3 manifest and implement UI with SARIA and NEUTRON fonts.  Ensure sequential input and copy‑to‑clipboard features.
   * **Website** – Replicate the extension UI in a full‑page layout and add settings pages for user preferences and clearance rules.
   * **Desktop app** – Build a Tkinter or PyQT interface.  Implement offline functionality and a sync mechanism for settings when connectivity is restored.
3. **Implement settings and updates** – Provide import/export of JSON configuration for clearance calculators and create an update mechanism for each platform.
* **Prompts for agents**:
  * “Refactor the feet‑inches and sag calculations into a shared module that can be used by both the extension and website.”
  * “Implement a settings page in the website for managing clearance defaults and importing/exporting JSON configurations.”
  * “Update the Python desktop app to read settings from a JSON file and sync them when network is available.”

## 4. Testing & Monitoring

* **Unit and integration testing** – Write automated tests for shared modules using appropriate frameworks (e.g., Jest for JavaScript, pytest for Python).  Ensure the UI and logic behave consistently across all platforms.
* **Performance optimization** – Profile resource‑intensive operations and refactor code to reduce redundant operations and improve speed.
* **Cross‑platform testing** – Test the software on various browsers and operating systems.  Use tools like Selenium/WebDriver and Appium for automated UI testing.
* **Continuous testing and feedback loops** – Collect user feedback and integrate it into subsequent development cycles.  Maintain a regression test suite to prevent reintroducing bugs.
* **Prompts for agents**:
  * “Write unit tests for the shared sag calculation module.”
  * “Generate automated UI tests for the Feet & Inches calculator across Chrome and the website.”
  * “Prepare a survey to collect user feedback about the new clearance settings page.”

## 5. Deployment

* **Extension deployment** – Package `TechTools-ext` for the Chrome Web Store, create update manifests, and write installation instructions.
* **Website deployment** – Host `TechTools-site` (e.g., on Netlify or Vercel) and set up continuous deployment triggered by repository commits.
* **Desktop distribution** – Package `TechTools-desktop` with PyInstaller (or equivalent) to create platform‑specific installers.
* **Prompts for agents**:
  * “Create a script to build and package the TechTools extension for the Chrome Web Store.”
  * “Prepare a deployment pipeline for the TechTools-site web app.”
  * “Build a cross‑platform installer for the TechTools‑desktop Python app using PyInstaller.”

## 6. Closure & Maintenance

* **Release & documentation** – Publish release notes and user/developer documentation.  Archive project documents when complete.
* **Post‑project review** – Conduct lessons‑learned sessions and document improvements for future releases.
* **Ongoing support** – Set up an issue tracker for bug reports and feature requests.  Plan regular updates for dependencies and platform compatibility.
* **Prompts for agents**:
  * “Draft a user manual and FAQ for TechTools users.”
  * “Compile a list of lessons learned from this project and propose improvements for the next release.”
  * “Set up a workflow to automate dependency updates and build testing.”
