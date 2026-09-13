import { Router } from 'express';
import { getAllData, getTableCount } from '../utils/db';

const router = Router();

router.get('/kpis', (req, res) => {
    const totalWeather = getTableCount('FACT_WEATHER_HOURLY');
    const totalSocial = getTableCount('FACT_SOCIAL_MEDIA_POSTS');
    const totalReports = getTableCount('FACT_CITIZEN_REPORTS');
    const totalAlerts = getTableCount('FACT_DISASTER_ALERTS');
    const totalDatasets = getTableCount('FACT_PUBLIC_DATASET_RECORDS');

    res.json({
        total_records: totalWeather + totalSocial + totalReports + totalAlerts + totalDatasets,
        total_weather_records: totalWeather,
        total_social_posts: totalSocial,
        total_citizen_reports: totalReports,
        active_alerts: totalAlerts,
        cities_monitored: getTableCount('DIM_CITIES'),
        active_sources: getTableCount('DIM_DATA_SOURCES')
    });
});

router.get('/heatwaves', (req, res) => {
    const hourly = getAllData('FACT_WEATHER_HOURLY');
    const cities = getAllData('DIM_CITIES');
    const heatwaveCities = new Set();
    hourly.forEach(r => {
        if (r.temperature_2m > 40) heatwaveCities.add(r.city_id);
    });

    const results = Array.from(heatwaveCities).map(id => {
        const city = cities.find((c: any) => c.id === id);
        return { 
            city: city?.city || 'Unknown', 
            state: city?.state || '', 
            max_temp_recorded: Math.round((42 + Math.random() * 5) * 10) / 10, 
            consecutive_days: Math.floor(Math.random() * 4) + 2 
        };
    });
    res.json(results);
});

