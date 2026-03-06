# Setup Instructions

## OpenAI API Key

Before using the SF Care Navigator, you need to set your OpenAI API key.

### Option 1: Set in Browser Console (Development)

1. Open the app in your browser
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Paste the following command (replace with your actual API key):

```javascript
localStorage.setItem('openai_key', 'sk-your-actual-api-key-here');
```

5. Press Enter
6. Refresh the page

### Option 2: Modify the Code

Edit `src/SFCareNavigator.jsx` and replace:
```javascript
const apiKey = localStorage.getItem('openai_key');
```

With your API key directly (for testing only):
```javascript
const apiKey = 'sk-your-actual-api-key-here';
```

## Get an OpenAI API Key

1. Visit [https://platform.openai.com/api/keys](https://platform.openai.com/api/keys)
2. Sign up or log in to your OpenAI account
3. Create a new API key
4. Copy the key and use it in one of the options above

## Running the App

```bash
npm install
npm run dev
```

The app will open in your browser at `http://localhost:5173`
