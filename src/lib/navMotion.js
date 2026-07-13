// Tiny shared flag between SwipeBack and AnimatedRoutes.
// SwipeBack sets it right before navigate(-1) so the router knows the exit
// was ALREADY animated by the gesture and must not replay a second slide
// (the replay is what caused the visible flash after swiping back).
export const navMotion = { swipeBack: false }