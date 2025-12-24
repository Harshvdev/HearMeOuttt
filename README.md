# HearMeOuttt 🗣️

HearMeOuttt is a simple, anonymous web app where anyone can share thoughts, daily experiences, ideas, or feelings without creating an account. Whether you're feeling happy, confused, thoughtful, or just want to speak out, **HearMeOuttt** offers a judgment-free public space to be heard.

This project focuses on designing, building, and deploying a real-world web product with attention to usability, safety, and reliability.

> 💬 This isn’t just a confession site — you’re free to share daily experiences, thoughts, ideas, or feelings anonymously, as long as they follow community guidelines.

🛡️ Please keep posts respectful and avoid sharing anything illegal, harmful, or offensive. This is a public space meant to be safe for everyone.

---

## 🔗 Live Preview

🌍 [Try It Here](https://hearmeouttt.netlify.app)

📂 [Source Code on GitHub](https://github.com/Harshvdev/HearMeOut)

---

## ✨ Features

- 📝 Share posts anonymously with word and character limits
- 🌙 Dark mode toggle
- 🧠 Smart cooldown system (prevents spam with a 5-minute delay per user)
- 🚨 Community report system (posts with 3+ reports are automatically hidden)
- 📅 Human-readable timestamps for each post
- 💬 Real-time feed powered by Firestore
- 🛠️ Feedback modal to report bugs or suggest improvements
- 🔒 Anonymous, client-side interactions with no user accounts
- 📱 Mobile-responsive and performance-focused UI

---

## 🧱 Architecture Overview

- **Frontend:** Vanilla HTML, CSS, and JavaScript
- **Backend:** Firebase Firestore (real-time database)
- **Hosting:** Netlify
- **Design:** Modern CSS using `:root` variables with dark mode support

The app is fully client-side, with Firestore handling real-time updates and moderation logic based on report thresholds.

---

## 🧰 Tech Stack

- HTML, CSS & JavaScript (Vanilla)
- Firebase Firestore (Modular SDK v9+)
- Netlify Hosting
- Environment-based configuration
- Accessibility-aware UI with live feedback patterns

---

## 🚀 How to Run It Locally (Optional)

> **Note:** This is only required if you want to explore or experiment with the code.

### 1. Clone the repository

```bash
git clone https://github.com/Harshvdev/HearMeOut.git
cd HearMeOut

2. Install dependencies
npm install

3. Create a .env file and add your Firebase config
VITE_API_KEY=your_api_key
VITE_AUTH_DOMAIN=your_auth_domain
VITE_PROJECT_ID=your_project_id
VITE_STORAGE_BUCKET=your_storage_bucket
VITE_MESSAGING_SENDER_ID=your_sender_id
VITE_APP_ID=your_app_id

4. Start the local development server
npm run dev


You can also open index.html directly, but Firebase features will not work without proper configuration.

🧠 Development Notes

This project was built using AI-assisted development alongside official documentation and learning resources.

My focus was on:

Designing product flow and features

Debugging issues through testing and iteration

Making security-aware decisions (rate limiting, moderation logic)

Deployment, configuration, and real-world usability

I can explain the architecture, data flow, feature decisions, and trade-offs involved in this project.

🙋‍♂️ Creator

Harsh Vardhan Shukla
🌐 GitHub

Open to feedback, suggestions, and thoughtful collaboration.

🛡️ License

This repository is shared publicly for learning, transparency, and demonstration purposes.

Commercial use, redistribution, or public cloning of this project without permission is not allowed.

If you’re interested in collaboration or licensed use, feel free to reach out.

© 2025 Harsh Vardhan Shukla. All rights reserved.