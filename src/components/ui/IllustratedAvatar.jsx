const variantColors = {
  sage: { bg: "#c8d8c4", eye: "#7aaa72", smile: "#7aaa72" },
  lavender: { bg: "#ddd5f0", eye: "#9b8fd4", smile: "#9b8fd4" },
  rose: { bg: "#f5d5d8", eye: "#d4848c", smile: "#d4848c" },
  sky: { bg: "#cce0f0", eye: "#6aa8d4", smile: "#6aa8d4" },
  amber: { bg: "#f5e4c4", eye: "#c8a055", smile: "#c8a055" },
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
          borderRadius: 0,
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
      <rect x="0" y="0" width="48" height="48" fill={colors.bg} />
      <rect x="14" y="10" width="20" height="20" fill="#fffdf9" opacity="0.92" />
      <rect x="8" y="30" width="32" height="18" fill="#fffdf9" opacity="0.92" />
      <rect x="18.5" y="16.5" width="3" height="3" fill={colors.eye} />
      <rect x="26.5" y="16.5" width="3" height="3" fill={colors.eye} />
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
