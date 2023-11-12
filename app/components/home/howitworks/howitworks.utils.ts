export const generateVideoWidthHeight = (
  isTablet: boolean,
  isMobile: boolean
) => {
  /* ratio should be 16:9 */
  let width = 950;
  let height = 534;

  if (isTablet) {
    width = 700;
    height = 393;
  }

  if (isMobile) {
    width = 320;
    height = 180;
  }

  return [ width, height ];
};
