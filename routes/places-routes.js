const express = require('express');
const { check } = require('express-validator');

const placesControllers = require('../controllers/places-controllers');
const checkAuth = require('../middleware/check-auth');
const fileUpload = require('../middleware/file-upload');

// Router() allows to export the whole middleware created in this page to app.js.
const router = express.Router();

router.get('/:pid', placesControllers.getPlaceById);

router.get('/user/:uid', placesControllers.getPlacesByUserId);

// route requests below this middleware are only accessible with a valid token.
router.use(checkAuth);

router.post(
  '/',
  // uploading a single file through multer.
  fileUpload.single('image'),
  // backend-side validator using express default validator.
  // This will trigger if "validationResult" is set up in the controller.
  [
    check('title').not().isEmpty(),
    check('description').isLength({ min: 5 }),
    check('address').not().isEmpty(),
  ],
  placesControllers.createPlace
);

router.patch(
  '/:pid',
  [check('title').not().isEmpty(), check('description').isLength({ min: 5 })],
  placesControllers.updatePlace
);

router.delete('/:pid', placesControllers.deletePlace);

module.exports = router;
