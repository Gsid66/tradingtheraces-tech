# tradingtheraces-tech
Documentation-Code for TTR Pages and Data

## Automated Data Sync

This project automatically syncs race and weather data every morning using GitHub Actions.

- **Schedule**: 5 AM, 8 AM, and every 30 minutes during race hours (AEDT)
- **What's synced**: PuntingForm race data + Weather forecasts
- **View logs**: GitHub → Actions tab

See [docs/AUTOMATED_SYNC.md](docs/AUTOMATED_SYNC.md) for complete details on:
- How automated sync works
- Schedule and timing
- Manually triggering syncs
- Required GitHub secrets
- Troubleshooting common issues
- Viewing sync logs
- Modifying the schedule
