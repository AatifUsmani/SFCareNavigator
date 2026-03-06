# SF Care Navigator

A multilingual healthcare navigator for San Francisco residents. Uses OpenAI's GPT-4 to provide personalized routing to appropriate care facilities based on neighborhood, insurance status, and healthcare needs.

## Setup

### Local Development

```bash
npm install
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

Get your API key from [platform.openai.com/api/keys](https://platform.openai.com/api/keys)

### Vercel Deployment

1. Push to GitHub
2. Import project in Vercel dashboard
3. **Add environment variable:**
   - Name: `VITE_OPENAI_API_KEY`
   - Value: Your OpenAI API key (keep it secret)
4. Vercel will automatically detect Vite and build with `npm run build`

The app will be live at your Vercel URL.

## Features

- **8 Languages**: English, Spanish, Mandarin, Cantonese, Tagalog, Vietnamese, Russian, Arabic
- **Multilingual AI**: Responds in the language user writes in
- **Instant Clinic Routing**: Finds nearest clinics by neighborhood
- **Insurance Guidance**: Explains Healthy SF, Emergency Medi-Cal, Covered CA options
- **Mobile-Friendly**: Works on phones and tablets
- **Voice Input**: Speech recognition support
- **Anonymous**: No data collection

## Built With

- React 19
- Vite
- OpenAI API (GPT-4)
- CSS-in-JS styling

