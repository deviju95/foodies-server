const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const placeSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  // image in database will be saved as url, so it is a string.
  image: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  // Creator type will be pulled FROM mongoDB ObjectId.
  // "ref" allows to connect between different mongoose schemas.
  creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
});

// model method in mongoose have two arguments::
// First, the name of the model "Uppercase, Singular". Name: "Place" db Collection: "places"
// Second, the schema that we created, we refer to: "placeSchema"
module.exports = mongoose.model('Place', placeSchema);
