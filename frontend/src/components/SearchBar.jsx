import React, { useState, useEffect, useCallback } from 'react';
import { IoSearch, IoClose } from 'react-icons/io5';

const SearchBar = ({ onSearch, placeholder = 'Search products...' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearch = useCallback(
    (value) => {
      const handler = setTimeout(() => {
        onSearch(value);
      }, 300);
      return () => clearTimeout(handler);
    },
    [onSearch]
  );

  useEffect(() => {
    if (searchTerm) {
      const cleanup = debouncedSearch(searchTerm);
      return cleanup;
    } else {
      onSearch('');
    }
  }, [searchTerm, debouncedSearch, onSearch]);

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <div className="search-bar-container">
      <form className="search-bar" onSubmit={handleSubmit}>
        <IoSearch className="search-icon" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="search-input"
        />
        {searchTerm && (
          <button type="button" className="clear-btn" onClick={handleClear}>
            <IoClose />
          </button>
        )}
      </form>
      {/* Popular searches could be added here */}
    </div>
  );
};

export default SearchBar;
