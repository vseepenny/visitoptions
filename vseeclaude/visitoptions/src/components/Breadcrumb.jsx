export default function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      {items.map((item, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {i > 0 && <span className="breadcrumb-sep">/</span>}
          {i < items.length - 1 ? (
            <a href="#">{item}</a>
          ) : (
            <span className="breadcrumb-current">{item}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
