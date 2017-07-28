export default function fetchUser(req, res, next) {
  console.log(req.hull.cache);
  req.hull.cache.get("webhookRequest").then(result => {
    req.hull.user = result || {};
    return result;

  }).then(() => next());
}