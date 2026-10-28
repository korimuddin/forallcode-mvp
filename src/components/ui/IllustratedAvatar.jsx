const variantColors = {
  sage: { bg: "#dafbe1", eye: "#1a7f37", smile: "#1a7f37" },
  lavender: { bg: "#ddf4ff", eye: "#0969da", smile: "#0969da" },
  rose: { bg: "#ffebe9", eye: "#cf222e", smile: "#cf222e" },
  sky: { bg: "#ddf4ff", eye: "#6aa8d4", smile: "#6aa8d4" },
  amber: { bg: "#fff8c5", eye: "#9a6700", smile: "#9a6700" },
  teal: { bg: "#b8e8e0", eye: "#2dd4bf", smile: "#2dd4bf" },
  coral: { bg: "#f5c4b0", eye: "#d4704c", smile: "#d4704c" },
  slate: { bg: "#c8d0d8", eye: "#6a7a8c", smile: "#6a7a8c" }
};

export const avatarVariants = Object.keys(variantColors);

export default function IllustratedAvatar({
  size = 48,
  variant = "sage",
  className = "",
  photoUrl,
  alt = ""
}) {
  const colors = variantColors[variant] || variantColors.sage;
  const dimension = typeof size === "number" ? `${size}px` : size;

  if (photoUrl) {
    return (
      <img
        alt={alt}
        className={className}
        src={photoUrl}
        style={{
          width: dimension,
          height: dimension,
          borderRadius: "50%",
          objectFit: "cover",
          display: "block"
        }}
      />
    );
  }

  return (
    <svg
      aria-hidden={alt ? undefined : "true"}
      aria-label={alt || undefined}
      className={className}
      role={alt ? "img" : undefined}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      style={{ display: "block", flex: "0 0 auto" }}
    >
      <circle cx="24" cy="24" r="24" fill={colors.bg} />
      <ellipse cx="24" cy="20" rx="10" ry="10" fill="#ffffff" opacity="0.92" />
      <ellipse cx="24" cy="42" rx="16" ry="12" fill="#ffffff" opacity="0.92" />
      <circle cx="20" cy="18" r="1.5" fill={colors.eye} />
      <circle cx="28" cy="18" r="1.5" fill={colors.eye} />
      <path
        d="M21 23 Q24 26 27 23"
        fill="none"
        stroke={colors.smile}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
