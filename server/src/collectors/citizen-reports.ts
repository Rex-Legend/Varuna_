import { Router } from 'express';
import { getAllData, bulkInsertExasol } from '../utils/db';

const router = Router();

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

router.post('/', async (req, res) => {
    try {
        const report = req.body;
        const cities = getAllData('DIM_CITIES');
        
        let nearestCity = null;
        let minDist = Infinity;
        
        for (const city of cities) {
            const dist = getDistance(report.latitude, report.longitude, city.lat, city.lon);
            if (dist < minDist) {
                minDist = dist;
                nearestCity = city;
            }
        }

        const newRecord = {
            source_id: 8,
            city_id: nearestCity?.id || null,
            reporter_name: report.reporter_name,
            latitude: report.latitude,
            longitude: report.longitude,
            reporter_location: report.reporter_location,
            weather_condition: report.weather_condition,
            temperature_feel: report.temperature_feel,
            rain_intensity: report.rain_intensity,
            wind_intensity: report.wind_intensity,
            visibility_level: report.visibility_level,
            severity_rating: report.severity_rating,
            description: report.description,
            photo_url: report.photo_url || null,
            timestamp: new Date().toISOString()
        };

        await bulkInsertExasol('FACT_CITIZEN_REPORTS', [newRecord]);
        res.json({ success: true, message: 'Report submitted successfully', matched_city: nearestCity?.city });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/', (req, res) => {
    const reports = getAllData('FACT_CITIZEN_REPORTS');
    const cities = getAllData('DIM_CITIES');
    const enriched = reports.slice(-50).map(r => {
        const city = cities.find((c: any) => c.id === r.city_id);
        return { ...r, city_name: city ? city.city : 'Unknown' };
    });
    res.json(enriched);
});

router.get('/stats', (req, res) => {
    const reports = getAllData('FACT_CITIZEN_REPORTS');
    const byCondition: any = {};
    const bySeverity: any = {};

    reports.forEach(r => {
        byCondition[r.weather_condition] = (byCondition[r.weather_condition] || 0) + 1;
        bySeverity[r.severity_rating] = (bySeverity[r.severity_rating] || 0) + 1;
    });

    res.json({ counts_by_condition: byCondition, counts_by_severity: bySeverity });
});

export default router;
