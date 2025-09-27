import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ParallaxSectionProps {
  children: React.ReactNode;
  backgroundImage: string;
  className?: string;
  speed?: number;
}

export const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  backgroundImage,
  className = "",
  speed = 0.5,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 100}%`]);

  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setErrored(false);
    if (!backgroundImage) return;
    const img = new window.Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setErrored(true);

    // Always use the parameterized image URL for loading and as background
    const url = backgroundImage.includes("?")
      ? backgroundImage
      : `${backgroundImage}?auto=compress&cs=tinysrgb&w=1600&q=80`;

    img.src = url;
  }, [backgroundImage]);

  // Always use the parameterized image URL if loaded
  const url = backgroundImage.includes("?")
    ? backgroundImage
    : `${backgroundImage}?auto=compress&cs=tinysrgb&w=1600&q=80`;

  const effectiveBg = loaded && !errored ? `url(${url})` : undefined;

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        style={{
          y,
          backgroundImage: effectiveBg,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
        className={`absolute inset-0 -z-10 transition-opacity duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
      {!loaded && !errored && (
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-600 animate-pulse" />
      )}
      {errored && (
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-900 via-green-800 to-teal-700 flex items-center justify-center text-emerald-100 text-sm font-medium">
          Image unavailable
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
