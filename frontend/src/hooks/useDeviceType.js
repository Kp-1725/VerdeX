import { useEffect, useState } from "react";

function detectDeviceType() {
  if (typeof window === "undefined") {
    return {
      deviceType: "desktop",
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    };
  }

  const width = window.innerWidth;
  const ua = navigator.userAgent.toLowerCase();
  const isTouch =
    window.matchMedia("(pointer: coarse)").matches ||
    navigator.maxTouchPoints > 0;

  const isMobileUA = /android|iphone|ipod|windows phone/i.test(ua);
  const isTabletUA =
    /ipad|tablet|kindle|silk/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isMobileUA || width <= 767) {
    return {
      deviceType: "mobile",
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    };
  }

  if (
    isTabletUA ||
    (width > 767 && width <= 1100) ||
    (isTouch && width <= 1280)
  ) {
    return {
      deviceType: "tablet",
      isMobile: false,
      isTablet: true,
      isDesktop: false,
    };
  }

  return {
    deviceType: "desktop",
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  };
}

export function useDeviceType() {
  const [device, setDevice] = useState(detectDeviceType);

  useEffect(() => {
    function handleResize() {
      setDevice(detectDeviceType());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return device;
}
