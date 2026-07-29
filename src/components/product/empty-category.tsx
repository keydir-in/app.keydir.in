/**
 * Empty state display for categories with no products listed yet.
 * Shows an icon, message, and a link to browse vendors as an
 * alternative action.
 */

interface EmptyCategoryProps {
  category: string;
}

export function EmptyCategory({ category }: EmptyCategoryProps) {
  return (
    <div className="catalog-empty">
      <div className="catalog-empty-icon">📦</div>
      <div className="catalog-empty-title">NO {category.toUpperCase()} LISTED YET</div>
      <p className="catalog-empty-desc">
        This category doesn&apos;t have any products listed yet.
        <br />
        Browse our trusted vendors to discover available products or help grow the directory by suggesting one.
      </p>
      <a href="https://keydir.in/vendors" className="btn-primary">
        BROWSE VENDORS
      </a>
    </div>
  );
}
