# Live Quiz Platform

A high-performance, real-time interactive quiz platform built with Next.js and Firebase. This application allows professors to create, manage, and host live quizzes with students. The system natively supports local network features allowing multi-device accessibility.

## Professor Features

The **Professor Dashboard** is your complete toolkit to manage student assessments effortlessly.

- **Secured Analytics & Control Room:** The entire dashboard is protected by a PIN. By default, it uses the PIN set in the `.env.local` configuration (`NEXT_PUBLIC_PROFESSOR_PIN=4826`).
- **Create Quizzes Manually:** Instantly create interactive quizzes. Just write your questions, specify up to 4 options, dictate the correct answer, and add helpful hints.
- **Dual-Link Distribution:** Upon creating a quiz out of a topic, you receive two exclusive links:
  - **Host Link:** For controlling the timing, progression, and displaying results/leaderboard.
  - **Student Join Link:** A public link where students enter their name (or a generated code) to participate on their own devices.
- **Dashboard Management:** View all created quizzes (Waiting, Active, Finished), jump right into the Host interface, or delete archived quizzes.

## Setup Instructions for Professors

To ensure immediate setup across systems:

1. **Prerequisites Checklist:** 
   You need **Node.js** installed on your machine.
   *Note: If you are setting this up via the provided self-installer (`QuizApp_Installer.bat`), it will automatically fetch and install Node.js for you.*

2. **Environment Variables (.env.local):**
   Ensure `.env.local` rests at your project's root. At minimum, add your Firebase keys and a secure Professor PIN:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_PROFESSOR_PIN=4826
   ```

3. **Using the Installer (Windows Only):**
   - Double click on `QuizApp_Installer.bat`.
   - It will install dependencies, configure directories under `C:\QuizPlatform`, and generate a handy Start Menu & Desktop Icon titled **"Start Quiz Server"**.
   - Simply click the icon to launch the server and open the browser automatically.

4. **Running Locally (Manual):**
   - Run `npm install` to gather dependencies.
   - Run `npm run dev` to start the execution environment.
   - Using your web browser, navigate either to `http://localhost:3000/professor` (locally) or `<your-ipv4>:3000/professor` (via network) and type your PIN.

---

### Developed for Modern Connectivity
Built using **Next.js**, **React**, **Tailwind CSS**, and **Firebase Firestore** for lightweight, blazing-fast real-time database synchronizations across student devices down to the millisecond.
