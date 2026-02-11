# tradingtheraces-tech
Documentation-Code for TTR Pages and Data

## 🤖 Automated Data Sync

This project uses **GitHub Actions** to automatically sync race and weather data every day.

- **Schedule**: 5 AM, 8 AM, and every 30 minutes during race hours (AEDT)
- **What's synced**: PuntingForm race data + Weather forecasts
- **View logs**: [GitHub Actions](https://github.com/Gsid66/tradingtheraces-tech/actions)

📖 See [docs/AUTOMATED_SYNC.md](docs/AUTOMATED_SYNC.md) for full details.

### Manual Trigger

To manually sync data:
1. Go to [Actions tab](https://github.com/Gsid66/tradingtheraces-tech/actions)
2. Click "Sync PuntingForm and Weather Data"
3. Click "Run workflow"
