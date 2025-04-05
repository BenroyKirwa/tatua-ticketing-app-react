import React, { useState, useEffect } from 'react';
import sortIcon from '/sort.svg';
import filterIcon from '/filter.svg';
import cancelIcon from '/cancel.svg';

const DynamicTable = ({
  data = [],
  columns = [],
  onRefresh = () => {},
  enablePagination = true,
  enableSort = true,
  enableFilter = true,
  itemsPerPage = 5,
  isApiDriven = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCriteria, setSortCriteria] = useState([]);
  const [filterCriteria, setFilterCriteria] = useState([]);
  const [tempSortCriteria, setTempSortCriteria] = useState([]);
  const [tempFilterCriteria, setTempFilterCriteria] = useState([]);
  const [showSortPopup, setShowSortPopup] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [processedData, setProcessedData] = useState(data);

  const defaultRelationsByType = {
    string: [
      { value: 'eq', label: 'Equals' },
      { value: 'contains', label: 'Contains' },
      { value: 'startswith', label: 'Starts With' },
    ],
    number: [
      { value: 'eq', label: 'Equals' },
      { value: 'gt', label: 'Greater Than' },
      { value: 'lt', label: 'Less Than' },
    ],
    date: [
      { value: 'eq', label: 'Equals' },
      { value: 'gt', label: 'After' },
      { value: 'lt', label: 'Before' },
    ],
  };

  // Process data when data, sort, or filter changes
  useEffect(() => {
    const processData = async () => {
      const result = await applySortAndFilter(data);
      setProcessedData(result);
    };
    processData();
  }, [data, sortCriteria, filterCriteria, isApiDriven]);
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

  const allColumns = getDynamicColumns();
  const displayColumns = allColumns.filter((column) => !column.hide);

  const formatLabel = (key) =>
    key
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^./, (str) => str.toUpperCase())
      .replace('At', 'Date');

  const defaultSort = (dataToSort, sortCriteriaToUse, columns) => {
    if (!Array.isArray(columns)) {
      console.error('Columns prop is undefined or not an array.');
      return dataToSort;
    }

    return [...dataToSort].sort((a, b) => {
      for (const criterion of sortCriteriaToUse) {
        const { column, order } = criterion;
        const columnDef = columns.find((col) => col.key === column);
        const type = columnDef.type || 'string';

        if (!columnDef) {
          console.warn(`Column definition for "${column}" not found.`);
          return 0;
        }

        let valueA = a[column];
        let valueB = b[column];

        valueA = valueA ?? '';
        valueB = valueB ?? '';

        if (type === 'number') {
          valueA = parseFloat(valueA) || 0;
          valueB = parseFloat(valueB) || 0;
        } else if (type === 'date') {
          valueA = valueA ? new Date(valueA) : new Date(0);
          valueB = valueB ? new Date(valueB) : new Date(0);
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

  const defaultFilter = (dataToFilter, filterCriteriaToUse, columns) => {
    if (!Array.isArray(columns)) {
      console.error('Columns prop is undefined or not an array.');
      return dataToFilter;
    }

    return dataToFilter.filter((item) =>
      filterCriteriaToUse.every((criterion) => {
        const { column, relation, value } = criterion;
        if (!value) return true;
        const itemValue = item[column] ?? '';
        if (!itemValue && relation !== 'eq') return false;

        const columnDef = columns.find((col) => col.key === column) || {};
        const type = columnDef.type || 'string';

        if (type === 'string') {
          const lowerItemValue = itemValue.toString().toLowerCase();
          const lowerValue = value.toLowerCase();
          if (relation === 'eq') return lowerItemValue === lowerValue;
          if (relation === 'contains') return lowerItemValue.includes(lowerValue);
          if (relation === 'startswith') return lowerItemValue.startsWith(lowerValue);
        } else if (type === 'number') {
          const numValue = parseFloat(value);
          const itemNum = parseFloat(itemValue) || 0;
          if (relation === 'eq') return itemNum === numValue;
          if (relation === 'gt') return itemNum > numValue;
          if (relation === 'lt') return itemNum < numValue;
        } else if (type === 'date') {
          const dateValue = new Date(value);
          const itemDate = new Date(itemValue) || new Date(0);
          if (relation === 'eq') return itemDate.toDateString() === dateValue.toDateString();
          if (relation === 'gt') return itemDate > dateValue;
          if (relation === 'lt') return itemDate < dateValue;
        }
        return true;
      })
    );
  };

  const applySortAndFilter = async (dataToProcess) => {
    if (isApiDriven) {
      const sortQuery = sortCriteria
        .map((c) => `${c.column}:${c.order}`)
        .join(',');
      const filterQuery = filterCriteria
        .map((c) => `${c.column}:${c.relation}:${encodeURIComponent(c.value)}`)
        .join(',');

      const query = [];
      if (sortQuery) query.push(`sort=${sortQuery}`);
      if (filterQuery) query.push(`filter=${filterQuery}`);

      try {
        const updatedData = await fetchData(query.length ? `?${query.join('&')}` : '');
        return updatedData;
      } catch (error) {
        console.error('API fetch error:', error);
        return dataToProcess;
      }
    } else {
      let processedData = [...dataToProcess];

      if (enableFilter && filterCriteria.length > 0) {
        processedData = defaultFilter(processedData, filterCriteria, columns);
      }

      if (enableSort && sortCriteria.length > 0) {
        const validSortCriteria = sortCriteria.filter((c) =>
          columns.some((col) => col.key === c.column && col.isSort !== false)
        );
        processedData = defaultSort(processedData, validSortCriteria, columns);
      }

      return processedData;
    }
  };

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const indexOfLastItem = enablePagination ? currentPage * itemsPerPage : processedData.length;
  const indexOfFirstItem = enablePagination ? indexOfLastItem - itemsPerPage : 0;
  const currentItems = processedData.slice(indexOfFirstItem, indexOfLastItem);

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

  const addFilterCriteria = () => {
    const defaultColumn = columns[0]?.key || '';
    const columnDef = columns.find((col) => col.key === defaultColumn) || {};
    const type = columnDef.type || 'string';
    const relations = defaultRelationsByType[type] || defaultRelationsByType.string;
    setTempFilterCriteria([
      ...tempFilterCriteria,
      { id: Date.now(), column: defaultColumn, relation: relations[0].value, value: '' },
    ]);
  };

  const deleteFilterCriteria = (id) => {
    setTempFilterCriteria(tempFilterCriteria.filter((c) => c.id !== id));
  };

  const updateFilterCriterion = (id, field, value) => {
    if (field === 'column') {
      const columnDef = columns.find((col) => col.key === value) || {};
      const newType = columnDef.type || 'string';
      const newRelations = defaultRelationsByType[newType] || defaultRelationsByType.string;
      setTempFilterCriteria(
        tempFilterCriteria.map((c) =>
          c.id === id ? { ...c, column: value, relation: newRelations[0].value, value: '' } : c
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
              <span
                className="close-sort"
                onClick={(e) => {
                  e.stopPropagation();
                  setSortCriteria([]);
                  setCurrentPage(1);
                }}
              >
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
              <span
                className="close-filter"
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterCriteria([]);
                  setCurrentPage(1);
                }}
              >
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
            {displayColumns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentItems.map((item) => (
            <tr key={item.id}>
              {displayColumns.map((column) => {
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
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={currentPage === 1 ? 'disabled' : ''}
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={currentPage === 1 ? 'disabled' : ''}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? 'active' : ''}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={currentPage === totalPages ? 'disabled' : ''}
          >
            Next
          </button>
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
                          {allColumns
                            .filter((column) => column.isSort === true)
                            .map((column) => (
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
                    const columnDef = allColumns.find((col) => col.key === criterion.column) || {};
                    const columnType = columnDef.type || 'string';
                    const relations = defaultRelationsByType[columnType] || defaultRelationsByType.string;
                    return (
                      <div key={criterion.id} className="filter-criterion">
                        <div>
                          <p><b>Column:</b></p>
                          <select
                            value={criterion.column}
                            onChange={(e) => updateFilterCriterion(criterion.id, 'column', e.target.value)}
                          >
                            {allColumns.map((column) => (
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