"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const maxVisible = 7;
  const pages: number[] = [];
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  const btn = "px-3.5 py-2 text-sm rounded-lg font-semibold transition-all";

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`${btn} ${currentPage <= 1 ? "text-mltext-light/40 cursor-not-allowed" : "text-mltext hover:bg-gray-100 border border-mlborder-light hover:border-mlborder"}`}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className={`${btn} text-mltext hover:bg-gray-100`}>1</button>
          {start > 2 && <span className="px-1 text-mltext-light">···</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`${btn} ${page === currentPage ? "bg-primary text-white shadow-md shadow-primary/20" : "text-mltext hover:bg-gray-100"}`}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-mltext-light">···</span>}
          <button onClick={() => onPageChange(totalPages)} className={`${btn} text-mltext hover:bg-gray-100`}>{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`${btn} ${currentPage >= totalPages ? "text-mltext-light/40 cursor-not-allowed" : "text-mltext hover:bg-gray-100 border border-mlborder-light hover:border-mlborder"}`}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
      </button>
    </nav>
  );
}
