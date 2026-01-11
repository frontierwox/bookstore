import React from 'react';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <IoChevronBack />
      </button>

      <div className="pagination-numbers">
        {pages.map((page) => (
          <button
            key={page}
            className={`pagination-number ${currentPage === page ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        className="pagination-btn"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <IoChevronForward />
      </button>

      <span className="pagination-info">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
};

export default Pagination;
