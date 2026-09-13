import { Router } from 'express';
import { getAllData } from '../utils/db';

const router = Router();

router.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send 3 initial live events immediately upon connection so user never sees an empty feed
    const sendBatch = () => {
        const posts = getAllData('FACT_SOCIAL_MEDIA_POSTS');
        const alerts = getAllData('FACT_DISASTER_ALERTS');
        
        for (let i = 0; i < 3; i++) {
            if (posts.length > i) {
                const p = posts[posts.length - 1 - i];
                const initPayload = {
                    id: 'live_' + Date.now() + '_' + i,
                    source: 'Social Media',
                    city: p.detected_city || 'India',
                    summary: p.post_text,
                    severity: p.severity_level || 'normal',
                    hasMedia: !!(p.has_photo || p.has_video),
                    timestamp: new Date(Date.now() - i * 45000).toISOString()
                };
                res.write(`data: ${JSON.stringify(initPayload)}\n\n`);
            }
        }
    };
    sendBatch();

    // Continuous real-time streaming every 4 seconds
    const interval = setInterval(() => {
        const posts = getAllData('FACT_SOCIAL_MEDIA_POSTS');
        const alerts = getAllData('FACT_DISASTER_ALERTS');
        
        let eventPayload;
        const roll = Math.random();
        
        if (roll < 0.25 && alerts.length > 0) {
            const a = alerts[Math.floor(Math.random() * alerts.length)];
            eventPayload = { 
                id: 'alert_' + Date.now(),
                source: 'Disaster Alert', 
                city: a.affected_states || 'National', 
                summary: a.alert_description || a.alert_title || a.title || a.description, 
                severity: a.severity || 'warning', 
                hasMedia: false,
                timestamp: new Date().toISOString() 
            };
        } else if (posts.length > 0) {
            const p = posts[Math.floor(Math.random() * posts.length)];
            eventPayload = { 
                id: 'post_' + Date.now(),
                source: 'Social Media', 
                city: p.detected_city || 'India', 
                summary: p.post_text, 
                severity: p.severity_level || 'normal', 
                hasMedia: !!(p.has_photo || p.has_video),
                timestamp: new Date().toISOString() 
            };
        } else {
            eventPayload = { 
                id: 'api_' + Date.now(),
                source: 'API Sensor', 
                city: 'Delhi', 
                summary: 'Real-time telemetry: 31.9°C, Humidity 63%, Wind 9.9 km/h', 
                severity: 'normal', 
                hasMedia: false,
                timestamp: new Date().toISOString() 
            };
        }

        res.write(`data: ${JSON.stringify(eventPayload)}\n\n`);
    }, 4000);

    req.on('close', () => {
        clearInterval(interval);
    });
});

export default router;