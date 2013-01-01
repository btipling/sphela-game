if (typeof requestAnimationFrame === 'undefined') {
  var requestAnimationFrame;
  if (typeof mozRequestAnimationFrame !== 'undefined') {
    requestAnimationFrame = mozRequestAnimationFrame;
  }
  if (typeof msRequestAnimationFrame !== 'undefined') {
    requestAnimationFrame = msRequestAnimationFrame;
  }
}
