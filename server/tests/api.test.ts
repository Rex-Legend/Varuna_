import request from 'supertest';
import { app } from '../src/app';

describe('Varuna Weather Analytics API Test Suite', () => {
  describe('GET /api/cities', () => {
    it('should return a list of monitored Indian cities with 200 OK', async () => {
      const res = await request(app).get('/api/cities');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      
      const firstCity = res.body[0];
      expect(firstCity).toHaveProperty('city_id');
      expect(firstCity).toHaveProperty('name');
      expect(firstCity).toHaveProperty('temperature');
      expect(typeof firstCity.temperature).toBe('number');
    });
  });

  describe('GET /api/analytics/kpis', () => {
    it('should return national weather big data KPIs', async () => {
      const res = await request(app).get('/api/analytics/kpis');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total_records');
      expect(res.body).toHaveProperty('total_weather_records');
      expect(res.body).toHaveProperty('total_social_posts');
      expect(res.body).toHaveProperty('total_citizen_reports');
      expect(res.body).toHaveProperty('cities_monitored');
      expect(res.body.cities_monitored).toBeGreaterThanOrEqual(50);
    });
  });

  describe('GET /api/analytics/source-breakdown', () => {
    it('should return record counts across 5 data sources', async () => {
      const res = await request(app).get('/api/analytics/source-breakdown');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const sourceNames = res.body.map((s: any) => s.name);
      expect(sourceNames).toContain('API Records');
      expect(sourceNames).toContain('Social Posts');
      expect(sourceNames).toContain('Citizen Reports');
      expect(sourceNames).toContain('Disaster Alerts');
      expect(sourceNames).toContain('Public Datasets');
    });
  });

  describe('GET /api/analytics/trends', () => {
    it('should return 24h temperature diurnal trajectory for key urban hubs', async () => {
      const res = await request(app).get('/api/analytics/trends?horizon=24h&metric=temp');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      const sample = res.body[0];
      expect(sample).toHaveProperty('label');
      expect(sample).toHaveProperty('Delhi');
      expect(sample).toHaveProperty('Mumbai');
    });
  });

  describe('GET /api/alerts', () => {
    it('should return verified disaster alerts', async () => {
      const res = await request(app).get('/api/alerts');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        const alert = res.body[0];
        expect(alert).toHaveProperty('alert_type');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('affected_states');
      }
    });
  });

  describe('POST /api/citizen-report', () => {
    it('should accept citizen observation and ingest with 201 Created', async () => {
      const newReport = {
        reporter_name: 'Dr. Test Analyst',
        latitude: 28.6139,
        longitude: 77.2090,
        reporter_location: 'Central Delhi Weather Station',
        weather_condition: 'Thunderstorm',
        severity_rating: 4,
        description: 'Automated test suite verification report.'
      };
      const res = await request(app)
        .post('/api/citizen-report')
        .send(newReport);
      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('success', true);
    });
  });
});
