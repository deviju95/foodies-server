const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const fs = require('fs');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');

// ----- GET PLACE BY ID -----

const getPlaceById = async (req, res, next) => {
  // dynamic url, declared as "pid", can be extracted using params, and stored as a placeId.
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong. Error getting places from DB.',
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      'Could not find a place for the provided id.',
      404
    );
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) });
};

// ----- GET ALL PLACES OF USER BY USER ID -----

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  // "populate" allows to grab all places of that userId.
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate('places');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong. Error getting places from DB.',
      500
    );
    return next(error);
  }

  if (!userWithPlaces || userWithPlaces.length === 0) {
    return next(
      new HttpError('Could not find places for the provided user id.', 404)
    );
  }

  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

// ----- CREATE A PLACE -----

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(
      new HttpError('Invalid inputs passed. Cannot create a new place.', 422)
    );
  }

  // JSON data from request.body can be brought through "app.use(express.json());" at app.js.
  const { title, description, address } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    // req.file.path is a multer command, which automatically pulls the file path as string.
    image: req.file.path,
    // "req.userData" is created from check-auth.js.
    // when user is logged in, check-auth.js middleware stores userId in "req.userData".
    creator: req.userData.userId,
  });

  // check if the user exist before creating place.
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      'Error occurred during finding user in database',
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError('Could not find user in database', 404);
    return next(error);
  }

  // Save created place into database
  try {
    // session allows to commit change after when different isolated tasks all finish
    const sess = await mongoose.startSession();
    sess.startTransaction();
    // first task: saving created place data
    await createdPlace.save({ session: sess });
    // "push" method in mongoose allows to push "id" to its parent, in this case: user.places
    user.places.push(createdPlace);
    // second task: saving user data change
    await user.save({ session: sess });
    // finish session if all tasks are complete without error. otherwise, all session canceled.
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Creating place failed. Error during creating new place to database.',
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

// ----- UPDATE A PLACE -----

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed. Cannot update place.', 422)
    );
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError('Could not find place data from database', 500);
    return next(error);
  }

  // toString is used, because creator is "ObjectId"
  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      'You are not allowed to edit this place. Only creator can edit own places.',
      401
    );
    return next(error);
  }

  place.title = title;
  place.description = description;

  // save updated place to database
  try {
    await place.save();
  } catch (err) {
    const error = new HttpError('Could not update place to database', 500);
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

// ----- DELETE A PLACE -----

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    // "populate" only works when a property in Schema is connected with "ref".
    // this method allows to modify data of different collection.
    place = await (await Place.findById(placeId)).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Error during finding place data from database',
      500
    );
    return next(error);
  }

  // check if the place exist, before deleting
  if (!place) {
    const error = new HttpError('Could not find this place to delete', 404);
    return next(error);
  }

  // here, creator holds full user data because we "populated" it
  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError(
      'You are not allowed to delete this place.',
      401
    );
    return next(error);
  }

  const imagePath = place.image;

  // saving deletion to database
  try {
    // reminder that "creator" property holds user data as well through "populate"
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    // access places array inside creator inside this place.
    // pull() will remove the "id" of this place.
    place.creator.places.pull(place);
    // save updated user data.
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError('Could not delete place in database', 500);
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: 'Deleted place.' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
