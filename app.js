const express = require('express');
const mongoose = require('mongoose');

const app = express();

const usersRoutes = require('./routes/users-routes');
const placesRoutes = require('./routes/places-routes');
const HttpError = require('./models/http-error');
const fileDelete = require('./middleware/file-delete');

// allows to accept incoming req in body as json object.
app.use(express.json());

// to fix CORS error, this will attach certain headers to the
// responses (res) that server sends back to the frontend.
// so that frontend have access to the resources from backend.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    // Authorization header is attached for "check-auth.js" middleware.
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

  next();
});

// ------ Places Routes ------

app.use('/api/places', placesRoutes);

// ------ Users Routes ------

app.use('/api/users', usersRoutes);

// throw error if user reach out neither of above path.
app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

// ------ Error Routes ------

// Middleware with 4 parameters:: default "error" handler from express.
// So whenever an "Error" is thrown, or passed on by next(),
// this middleware will trigger.
app.use((error, req, res, next) => {
  // req.file:: multer package's command line that checks if
  // we "have" a file as a part of the ongoing request,
  // it "unlinks" aka delete that specific file.
  if (req.file) {
    fileDelete(req.file.location);
  }
  // res.headerSent checks if we have already sent a response,
  // we will return next and forward the error, not sending any response in this stage.
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred!' });
});

// connecting backend to mongoDB using mongoose.
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.aeu5d.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    // Need to address server-side Port here where backend will listen to.
    app.listen(process.env.PORT || 5000);
  })
  .catch((err) => {
    console.log(err);
  });
