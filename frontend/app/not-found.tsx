// Root-level 404: URLs outside the (store) route group (and any unmatched
// path) fall through to this file — the group-level not-found only catches
// notFound() thrown inside (store) routes.
export { default } from './(store)/not-found';
