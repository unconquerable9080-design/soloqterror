# Riot Games API Setup Guide

## Getting Your Development API Key

The Riot Games Development API Key is **free** but expires every **24 hours**. You'll need to update it daily for continued use.

### Step 1: Create a Riot Games Account
1. Visit [Riot Games](https://www.riotgames.com/)
2. Sign up for a free account if you don't have one
3. Verify your email address

### Step 2: Register for API Access
1. Go to the [Riot Developer Portal](https://developer.riotgames.com/)
2. Sign in with your Riot Games account
3. Click "Register Product" or navigate to your dashboard
4. Accept the Terms of Service

### Step 3: Get Your Development API Key
1. Once registered, you'll see your **Development API Key** on the dashboard
2. This key is valid for **24 hours** from generation
3. Copy the entire key (it starts with `RGAPI-`)

### Step 4: Add the Key to Your Application

**Option 1: Environment Variable (Recommended)**
```bash
export RIOT_API_KEY="RGAPI-your-key-here"
```

Add to your `.env` file (create if it doesn't exist):
```
RIOT_API_KEY=RGAPI-your-key-here
```

**Option 2: Direct Update in Code**
Open `server/riot-api.ts` and update line 8:
```typescript
const RIOT_API_KEY = process.env.RIOT_API_KEY || "RGAPI-your-actual-key-here";
```

Replace `"RGAPI-your-actual-key-here"` with your actual API key.

### Step 5: Restart the Application
After updating the key, restart your application:
```bash
npm run dev
```

## Daily Key Renewal Process

Your Development API Key expires every 24 hours. Here's how to renew it:

1. Visit the [Riot Developer Portal](https://developer.riotgames.com/)
2. Sign in to your account
3. Click "Regenerate API Key" on your dashboard
4. Copy the new key
5. Update the key using Option 1 or Option 2 above
6. Restart the application

## Rate Limits

The Development API Key has the following rate limits:
- **20 requests per second**
- **100 requests per 2 minutes**

This application is specifically designed to respect these limits:
- Smart polling queue with **1.5 second delays** between checks
- Can safely track up to **80 players** continuously
- Additional requests only made when games finish (for detailed analysis)

## Troubleshooting

### "Failed to fetch summoner" Error
- **Cause**: Invalid API key, expired key, or incorrect summoner name
- **Solution**: 
  1. Verify your API key is current (less than 24 hours old)
  2. Check the summoner name spelling
  3. Ensure the region is correct

### "403 Forbidden" Errors
- **Cause**: API key expired or invalid
- **Solution**: Regenerate your API key and update the application

### "429 Too Many Requests" Errors
- **Cause**: Rate limit exceeded
- **Solution**: 
  1. The application should prevent this automatically
  2. If it occurs, reduce the number of tracked players
  3. Check for other applications using the same API key

### API Key Not Working
- Ensure there are no extra spaces before/after the key
- Verify the key starts with `RGAPI-`
- Check that you're not using a key from a different Riot product
- Make sure you've accepted the Terms of Service in the developer portal

## Production API Key

For production use (not covered in this application):
1. Submit a production API key application
2. Provide details about your use case
3. Wait for Riot approval (can take several weeks)
4. Production keys have higher rate limits and don't expire

**Note**: This application is designed for personal use with a Development API Key.

## API Endpoints Used

This application uses the following Riot API endpoints:

1. **Summoner-V4**: Get summoner information by name
   - `GET /lol/summoner/v4/summoners/by-name/{summonerName}`

2. **Match-V5**: Get match IDs for a player
   - `GET /lol/match/v5/matches/by-puuid/{puuid}/ids`

3. **Match-V5**: Get detailed match information
   - `GET /lol/match/v5/matches/{matchId}`

## Regional Endpoints

Different regions use different API endpoints:

- **Americas**: NA, BR, LAN, LAS, OCE
- **Asia**: KR, JP
- **Europe**: EUW, EUNE, TR, RU
- **SEA**: (Oceania uses Americas routing)

The application automatically routes requests to the correct regional endpoint based on the player's region.

## Support

For issues with the Riot Games API:
- [Riot Developer Documentation](https://developer.riotgames.com/docs/portal)
- [Riot API Status](https://status.riotgames.com/)
- [Developer Community Discord](https://discord.gg/riotgamesdevrel)
