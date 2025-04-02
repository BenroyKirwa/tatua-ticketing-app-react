import React, { useState } from 'react';
import sortIcon from '/sort.svg';
import filterIcon from '/filter.svg';
import cancelIcon from '/cancel.svg';


const DynamicTable = ({
  data = [],
  columns = [],
  onRefresh = () => { },
  enablePagination = true,
  enableSort = true,
  enableFilter = true,
  itemsPerPage = 5,
  columnTypes = {},
  relationsByType = {},
  customSort = null,
  customFilter = null,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCriteria, setSortCriteria] = useState([]);
  const [filterCriteria, setFilterCriteria] = useState([]);
  const [tempSortCriteria, setTempSortCriteria] = useState([]);
  const [tempFilterCriteria, setTempFilterCriteria] = useState([]);
  const [showSortPopup, setShowSortPopup] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);

  // Fallback: Generate columns from data if not provided
  const getDynamicColumns = () => {
    if (columns.length > 0) return columns;
    if (data.length === 0) return [];
    const firstItem = data[0];
    return Object.keys(firstItem).map((key) => ({
      key,
      label: formatLabel(key),
    }));
  };

  const formatLabel = (key) =>
    key
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^./, (str) => str.toUpperCase())
      .replace('At', 'Date');

  // Default sorting logic
  const defaultSort = (dataToSort, sortCriteriaToUse) => {
    return [...dataToSort].sort((a, b) => {
      for (const criterion of sortCriteriaToUse) {
        const { column, order } = criterion;
        let valueA = a[column] || '';
        let valueB = b[column] || '';
        const type = columnTypes[column] || 'string';

        if (type === 'number') {
          valueA = parseFloat(valueA) || 0;
          valueB = parseFloat(valueB) || 0;
        } else if (type === 'date') {
          valueA = new Date(valueA);
          valueB = new Date(valueB);
        } else {
          valueA = valueA.toString().toLowerCase();
          valueB = valueB.toString().toLowerCase();
        }

        if (valueA < valueB) return order === 'asc' ? -1 : 1;
        if (valueA > valueB) return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Default filtering logic
  const defaultFilter = (dataToFilter, filterCriteriaToUse) => {
    return dataToFilter.filter((item) =>
      filterCriteriaToUse.every((criterion) => {
        const { column, relation, value } = criterion;
        if (!value) return true;
        const itemValue = item[column];
        if (!itemValue) return false;

        const type = columnTypes[column] || 'string';
        if (type === 'string') {
          const lowerItemValue = itemValue.toLowerCase();
          const lowerValue = value.toLowerCase();
          if (relation === 'eq') return lowerItemValue === lowerValue;
          if (relation === 'contains') return lowerItemValue.includes(lowerValue);
          if (relation === 'startswith') return lowerItemValue.startsWith(lowerValue);
        } else if (type === 'number') {
          const numValue = parseFloat(value);
          const itemNum = parseFloat(itemValue);
          if (relation === 'eq') return itemNum === numValue;
          if (relation === 'gt') return itemNum > numValue;
          if (relation === 'lt') return itemNum < numValue;
        } else if (type === 'date') {
          const dateValue = new Date(value);
          const itemDate = new Date(itemValue);
          if (relation === 'eq') return dateValue.toDateString() === itemDate.toDateString();
          if (relation === 'gt') return itemDate > dateValue;
          if (relation === 'lt') return itemDate < dateValue;
        }
        return true;
      })
    );
  };

  // Apply sort and filter
  const applySortAndFilter = (dataToProcess) => {
    let processedData = [...dataToProcess];
    if (enableFilter && filterCriteria.length > 0) {
      processedData = customFilter ? customFilter(processedData, filterCriteria) : defaultFilter(processedData, filterCriteria);
    }
    if (enableSort && sortCriteria.length > 0) {
      processedData = customSort ? customSort(processedData, sortCriteria) : defaultSort(processedData, sortCriteria);
    }
    return processedData;
  };

  // Pagination logic
  const processedData = applySortAndFilter(data);
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const indexOfLastItem = enablePagination ? currentPage * itemsPerPage : processedData.length;
  const indexOfFirstItem = enablePagination ? indexOfLastItem - itemsPerPage : 0;
  const currentItems = processedData.slice(indexOfFirstItem, indexOfLastItem);

  // Sort Popup Logic
  const addSortCriteria = () => {
    const defaultColumn = columns[0]?.key || '';
    setTempSortCriteria([...tempSortCriteria, { id: Date.now(), column: defaultColumn, order: 'asc' }]);
  };

  const deleteSortCriteria = (id) => {
    setTempSortCriteria(tempSortCriteria.filter((c) => c.id !== id));
  };

  const updateSortCriterion = (id, field, value) => {
    setTempSortCriteria(
      tempSortCriteria.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSortApply = () => {
    setSortCriteria(tempSortCriteria);
    setShowSortPopup(false);
    setCurrentPage(1);
  };

  const handleSortReset = () => {
    setTempSortCriteria([]);
    setSortCriteria([]);
  };

  // Filter Popup Logic
  const addFilterCriteria = () => {
    const defaultColumn = columns[0]?.key || '';
    const defaultType = columnTypes[defaultColumn] || 'string';
    const defaultRelations = relationsByType[defaultType] || [];
    setTempFilterCriteria([
      ...tempFilterCriteria,
      { id: Date.now(), column: defaultColumn, relation: defaultRelations[0]?.value || 'eq', value: '' },
    ]);
  };

  const deleteFilterCriteria = (id) => {
    setTempFilterCriteria(tempFilterCriteria.filter((c) => c.id !== id));
  };

  const updateFilterCriterion = (id, field, value) => {
    if (field === 'column') {
      const newType = columnTypes[value] || 'string';
      const newRelations = relationsByType[newType] || [];
      setTempFilterCriteria(
        tempFilterCriteria.map((c) =>
          c.id === id ? { ...c, column: value, relation: newRelations[0]?.value || 'eq', value: '' } : c
        )
      );
    } else {
      setTempFilterCriteria(
        tempFilterCriteria.map((c) => (c.id === id ? { ...c, [field]: value } : c))
      );
    }
  };

  const handleFilterApply = () => {
    setFilterCriteria(tempFilterCriteria);
    setShowFilterPopup(false);
    setCurrentPage(1);
  };

  const handleFilterReset = () => {
    setTempFilterCriteria([]);
    setFilterCriteria([]);
  };

  const tableColumns = getDynamicColumns();

  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div className="dynamic-table">
      <div className="table-controls">
        {enableSort && (
          <button
            className={`sort-btn ${sortCriteria.length > 0 ? 'sorted' : ''}`}
            onClick={() => {
              setTempSortCriteria(sortCriteria);
              setShowSortPopup(true);
            }}
          >
            <img src={sortIcon} alt="sort icon" height="15" width="15" />
            <b>{sortCriteria.length > 0 ? `${sortCriteria.length} Sort` : 'Sort'}</b>
            {sortCriteria.length > 0 && (
              <span className="close-sort" onClick={(e) => { e.stopPropagation(); setSortCriteria([]); setCurrentPage(1); }}>
                ×
              </span>
            )}
          </button>
        )}
        {enableFilter && (
          <button
            className={`filter-btn ${filterCriteria.length > 0 ? 'filtered' : ''}`}
            onClick={() => {
              setTempFilterCriteria(filterCriteria);
              setShowFilterPopup(true);
            }}
          >
            <img src={filterIcon} alt="filter icon" height="15" width="15" />
            <b>{filterCriteria.length > 0 ? `${filterCriteria.length} Filter` : 'Filter'}</b>
            {filterCriteria.length > 0 && (
              <span className="close-filter" onClick={(e) => { e.stopPropagation(); setFilterCriteria([]); setCurrentPage(1); }}>
                ×
              </span>
            )}
          </button>
        )}
        <button className="refresh-btn" onClick={onRefresh}>
          <b>↻ Refresh</b>
        </button>
      </div>
      <table>
        <thead>
          <tr>
            {tableColumns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentItems.map((item) => (
            <tr key={item.id}>
              {tableColumns.map((column) => {
                const value = item[column.key];
                const content = column.formatter ? column.formatter(value, item) : value;
                return <td key={`${item.id}-${column.key}`}>{content}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {enablePagination && totalPages > 1 && (
        <div className="pagination">
          {/* First Page Button */}
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={currentPage === 1 ? 'disabled' : ''}
          >
            First
          </button>

          {/* Previous Page Button */}
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={currentPage === 1 ? 'disabled' : ''}
          >
            Previous
          </button>

          {/* Page Numbers */}
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? 'active' : ''}
            >
              {page}
            </button>
          ))}

          {/* Next Page Button */}
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={currentPage === totalPages ? 'disabled' : ''}
          >
            Next
          </button>

          {/* Last Page Button */}
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className={currentPage === totalPages ? 'disabled' : ''}
          >
            Last
          </button>
        </div>
      )}

      {/* Sort Popup */}
      {enableSort && showSortPopup && (
        <div className="popup" style={{ display: 'block' }}>
          <div className="popup-content">
            <div className="sort-popup">
              <div className="sort-popup-header">
                <div className="sort-header-start">
                  <img src={sortIcon} alt="sort icon" width="20" height="20" />
                  <h2>Sort Data</h2>
                </div>
                <img
                  className="close"
                  onClick={() => setShowSortPopup(false)}
                  src={cancelIcon}
                  alt="close icon"
                  width="20"
                  height="20"
                />
              </div>
              <div className="sort-popup-body">
                {tempSortCriteria.length === 0 ? (
                  <button onClick={addSortCriteria}>Add Sort</button>
                ) : (
                  tempSortCriteria.map((criterion) => (
                    <div key={criterion.id} className="sort-criterion">
                      <div>
                        <p><b>Column:</b></p>
                        <select
                          value={criterion.column}
                          onChange={(e) => updateSortCriterion(criterion.id, 'column', e.target.value)}
                        >
                          {tableColumns.map((column) => (
                            <option key={column.key} value={column.key}>
                              {column.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <p><b>Order:</b></p>
                        <select
                          value={criterion.order}
                          onChange={(e) => updateSortCriterion(criterion.id, 'order', e.target.value)}
                        >
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                      </div>
                      <button onClick={() => deleteSortCriteria(criterion.id)}>🗑️</button>
                    </div>
                  ))
                )}
                {tempSortCriteria.length > 0 && <button onClick={addSortCriteria}>Add Sort</button>}
              </div>
              <div className="sort-popup-footer">
                <button onClick={handleSortReset}>Reset Sort</button>
                <button onClick={handleSortApply}>Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Popup */}
      {enableFilter && showFilterPopup && (
        <div className="popup" style={{ display: 'block' }}>
          <div className="popup-content">
            <div className="filter-popup">
              <div className="filter-popup-header">
                <div className="filter-header-start">
                  <img src={filterIcon} alt="filter icon" width="20" height="20" />
                  <h2>Filter Data</h2>
                </div>
                <img
                  className="close"
                  onClick={() => setShowFilterPopup(false)}
                  src={cancelIcon}
                  alt="close icon"
                  width="20"
                  height="20"
                />
              </div>
              <div className="filter-popup-body">
                {tempFilterCriteria.length === 0 ? (
                  <button onClick={addFilterCriteria}>Add Filter</button>
                ) : (
                  tempFilterCriteria.map((criterion) => {
                    const columnType = columnTypes[criterion.column] || 'string';
                    const relations = relationsByType[columnType] || [];
                    return (
                      <div key={criterion.id} className="filter-criterion">
                        <div>
                          <p><b>Column:</b></p>
                          <select
                            value={criterion.column}
                            onChange={(e) => updateFilterCriterion(criterion.id, 'column', e.target.value)}
                          >
                            {tableColumns.map((column) => (
                              <option key={column.key} value={column.key}>
                                {column.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <p><b>Relation:</b></p>
                          <select
                            value={criterion.relation}
                            onChange={(e) => updateFilterCriterion(criterion.id, 'relation', e.target.value)}
                          >
                            {relations.map((rel) => (
                              <option key={rel.value} value={rel.value}>
                                {rel.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <p><b>Value:</b></p>
                          <input
                            type="text"
                            value={criterion.value}
                            placeholder="Enter a value"
                            onChange={(e) => updateFilterCriterion(criterion.id, 'value', e.target.value)}
                          />
                        </div>
                        <button onClick={() => deleteFilterCriteria(criterion.id)}>🗑️</button>
                      </div>
                    );
                  })
                )}
                {tempFilterCriteria.length > 0 && <button onClick={addFilterCriteria}>Add Filter</button>}
              </div>
              <div className="filter-popup-footer">
                <button onClick={handleFilterReset}>Reset Filter</button>
                <button onClick={handleFilterApply}>Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicTable;