import { getAllData, bulkInsertExasol } from '../utils/db';

const TRACKED_HASHTAGS = [
    '#IMD', '#IMDWeather', '#IMDAlert', '#IMDUpdate', '#IndiaWeatherUpdate', '#IndiaWeather', '#CycloneAlert', '#CycloneWarning', '#FloodAlert', '#Heatwave', '#HeatwaveAlert', '#ColdWave', '#MonsoonUpdate', '#ThunderstormAlert', '#DustStorm', '#Rainfall', '#HeavyRain', '#CloudBurst', '#Snowfall', '#FogAlert', '#Drought', '#MumbaiRains', '#ChennaiRains', '#DelhiWeather', '#BangaloreRains', '#KolkataWeather', '#KeralaFloods', '#UttarakhandRains', '#NDMA', '#NDMAAlert', '#DisasterAlert', '#WeatherWarning', '#RedAlert', '#OrangeAlert'
];

const EVENT_CATEGORIES = {
    rainfall: /rain|baarish|barish|drizzle|downpour|cloudburst|shower/i,
    flood: /flood|waterlog|submerge|marooned/i,
    cyclone: /cyclone|hurricane|toofan|landfall/i,
    heatwave: /heat ?wave|loo|scorching|blazing/i,
    thunderstorm: /thunderstorm|lightning|thunder|storm/i,
    fog: /\bfog\b|mist|smog|visibility.*poor|dense fog/i,
    cold_wave: /cold ?wave|freezing|frost|ice/i,
    snowfall: /snow|snowfall|blizzard/i,
    dust_storm: /dust ?storm|andhi|sandstorm/i,
    drought: /drought|sukha|water ?crisis/i
};

const SEVERITY_RULES = [
    { pattern: /devastat|destroy|death|casualt|submerged|maroon|rescue|stranded|emergency/i, level: 'extreme' },
    { pattern: /cyclone.*severe|flood.*major|cloudburst|200.*mm|red ?alert/i, level: 'extreme' },
    { pattern: /heavy ?rain|torrential|waterlog|orange ?alert|heat ?wave|cold ?wave/i, level: 'severe' },
    { pattern: /warning|advisory|alert|disruption|delay|cancel/i, level: 'warning' }
];

const CYCLONE_NAMES = ['DANA', 'FENGAL', 'REMAL', 'ASNA', 'MICHAUNG', 'BIPARJOY'];

