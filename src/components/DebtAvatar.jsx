export function DebtAvatar({ debt, className = '', size = 20 }) {
  if (debt.iconUrl) {
    return (
      <img
        src={debt.iconUrl}
        alt=""
        className={`debt-avatar-img ${className}`.trim()}
        width={size}
        height={size}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span className={`debt-avatar-emoji ${className}`.trim()} style={{ fontSize: size }}>
      {debt.emoji || '💳'}
    </span>
  );
}
