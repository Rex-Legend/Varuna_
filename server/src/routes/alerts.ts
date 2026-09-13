import { Router } from 'express';
import { getAllData } from '../utils/db';
import { scrapeDisasterAlerts } from '../collectors/web-scraper';

const router = Router();

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // at most 2 days (48 hours)
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function filterAndEnrichAlerts(alerts: any[]) {
    const nowMs = Date.now();
    return alerts
        .filter((a: any) => {
            const time = new Date(a.issued_at).getTime();
            // Filter out any data older than 2 days (48 hours)
            return !isNaN(time) && (nowMs - time) <= TWO_DAYS_MS;
        })
        .map((a: any) => {
            const time = new Date(a.issued_at).getTime();
            const ageMs = nowMs - time;
            const isLive = ageMs <= TWO_HOURS_MS;
            return {
                ...a,
                freshness: isLive ? 'LIVE' : 'NEW',
                is_within_2days: true,
                is_within_week: true,
                age_hours: Math.floor(ageMs / (1000 * 3600))
            };
        });
}

router.get('/', (req, res) => {
    let alerts = getAllData('FACT_DISASTER_ALERTS');
    if (!alerts || alerts.length === 0) {
        scrapeDisasterAlerts();
        alerts = getAllData('FACT_DISASTER_ALERTS');
    }
    res.json(filterAndEnrichAlerts(alerts));
});

router.post('/refresh', async (req, res) => {
    await scrapeDisasterAlerts();
    const alerts = getAllData('FACT_DISASTER_ALERTS');
    res.json({ message: 'Disaster bulletins refreshed with live timestamps', alerts: filterAndEnrichAlerts(alerts) });
});

router.get('/active', (req, res) => {
    const alerts = getAllData('FACT_DISASTER_ALERTS');
    const valid = filterAndEnrichAlerts(alerts);
    res.json(valid.filter((a: any) => a.is_active));
});

router.get('/:id', (req, res) => {
    const alerts = getAllData('FACT_DISASTER_ALERTS');
    const paramId = parseInt(req.params.id);
    const alert = alerts.find((a: any, index: number) => a.alert_id === paramId || index === paramId);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
});

export default router;
