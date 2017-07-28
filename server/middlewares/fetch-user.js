export default function fetchUser(req, res, next) {
  req.hull.cache.get("webhookRequest").then(result => {
    req.hull.user = result || {};
    return result;

  }).then(() => next());
}