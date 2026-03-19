// items: array of strings or { label, onClick } objects
export default function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      {items.map((item, i) => {
        const label  = typeof item === 'string' ? item : item.label;
        const isLast = i === items.length - 1;
        const onClick = typeof item === 'object' ? item.onClick : undefined;
        return (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && <span className="breadcrumb-sep">/</span>}
            {isLast ? (
              <span className="breadcrumb-current">{label}</span>
            ) : onClick ? (
              <button
                onClick={onClick}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}
              >
                {label}
              </button>
            ) : (
              <a href="#">{label}</a>
            )}
          </span>
        );
      })}
    </nav>
  );
}