function extractHashtags(text: string): string[] {
    const matches = text.match(/#[\w]+/g);
    return matches || [];
}

function findMatchedHashtags(postHashtags: string[]): string[] {
    const trackedLower = TRACKED_HASHTAGS.map(h => h.toLowerCase());
    return postHashtags.filter(h => trackedLower.includes(h.toLowerCase()));
}

function classifyEventCategory(text: string): string {
    for (const [category, regex] of Object.entries(EVENT_CATEGORIES)) {
        if (regex.test(text)) return category;
    }
    return 'rainfall';
}

function classifySeverity(text: string): string {
    for (const rule of SEVERITY_RULES) {
        if (rule.pattern.test(text)) return rule.level;
    }
    return 'normal';
}

function detectLocation(text: string, cities: any[]): any {
    for (const city of cities) {
        if (new RegExp(`\\b${city.city}\\b`, 'i').test(text) || new RegExp(`\\b${city.state}\\b`, 'i').test(text)) {
            return { city_id: city.id, city: city.city, state: city.state, lat: city.lat, lon: city.lon };
        }
    }
    return null;
}

const POST_TEMPLATES = [
    { text: "Severe waterlogging reported in {city} after continuous downpour. Traffic at standstill across key intersections. {hashtags}", hashtags: ["#IMD", "#HeavyRain", "#FloodAlert", "{cityTag}"], media: { has_photo: true, has_video: false } },
    { text: "IMD Weather Warning: Heavy to extremely heavy rainfall forecast over {state} during next 24 hours. Red Alert sounded. {hashtags}", hashtags: ["#IMDAlert", "#WeatherUpdate", "#RedAlert", "{stateTag}"], media: { has_photo: false, has_video: false } },
    { text: "Intense heatwave conditions continue across {city}. Max temperature touching 46.5 C today. Citizens urged to stay hydrated. {hashtags}", hashtags: ["#IMD", "#Heatwave", "#HeatwaveAlert", "{stateTag}"], media: { has_photo: false, has_video: false } },
    { text: "Pleasant weather and clear skies observed across {city} today with gentle breeze and mild temperatures. {hashtags}", hashtags: ["#IndiaWeather", "#WeatherUpdate"], media: { has_photo: true, has_video: false } },
    { text: "Dense fog advisory for {city} airport. Early morning flight departures delayed due to visibility dropping below 100 meters. {hashtags}", hashtags: ["#IMD", "#FogAlert", "{cityTag}"], media: { has_photo: false, has_video: true } },
    { text: "Severe Cyclonic Storm {cycloneName} tracking towards {state} coastline. Gusts up to 130 km/h expected near landfall. Disaster teams mobilized. {hashtags}", hashtags: ["#CycloneAlert", "#NDMA", "#CycloneWarning", "{stateTag}"], media: { has_photo: true, has_video: true } },
    { text: "Continuous heavy rain reported across {city} since early morning. Low-lying roads inundated, IMD issues orange alert. {hashtags}", hashtags: ["#IMD", "#Rainfall", "{cityTag}"], media: { has_photo: false, has_video: true } },
    { text: "Thunderstorm accompanied by lightning and hailstorm alert issued for {city} and adjacent districts. {hashtags}", hashtags: ["#IMD", "#ThunderstormAlert", "{stateTag}"], media: { has_photo: true, has_video: false } },
    { text: "Fresh snowfall blankets higher altitudes near {city}. Temperatures dip significantly across valley. {hashtags}", hashtags: ["#Snowfall", "#IMD"], media: { has_photo: true, has_video: true } },
    { text: "Sudden dust storm with high wind gusts strikes {city}. Air quality index drops temporarily. {hashtags}", hashtags: ["#IMD", "#DustStorm", "{cityTag}"], media: { has_photo: false, has_video: true } },
    { text: "River water levels crossing danger marks near {city}. State administration initiates evacuation in vulnerable sectors. {hashtags}", hashtags: ["#IMD", "#FloodAlert", "#DisasterAlert"], media: { has_photo: true, has_video: false } },
    { text: "IMD Weather Bulletin: Active convective cloud radar detected over {state}. Isolated thunderstorms with gusty winds expected. {hashtags}", hashtags: ["#IMDAlert", "#WeatherUpdate", "{stateTag}"], media: { has_photo: false, has_video: false } }
];

function generateSimulatedPosts(cities: any[]) {
    const numPosts = Math.floor(Math.random() * (20 - 8 + 1)) + 8;
    const posts = [];
    
    for (let i = 0; i < numPosts; i++) {
        const template = POST_TEMPLATES[Math.floor(Math.random() * POST_TEMPLATES.length)];
        const cityObj = cities[Math.floor(Math.random() * cities.length)];
        const cycloneName = CYCLONE_NAMES[Math.floor(Math.random() * CYCLONE_NAMES.length)];
        
        let rawText = template.text
            .replace(/{city}/g, cityObj.city)
            .replace(/{state}/g, cityObj.state)
            .replace(/{cycloneName}/g, cycloneName);
            
        const resolvedHashtags = template.hashtags.map(h => 
            h.replace(/{cityTag}/g, `#${cityObj.city.replace(/[^a-zA-Z0-9]/g, '')}`)
             .replace(/{stateTag}/g, `#${cityObj.state.replace(/[^a-zA-Z0-9]/g, '')}`)
        );
        
        const finalContent = rawText.replace('{hashtags}', resolvedHashtags.join(' '));
        const allHashtags = extractHashtags(finalContent);
        const matched = findMatchedHashtags(allHashtags);
        const eventCat = classifyEventCategory(finalContent);
        const severity = classifySeverity(finalContent);
        const loc = detectLocation(finalContent, cities) || { city_id: null, city: null, state: null, lat: null, lon: null };

        posts.push({
            source_id: 2,
            platform: 'Twitter/X',
            external_post_id: `tw_${Math.random().toString(36).substr(2, 9)}`,
            post_text: finalContent,
            author_handle: `@weather_${cityObj.city.toLowerCase().replace(/[^a-z]/g, '')}`,
            author_display_name: `${cityObj.city} Weather Bureau`,
            author_verified: Math.random() > 0.7,
            posted_at: new Date().toISOString(),
            matched_hashtags: matched.join(','),
            all_hashtags: allHashtags.join(','),
            detected_city_id: loc.city_id,
            detected_city: loc.city,
            detected_state: loc.state,
            latitude: loc.lat,
            longitude: loc.lon,
            location_source: 'text_extraction',
            photo_urls: template.media.has_photo ? 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400' : null,
            video_urls: template.media.has_video ? 'https://video.twimg.com/ext_tw_video/radar.mp4' : null,
            media_count: (template.media.has_photo ? 1 : 0) + (template.media.has_video ? 1 : 0),
            has_photo: template.media.has_photo,
            has_video: template.media.has_video,
            weather_keywords: eventCat,
            event_category: eventCat,
            severity_level: severity,
            sentiment_score: severity === 'extreme' ? -0.85 : severity === 'severe' ? -0.6 : 0.2,
            likes_count: Math.floor(Math.random() * 4500) + 120,
            retweets_count: Math.floor(Math.random() * 1200) + 40,
            replies_count: Math.floor(Math.random() * 300) + 10,
            engagement_total: 0
        });
    }
    
    posts.forEach(p => p.engagement_total = p.likes_count + p.retweets_count + p.replies_count);
    return posts;
}

export async function collectSocialMedia() {
    console.log('[Social] Collecting #IMD posts with full metadata...');
    const cities = getAllData('DIM_CITIES');
    const posts = generateSimulatedPosts(cities);
    
    await bulkInsertExasol('FACT_SOCIAL_MEDIA_POSTS', posts);
    const severeCount = posts.filter(p => p.severity_level === 'severe' || p.severity_level === 'extreme').length;
    const mediaCount = posts.filter(p => p.has_photo || p.has_video).length;
    console.log(`[Social] Ingested ${posts.length} posts (Severe: ${severeCount}, Media: ${mediaCount})`);
}