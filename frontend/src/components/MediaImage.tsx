import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';

interface MediaImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
}

export default function MediaImage({
  src,
  alt,
  className,
  sizes = '100vw',
  priority = false,
  fill = true,
  width,
  height,
}: MediaImageProps) {
  if (!src) {
    return <div className={className} aria-hidden="true" />;
  }

  const imageSrc = getImageUrl(src);

  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        quality={75}
        className={className}
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width || 1200}
      height={height || 1200}
      sizes={sizes}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      quality={75}
      className={className}
    />
  );
}