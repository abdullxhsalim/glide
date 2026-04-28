const request = require('supertest');
const express = require('express');

// Dummy test app setup for demonstration
const app = express();
app.use(express.json());
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

describe('Server Health Check API', () => {
  it('GET /api/health should return status ok', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
