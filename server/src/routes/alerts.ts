import { Router } from 'express';
import { getAllData } from '../utils/db';

const router = Router();

router.get('/', (req, res) => {
    const alerts = getAllData('FACT_DISASTER_ALERTS');
    res.json(alerts);
});

router.get('/active', (req, res) => {
    const alerts = getAllData('FACT_DISASTER_ALERTS');
    res.json(alerts.filter((a: any) => a.is_active));
});

router.get('/:id', (req, res) => {
    const alerts = getAllData('FACT_DISASTER_ALERTS');
    const alert = alerts.find((a: any, index: number) => index == parseInt(req.params.id));
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
});

export default router;
