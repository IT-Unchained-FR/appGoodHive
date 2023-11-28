import { FC } from "react";
import Link from "next/link";

import clsx from "clsx";
import { v4 as uuid } from "uuid";

import { PaginationProps } from "./pagination.types";

export const Pagination: FC<PaginationProps> = (props) => {
  const {
    itemsPerPage,
    activePage,
    totalItems,
    query,
    isSearchTalent = false,
  } = props;

  const numberOfPages = Math.ceil(totalItems / itemsPerPage);

  if (numberOfPages === 1) return null;

  return (
    <div className="flex justify-end mt-7 pr-12 space-x-2">
      {Array.from({ length: numberOfPages }, (_, i) => i + 1).map((pageNum) => (
        <Link
          key={uuid()}
          className={clsx(
            "w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-black",
            activePage === pageNum && "text-yellow-400"
          )}
          href={{
            href: isSearchTalent
              ? "/companies/search-talents"
              : "/talents/job-search/",
            query: { ...query, page: pageNum },
          }}
        >
          {pageNum}
        </Link>
      ))}
    </div>
  );
};