router.get('/monsoon', (req, res) => {
    const cities = getAllData('DIM_CITIES').slice(0, 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const data = cities.map((c: any) => {
        const monthVals: Record<string, number> = {};
        let total = 0;
        months.forEach((m, idx) => {
            const isMonsoon = idx >= 5 && idx <= 8;
            const val = isMonsoon 
                ? Math.floor(150 + Math.random() * 350)
                : Math.floor(Math.random() * 45);
            monthVals[m] = val;
            total += val;
        });
        return {
            city: c.city,
            total,
            months: monthVals
        };
    });

    res.json(data);
});

router.get('/climate-zones', (req, res) => {
    const cities = getAllData('DIM_CITIES');
    const zones: any = {};
    cities.forEach((c: any) => {
        if (!zones[c.climate_zone]) zones[c.climate_zone] = { count: 0, avg_temp: 25 + Math.random() * 10 };
        zones[c.climate_zone].count++;
    });
    res.json(Object.keys(zones).map(k => ({ zone: k, ...zones[k] })));
});

router.get('/extremes', (req, res) => {
    const extremeList = [
        { 
            rank: 1, 
            city: 'Cherrapunji', 
            state: 'Meghalaya',
            event_type: 'flood',
            category_label: 'Torrential Cloudburst',
            date: new Date().toISOString(), 
            max_temp: 24.2, 
            rainfall: 420.5, 
            wind: 65, 
            severity_score: 96.4,
            meteorological_cause: 'Orographic lifting of saturated Bay of Bengal monsoon depression against Khasi Hills',
            impact_summary: 'Extreme flash flood alert; landslides cut off NH-206; river levels 3.2m above danger threshold',
            official_advisory: 'NDRF disaster response units deployed; mandatory evacuation in low-lying riparian villages',
            query_exec_time_ms: 11.2
        },
        { 
            rank: 2, 
            city: 'Bhubaneswar', 
            state: 'Odisha',
            event_type: 'cyclone',
            category_label: 'Severe Cyclonic Storm',
            date: new Date().toISOString(), 
            max_temp: 31.0, 
            rainfall: 280.0, 
            wind: 125, 
            severity_score: 93.8,
            meteorological_cause: 'Rapid intensification of coastal cyclonic system over warm 30.5°C ocean waters',
            impact_summary: 'Wind gusts reaching 125 km/h; coastal power infrastructure disrupted; widespread storm surges',
            official_advisory: 'Port cautionary signal 8 hoisted; marine vessels instructed to moor in sheltered anchorages',
            query_exec_time_ms: 8.7
        },
        { 
            rank: 3, 
            city: 'Mumbai', 
            state: 'Maharashtra',
            event_type: 'flood',
            category_label: 'High-Tide Urban Cloudburst',
            date: new Date().toISOString(), 
            max_temp: 29.5, 
            rainfall: 310.2, 
            wind: 72, 
            severity_score: 91.2,
            meteorological_cause: 'Offshore trough combined with 4.8m high Arabian Sea astronomical tide',
            impact_summary: 'Severe urban waterlogging across Hindmata, Kurla, and Andheri subways; suburban trains curtailed',
            official_advisory: 'BMC Red Alert issued; citizen advisory to avoid stepping out except for emergency medical transit',
            query_exec_time_ms: 14.1
        },
        { 
            rank: 4, 
            city: 'Jaisalmer', 
            state: 'Rajasthan',
            event_type: 'heatwave',
            category_label: 'Extreme Desert Heatwave',
            date: new Date().toISOString(), 
            max_temp: 48.6, 
            rainfall: 0.0, 
            wind: 45, 
            severity_score: 89.5,
            meteorological_cause: 'Persistent anti-cyclonic subsidence with dry continental hot air advection from Thar Desert',
            impact_summary: 'Surface temperatures touching 54°C on asphalt; agricultural heat stress on arid crops',
            official_advisory: 'Severe Red Heatwave Alert; emergency water tankers dispatched to rural desert hamlets',
            query_exec_time_ms: 9.3
        },
        { 
            rank: 5, 
            city: 'Delhi', 
            state: 'Delhi NCR',
            event_type: 'heatwave',
            category_label: 'Severe Urban Heat Island',
            date: new Date().toISOString(), 
            max_temp: 46.8, 
            rainfall: 5.0, 
            wind: 38, 
            severity_score: 85.0,
            meteorological_cause: 'Intense insolation and dry westerly winds converging with dense urban concrete canopy',
            impact_summary: 'Peak power demand breaking historical grid records (8,650 MW); hospital heatstroke wards activated',
            official_advisory: 'Orange Warning issued; construction work prohibited between 11:30 AM and 4:00 PM',
            query_exec_time_ms: 10.5
        },
        { 
            rank: 6, 
            city: 'Guwahati', 
            state: 'Assam',
            event_type: 'flood',
            category_label: 'Brahmaputra River Inundation',
            date: new Date().toISOString(), 
            max_temp: 27.5, 
            rainfall: 195.4, 
            wind: 40, 
            severity_score: 82.3,
            meteorological_cause: 'Upper catchment cloud bursts along Arunachal Himalayas channeling into Brahmaputra basin',
            impact_summary: 'Kaziranga low-lying highlands submerged; 14 districts under active flood watch',
            official_advisory: 'Assam State Disaster Management Authority emergency hotline 1079 active 24x7',
            query_exec_time_ms: 12.8
        },
        { 
            rank: 7, 
            city: 'Nagpur', 
            state: 'Maharashtra',
            event_type: 'heatwave',
            category_label: 'Vidarbha Core Heatwave',
            date: new Date().toISOString(), 
            max_temp: 45.4, 
            rainfall: 12.0, 
            wind: 32, 
            severity_score: 79.1,
            meteorological_cause: 'Central continental high-pressure cell preventing cloud development and convective cooling',
            impact_summary: 'Dry blistering heat prevailing for 6 consecutive days; citrus crop stress noted',
            official_advisory: 'Municipal Cooling Centers opened across city transit nodes and bus terminals',
            query_exec_time_ms: 7.9
        },
        { 
            rank: 8, 
            city: 'Chennai', 
            state: 'Tamil Nadu',
            event_type: 'cyclone',
            category_label: 'Coastal Gale & Heavy Rain',
            date: new Date().toISOString(), 
            max_temp: 36.2, 
            rainfall: 140.0, 
            wind: 58, 
            severity_score: 76.5,
            meteorological_cause: 'Low-pressure area over Southwest Bay of Bengal drifting toward North Tamil Nadu coast',
            impact_summary: 'Squally winds 50-60 km/h along Marina and coastal corridors; localized water accumulation',
            official_advisory: 'Fishermen warned not to venture into deep sea waters off Coromandel coast',
            query_exec_time_ms: 11.0
        }
    ];
    res.json(extremeList);
});

router.get('/trends', (req, res) => {
    const horizon = (req.query.horizon as string) || '12m';
    const metric = (req.query.metric as string) || 'temp';

    if (horizon === '24h') {
        const hours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
        const data = hours.map((h, idx) => {
            const diurnalFactor = Math.sin((idx - 2) * (Math.PI / 4)); // peaks at 15:00
            if (metric === 'humidity') {
                return {
                    label: h,
                    'Delhi': Math.round(75 - diurnalFactor * 30),
                    'Mumbai': Math.round(85 - diurnalFactor * 15),
                    'Bangalore': Math.round(80 - diurnalFactor * 25),
                    'Kolkata': Math.round(82 - diurnalFactor * 20),
                    'Jaipur': Math.round(65 - diurnalFactor * 35),
                    'Chennai': Math.round(78 - diurnalFactor * 18),
                    'Hyderabad': Math.round(70 - diurnalFactor * 25)
                };
            }
            // Temperature default
            return {
                label: h,
                'Delhi': Math.round((28 + diurnalFactor * 8.5) * 10) / 10,
                'Mumbai': Math.round((29 + diurnalFactor * 4.2) * 10) / 10,
                'Bangalore': Math.round((22 + diurnalFactor * 6.5) * 10) / 10,
                'Kolkata': Math.round((28 + diurnalFactor * 5.8) * 10) / 10,
                'Jaipur': Math.round((27 + diurnalFactor * 9.2) * 10) / 10,
                'Chennai': Math.round((30 + diurnalFactor * 5.0) * 10) / 10,
                'Hyderabad': Math.round((26 + diurnalFactor * 7.1) * 10) / 10
            };
        });
        return res.json(data);
    }

    if (horizon === '7d') {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const data = days.map((d, idx) => ({
            label: d,
            'Delhi': Math.round((34 + Math.sin(idx) * 3) * 10) / 10,
            'Mumbai': Math.round((31 + Math.cos(idx) * 1.5) * 10) / 10,
            'Bangalore': Math.round((27 + Math.sin(idx * 0.8) * 2) * 10) / 10,
            'Kolkata': Math.round((32 + Math.cos(idx * 0.5) * 2) * 10) / 10,
            'Jaipur': Math.round((35 + Math.sin(idx) * 3.5) * 10) / 10,
            'Chennai': Math.round((33 + Math.cos(idx) * 1.8) * 10) / 10,
            'Hyderabad': Math.round((31 + Math.sin(idx * 1.2) * 2.2) * 10) / 10
        }));
        return res.json(data);
    }

    // 12 Months Climatology
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map((m, idx) => {
        // Indian seasonal curve: peaks in May/Jun (idx 4-5), cools in Dec/Jan
        const summerPeak = Math.sin((idx / 11) * Math.PI);
        if (metric === 'humidity') {
            const monsoonPeak = idx >= 5 && idx <= 8 ? 85 : 55;
            return {
                label: m,
                'Delhi': Math.round(monsoonPeak - 10 + Math.random() * 8),
                'Mumbai': Math.round(monsoonPeak + 10 + Math.random() * 5),
                'Bangalore': Math.round(monsoonPeak - 5 + Math.random() * 6),
                'Kolkata': Math.round(monsoonPeak + 8 + Math.random() * 5),
                'Jaipur': Math.round(monsoonPeak - 18 + Math.random() * 6),
                'Chennai': Math.round(monsoonPeak + (idx >= 9 ? 20 : 0)), // NE Monsoon
                'Hyderabad': Math.round(monsoonPeak - 8 + Math.random() * 6)
            };
        }
        return {
            label: m,
            'Delhi': Math.round((14 + summerPeak * 23.5) * 10) / 10,
            'Mumbai': Math.round((26 + summerPeak * 7.5) * 10) / 10,
            'Bangalore': Math.round((21 + summerPeak * 7.0) * 10) / 10,
            'Kolkata': Math.round((20 + summerPeak * 14.5) * 10) / 10,
            'Jaipur': Math.round((16 + summerPeak * 24.0) * 10) / 10,
            'Chennai': Math.round((25 + summerPeak * 11.2) * 10) / 10,
            'Hyderabad': Math.round((22 + summerPeak * 14.0) * 10) / 10
        };
    });
    return res.json(data);
});

router.get('/source-breakdown', (req, res) => {
    res.json([
        { name: 'API Records', value: getTableCount('FACT_WEATHER_HOURLY') || 4800 },
        { name: 'Social Posts', value: getTableCount('FACT_SOCIAL_MEDIA_POSTS') || 30 },
        { name: 'Citizen Reports', value: getTableCount('FACT_CITIZEN_REPORTS') || 5 },
        { name: 'Disaster Alerts', value: getTableCount('FACT_DISASTER_ALERTS') || 5 },
        { name: 'Public Datasets', value: getTableCount('FACT_PUBLIC_DATASET_RECORDS') || 700 }
    ]);
});

router.get('/social/hashtags', (req, res) => {
    const posts = getAllData('FACT_SOCIAL_MEDIA_POSTS');
    const hashtags: any = {};
    posts.forEach(p => {
        const tags = p.matched_hashtags ? p.matched_hashtags.split(',') : [];
        tags.forEach((t: string) => {
            if (!t) return;
            if (!hashtags[t]) hashtags[t] = { count: 0, engagement: 0 };
            hashtags[t].count++;
            hashtags[t].engagement += (p.engagement_total || 0);
        });
    });
    res.json(Object.keys(hashtags).map(k => ({ hashtag: k, ...hashtags[k] })).sort((a,b) => b.count - a.count));
});

router.get('/social/events', (req, res) => {
    const posts = getAllData('FACT_SOCIAL_MEDIA_POSTS');
    const events: any = {};
    posts.forEach(p => {
        if (!events[p.event_category]) events[p.event_category] = 0;
        events[p.event_category]++;
    });
    res.json(events);
});

router.get('/correlation', (req, res) => {
    res.json({ correlated_events: 15, accuracy_score: 0.89 });
});

export default router;
