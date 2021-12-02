// axios :: is a very popular package for sending HttpRequests
// from frontend application to backends.
// In our case, its used to send a request from this Node app to backend.
const axios = require('axios');

const HttpError = require('../models/http-error');

// need to insert proper api key
const API_KEY = process.env.GOOGLE_API_KEY;

// async :: allows us to use await inside function.
// await :: move on to next step after current job is done.
async function getCoordsForAddress(address) {
  const response = await axios.get(
    // encodeURIComponent is Node.js command to get rid of white space & special characters.
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );

  // axios provide response.data that holds res data.
  const data = response.data;

  // google geocoding will give "ZERO_RESULTS" if no coordinates were found for given address.
  if (!data || data.status === 'ZERO_RESULTS') {
    const error = new HttpError(
      'Could not find coordinate for the given address.',
      422
    );
    throw error;
  }

  // getting coordinate data is found from google geocoding docs.
  const coordinates = data.results[0].geometry.location;

  return coordinates;
}

module.exports = getCoordsForAddress;
