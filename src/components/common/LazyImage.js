import { useState, useEffect } from 'react';
import { Skeleton } from '@mui/material';

const LazyImage = ({ src, alt, width, height, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
  }, [src]);

  if (!isLoaded) {
    return <Skeleton variant="rectangular" width={width} height={height} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      {...props}
    />
  );
};

export default LazyImage; 