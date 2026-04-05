const axios = require('axios');

exports.handler = async (event, context) => {
  try {
    const location = event.queryStringParameters.location || 'New York'; // Default location if none provided

    // First, geocode the location to get lat/lon
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`;
    const geocodeResponse = await axios.get(geocodeUrl, {
      headers: {
        'User-Agent': 'RainYN-Bot/1.0'
      }
    });
    const geocodeData = geocodeResponse.data;

    if (geocodeData.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Location not found' })
      };
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        location: location,
        willRain: willRain,
        message: result,
        probability: todaysForecast
      })
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};