import React, { useCallback } from "react";

interface Props {
  currentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export const Pagination = React.memo<Props>(
  ({ currentPage, totalPages, setCurrentPage }) => {
    const handlePrevious = useCallback(() => {
      setCurrentPage((p) => Math.max(1, p - 1));
    }, [setCurrentPage]);

    const handleNext = useCallback(() => {
      setCurrentPage((p) => Math.min(totalPages, p + 1));
    }, [setCurrentPage, totalPages]);

    return (
      <div className="pagination" role="navigation" aria-label="Pagination">
        <button
          className="cs-btn"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          ⬅ Back
        </button>

        <span style={{ margin: "0 1rem", color: "#666" }}>
          Page {currentPage} of {totalPages}
        </span>

        <button
          className="cs-btn"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          Next ➡
        </button>
      </div>
    );
  },
);
