# Coach AI - AI Interview Preparation Platform

Coach AI is a full-stack MERN application that helps users practice job interviews through text-based and live voice interviews. It includes user authentication, role-based question banks, answer evaluation, camera readiness checks, speech transcription, and interview performance summaries.

## Features

- **User Authentication:** Register, log in, and log out securely.
- **Job Role Selection:** Choose a predefined job role or enter a custom role.
- **Randomized Question Sets:** Generate a fresh set of interview questions for each new interview.
- **Text Interview:** Read questions on screen and submit answers.
- **Live Voice Interview:** Listen to questions, answer by speaking, and view live speech transcription.
- **AI Coach Voice:** Browser speech playback with neural voice integration when available.
- **Camera Readiness Check:** Browser-based face detection and camera readiness scoring.
- **Answer Evaluation:** Evaluate answers using text similarity scoring.
- **Performance Summary:** View the interview score, feedback, and performance rubric.
- **Session Management:** Maintain interview progress during an active session.

## Tech Stack

**Frontend**
- React
- Vite
- Tailwind CSS
- Axios
- React Router
- MediaPipe Tasks Vision
- Web Speech API

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- Express Session
- Connect-Mongo
- bcryptjs
- Google Gemini API for neural voice integration

## Project Structure

```text
Coach-AI/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── data/
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md
```

*Note: The structure above describes the main folders. Your actual project may contain additional files.*

## Prerequisites

Install the following before running the application:

