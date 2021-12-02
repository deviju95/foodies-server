// extending built-in Error property using "class"
class HttpError extends Error {
  constructor(message, errorCode) {
    // super :: forwarding constructor of original built-in Error property.
    super(message);
    // Create HttpError.code property
    this.code = errorCode;
  }
}

module.exports = HttpError;
