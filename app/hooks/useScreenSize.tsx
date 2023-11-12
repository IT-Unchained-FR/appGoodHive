import { useState, useEffect } from "react";

// Define the breakpoints for different screen size categories
const screenSizes = {
  desktop: 1300,
  laptop: 992,
  tablet: 768,
  mobile: 576,
};

export const useScreenSize = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLaptop, setIsLaptop] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScreenSize = () => {
      const windowWidth = window.innerWidth;
      if (windowWidth >= screenSizes.desktop) {
        setIsDesktop(true);
      } else if (windowWidth >= screenSizes.laptop) {
        setIsLaptop(true);
      } else if (windowWidth >= screenSizes.tablet) {
        setIsTablet(true);
      } else {
        setIsMobile(true);
      }
    };
    // Call the handleResize function initially to set the initial screen size
    handleScreenSize();

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener("resize", handleScreenSize);
    };
  }, []);

  return { isDesktop, isLaptop, isTablet, isMobile };
};
