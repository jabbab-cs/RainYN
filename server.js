const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Endpoint to check rain
app.get('/rain', async (req, res) => {
  try {
    const location = req.query.location || 'New York'; // Default location if none provided

    // First, geocode the location to get lat/lon
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`;
    const geocodeResponse = await axios.get(geocodeUrl, {
      headers: {
        'User-Agent': 'RainYN-Bot/1.0'
      }
    });
    const geocodeData = geocodeResponse.data;

    if (geocodeData.length === 0) {
      return res.status(400).json({ error: 'Location not found' });
    }

    const lat = geocodeData[0].lat;
    const lon = geocodeData[0].lon;

    // Now get weather data
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability&current_weather=true`;
    const weatherResponse = await axios.get(weatherUrl);
    const data = weatherResponse.data;

    const currentHour = new Date().getHours();
    const hoursLeft = 24 - currentHour;
    const todaysForecast = data.hourly.precipitation_probability.slice(0, hoursLeft);
    const willRain = todaysForecast.some(prob => prob > 50);

    const result = willRain ? 'Yes☔' : 'No☀️';

    res.json({
      location: location,
      willRain: willRain,
      message: result,
      probability: todaysForecast
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});