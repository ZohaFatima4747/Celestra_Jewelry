/**
 * sanitize.js — Strips MongoDB operator keys ($, .) from req.body, req.query,
 * and req.params to prevent NoSQL injection attacks.
 *
 * Uses mongo-sanitize under the hood.
 */

const sanitize = require("mongo-sanitize");

/**
 * Recursively sanitize an object in-place.
 * mongo-sanitize handles nested objects and arrays.
 */
const sanitizeMiddleware = (req, _res, next) => {
  if (req.body)   req.body   = sanitize(req.body);
  if (req.query)  req.query  = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
};

module.exports = sanitizeMiddleware;