- [Node.js](https://nodejs.org/) - use a version supported by your installed project dependencies.
- npm - included with Node.js.
- [MongoDB Atlas](https://www.mongodb.com/atlas) account or another accessible MongoDB deployment.
- [Git](https://git-scm.com/) for cloning the repository.
- Google Gemini API key if you want to use the neural voice feature.

Google Chrome or Microsoft Edge is recommended for the browser speech recognition features.

## 1. Clone the Repository

Open a terminal or PowerShell and run:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd Coach-AI
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.

## 2. Configure MongoDB Atlas

1. Sign in to MongoDB Atlas.
2. Create a cluster if you do not already have one.
3. Create a database user with a strong password.
4. Configure Network Access to permit connections from your development machine.
5. Open **Connect → Drivers** and copy the MongoDB connection string.
6. Replace the username, password, and database name with your actual values.

Example connection string:

```text
mongodb+srv://USERNAME:PASSWORD@YOUR-CLUSTER.mongodb.net/coach_ai?retryWrites=true&w=majority
```

Keep the database credentials private. Do not commit them to GitHub.

## 3. Configure Backend Environment Variables

Navigate to the backend folder:

```bash
cd server
```

Create a file named `.env` inside the `server` directory.

Example configuration:

```env
PORT=8080
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR-CLUSTER.mongodb.net/coach_ai?retryWrites=true&w=majority
SESSION_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
```

Update the example values with your actual configuration.

**Important:**
- Use your real MongoDB Atlas connection string.
- Replace `SESSION_SECRET` with a long, unpredictable secret.
- Add the Gemini key only if your backend voice service uses `GEMINI_API_KEY`. Check your voice configuration for any additional required variables.
- Never commit `.env` to GitHub.
- Do not expose backend API keys through frontend environment variables prefixed with `VITE_`.

Ensure your `.gitignore` excludes environment files:

```gitignore
node_modules/
client/node_modules/
server/node_modules/
client/dist/
.env
.env.*
!.env.example
.vercel/
```

## 4. Install Backend Dependencies

From the `server` directory, run:

```bash
npm install
```

Make sure your backend `package.json` contains the appropriate start scripts. If it already provides a development script using Nodemon, use that script. For example:

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  }
}
```

Do not overwrite your existing `package.json` just to add this example. Keep all existing dependencies and scripts, merging only what is missing.

## 5. Install Frontend Dependencies

Open a **second terminal** at the project root and run:

```bash
cd client
npm install
```

The frontend uses Vite. Check that your `client/package.json` includes the appropriate scripts. A typical configuration is:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

Keep your existing dependencies and scripts when applying this example.

## 6. Run the Backend Server

In the first terminal:

```bash
cd server
npm run dev
```

If your project has no `dev` script but has a `start` script, use:

```bash
npm start
```

The backend should start on:

```text
http://localhost:8080
```

If the server fails to connect to MongoDB, verify `MONGODB_URI`, your database username and password, and Atlas Network Access settings.

## 7. Run the Frontend Client

In the second terminal:

```bash
cd client
npm run dev
```

Vite normally starts the development server at:

```text
http://localhost:5173
```

Open that address in your browser.

The frontend API service should point to the backend API. If your Axios configuration uses the `VITE_API_URL` environment variable, you can create `client/.env.local` containing:

```env
VITE_API_URL=http://localhost:8080/api
```

If your existing API service already has this local default, this additional file is optional. Restart Vite after changing environment variables.

## 8. Run Both Servers Together

You need two running terminal sessions during local development.

**Terminal 1 - Backend**

```bash
cd server
npm run dev
```

**Terminal 2 - Frontend**

```bash
cd client
npm run dev
```

Then visit:

**http://localhost:5173**

Keep both terminals running while using the application.

## 9. Test the Application

After both servers are running:

1. Register a new account.
2. Log in with your credentials.
3. Select a job role or enter a custom role.
4. Choose Text Interview or Voice Interview.
5. Complete the camera readiness check.
6. Answer the interview questions.
7. Test Next, Back, Submit, Repeat, and microphone controls as applicable.
8. Finish the interview and check the performance summary.
9. Start another interview and verify that a new randomized question set is selected.

## Voice and Camera Notes

- Grant camera and microphone permissions when prompted.
- Use Chrome or Edge for better compatibility with browser speech recognition.
- Voice recognition availability depends on browser support.
- Neural voice generation requires a valid server-side API key and a working voice service.
- The browser may need internet access to load the MediaPipe face detection model and its supporting files.
- If speech recognition or neural voice does not work, inspect the browser console and backend terminal logs.

## Troubleshooting

| Problem | Things to check |
|---|---|
| Backend won't start | Check Node.js version, dependencies, environment variables, and the server entry point. |
| MongoDB connection error | Verify the URI, credentials, database permissions, and Network Access. |
| Frontend cannot connect to backend | Check the Axios base URL, backend port, server status, and CORS/session configuration. |
| Login does not persist | Check the session store, session secret, cookie settings, and whether browser cookies are being sent. |
| Camera check does not detect a face | Grant camera permission, ensure the camera is working, and check browser console errors. |
| Voice recognition doesn't work | Use a compatible browser, grant microphone permission, and check Web Speech API support. |
| Neural voice fails | Check server-side API-key configuration and backend logs. |
| Questions are repeated across interviews | Verify the question-bank exports and confirm the randomized question array is stored and reused for the active session. |
| Frontend build fails | Run `npm install` from `client` and inspect the first build error. |
| Backend build/start fails | Run `npm install` from `server` and inspect the first terminal error. |

## Environment and Security

- Do not commit `.env` files, credentials, session secrets, or API keys.
- Use strong, unique credentials.
- Keep API keys on the backend.
- Use HTTPS and production-appropriate session-cookie settings when deploying.
- Configure CORS and session cookies for the actual deployed frontend and backend domains.
- Configure MongoDB Atlas access carefully rather than leaving database access unnecessarily open.

## Deployment

The frontend and backend can be deployed as separate projects on Vercel from the same GitHub repository.

- **Frontend project:** Root Directory `client`, build command `npm run build`, output directory `dist`.
- **Backend project:** Root Directory `server`; configure the Express entry point, production environment variables, and MongoDB Atlas connection.
- Configure API routing so frontend requests reach the deployed backend.
- Set production environment variables in Vercel instead of uploading `.env`.
- Test authentication, sessions, interview flows, and voice features using the deployed URLs.

Deployment configuration may require adjustments to the current Express entry point, session settings, and API rewrites.

## License

Add your preferred license here before distributing or open-sourcing the project.
