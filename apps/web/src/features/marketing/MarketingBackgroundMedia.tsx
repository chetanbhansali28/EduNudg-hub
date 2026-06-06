import { isVideoMediaUrl } from "@/lib/mediaUrl";

type Props = {
  src: string;
  className?: string;
};

/** Hero/footer background — renders video or image from the same URL field. */
export function MarketingBackgroundMedia({ src, className }: Props) {
  if (isVideoMediaUrl(src)) {
    return (
      <video
        src={src}
        className={className}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
      />
    );
  }
  return <img src={src} alt="" className={className} />;
}
