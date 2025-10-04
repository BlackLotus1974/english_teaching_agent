# English Practice Buddy - Setup Guide

A simple AI English tutor for your child to practice conversational English and pronunciation.

## Quick Setup (5 minutes)

### Step 1: Get Your OpenAI API Key

1. Go to https://platform.openai.com/settings/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-...`)

### Step 2: Configure the App

1. Create a `.env` file in this folder:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` and add your API key:
   ```
   OPENAI_API_KEY="sk-your-actual-key-here"
   ```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Start the App

```bash
npm run dev
```

The app will open at: http://localhost:3000

## How to Use

1. Click the **"Connect"** button to start
2. Allow microphone access when prompted
3. The AI tutor will greet your child and start the conversation
4. Your child can talk naturally - the AI will listen and respond
5. The AI will gently correct pronunciation mistakes
6. Click **"Disconnect"** when done

## Features

✓ Natural voice conversations
✓ Real-time pronunciation feedback
✓ Gentle, encouraging corrections
✓ Age-appropriate topics
✓ 3-5 minute sessions
✓ No data stored - completely private

## Cost

Approximately **$0.10-0.15 per 15-minute session**

For 30-40 sessions per month: ~$3-6/month

## Tips

- Use a good microphone for best results
- Practice in a quiet room
- Sessions work best when 3-5 minutes long
- The AI will naturally end conversations after a good practice session

## Troubleshooting

**Microphone not working?**
- Check browser permissions (click the lock icon in address bar)
- Make sure no other app is using the microphone

**AI not responding?**
- Check your `.env` file has the correct API key
- Make sure you have API credits in your OpenAI account

**Connection issues?**
- Restart the server: Stop it (Ctrl+C) and run `npm run dev` again

## Privacy & Safety

- No conversations are stored
- No user accounts needed
- API key stays on your computer
- Works completely offline except for API calls to OpenAI

## Customization

Want to change the tutor's personality or focus?

Edit the instructions in: `client/components/ToolPanel.jsx` (lines 3-36)

## Need Help?

Check the original OpenAI Realtime Console docs:
https://github.com/openai/openai-realtime-console

---

**Have fun practicing English! 🌟**
