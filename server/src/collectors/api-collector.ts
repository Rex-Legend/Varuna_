import axios from 'axios';
import { getAllData, bulkInsertExasol } from '../utils/db';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function collectWeatherAPI() {
    console.log('☁️ Starting Open-Meteo Weather API collection...');
    const cities = getAllData('DIM_CITIES');
    const records = [];

    for (const city of cities) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast`;
            const params = {
                latitude: city.lat,
                longitude: city.lon,
                hourly: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,cloud_cover,weather_code,is_day',
                forecast_days: 3,
                past_days: 1,
                timezone: 'Asia/Kolkata'
            };
            
            const { data } = await axios.get(url, { params });
            const { time, ...metrics } = data.hourly;
            
            for (let i = 0; i < time.length; i++) {
                records.push({
                    city_id: city.id,
                    source_id: 1,
                    timestamp: time[i],
                    temperature_2m: metrics.temperature_2m[i],
                    relative_humidity_2m: metrics.relative_humidity_2m[i],
                    apparent_temperature: metrics.apparent_temperature[i],
                    precipitation: metrics.precipitation[i],
                    rain: metrics.rain[i],
                    wind_speed_10m: metrics.wind_speed_10m[i],
                    wind_direction_10m: metrics.wind_direction_10m[i],
                    wind_gusts_10m: metrics.wind_gusts_10m[i],
                    surface_pressure: metrics.surface_pressure[i],
                    cloud_cover: metrics.cloud_cover[i],
                    weather_code: metrics.weather_code[i],
                    is_day: metrics.is_day[i]
                });
            }
            // Rate limit compliance
            await delay(200);
        } catch (error: any) {
            console.error(`❌ Failed to fetch API for ${city.city}: ${error.message}`);
        }
    }

    if (records.length > 0) {
        await bulkInsertExasol('FACT_WEATHER_HOURLY', records);
        console.log(`✅ Completed Open-Meteo API. Inserted ${records.length} hourly records.`);
    }
}
