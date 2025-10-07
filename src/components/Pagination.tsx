import React from "react";

interface Props {
  currentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export const Pagination: React.FC<Props> = ({
  currentPage,
  totalPages,
  setCurrentPage,
}) => {
  return (
    <div className="pagination">
      <button
        className="cs-btn"
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
      >
        ⬅ Back
      </button>
      <button
        className="cs-btn"
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
      >
        Next ➡
      </button>
    </div>
  );
};
