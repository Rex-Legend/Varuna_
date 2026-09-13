import { Router } from 'express';
import { getAllData } from '../utils/db';
import { scrapeDisasterAlerts } from '../collectors/web-scraper';

const router = Router();

router.get('/', (req, res) => {
    let alerts = getAllData('FACT_DISASTER_ALERTS');
    if (!alerts || alerts.length === 0) {
        scrapeDisasterAlerts();
        alerts = getAllData('FACT_DISASTER_ALERTS');
    }
    res.json(alerts);
});

router.post('/refresh', async (req, res) => {
    await scrapeDisasterAlerts();
    const alerts = getAllData('FACT_DISASTER_ALERTS');
    res.json({ message: 'Disaster bulletins refreshed with live timestamps', alerts });
});

router.get('/active', (req, res) => {
    const alerts = getAllData('FACT_DISASTER_ALERTS');
    res.json(alerts.filter((a: any) => a.is_active));
});

router.get('/:id', (req, res) => {
    const alerts = getAllData('FACT_DISASTER_ALERTS');
    const paramId = parseInt(req.params.id);
    const alert = alerts.find((a: any, index: number) => a.alert_id === paramId || index === paramId);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
});

export default router;
