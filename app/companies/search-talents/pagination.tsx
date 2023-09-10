import clsx from "clsx";
import Link from "next/link";
import { v4 as uuid } from "uuid";

export default function Pagination({
  itemsPerPage,
  activePage,
  totalItems,
  query,
}: {
  itemsPerPage: number;
  activePage?: number;
  totalItems: number;
  query: object;
}) {
  const numberOfPages = Math.ceil(totalItems / itemsPerPage);

  if (numberOfPages === 1) return null;

  return (
    <div className="flex justify-center mt-4 space-x-2">
      {Array.from({ length: numberOfPages }, (_, i) => i + 1).map((pageNum) => (
        <Link
          key={uuid()}
          className={clsx(activePage === pageNum && "text-yellow-400")}
          href={{
            href: "/companies/search-talents",
            query: { ...query, page: pageNum },
          }}
        >
          {pageNum}
        </Link>
      ))}
    </div>
  );
}
