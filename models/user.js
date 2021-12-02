const mongoose = require('mongoose');
// install mongoose-unique-validator@2.0.3.
// There seem to be a bug within most recent mongoose-unique-validator ^3.0.0.
// This is used to validate unique inputs. eg) unique emails.
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  // "unique" property here is to speed up querying process when requested email.
  // When together with unique-validator, it also requires to only have unique email in db.
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  image: { type: String, required: true },

  // One user can have multiple places, so it needs to be array.
  places: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Place' }],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
