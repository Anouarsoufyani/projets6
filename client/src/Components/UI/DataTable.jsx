"use client"

import { useState, useEffect } from "react"
import { FaSearch, FaChevronLeft, FaChevronRight, FaSort, FaSortUp, FaSortDown } from "react-icons/fa"

const DataTable = ({
  data = [],
  columns = [],
  onRowClick,
  selectedRow,
  pagination = true,
  searchable = true,
  emptyMessage = "Aucune donnée disponible",
  rowsPerPageOptions = [5, 10, 25, 50],
  initialRowsPerPage = 10,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage)
  const [filteredData, setFilteredData] = useState(data)
  const [hoveredRow, setHoveredRow] = useState(null)

  useEffect(() => {
    let result = [...data]

    // Appliquer la recherche
    if (searchTerm) {
      result = result.filter((item) =>
        Object.values(item).some((value) => {
          if (value === null || value === undefined) return false
          if (typeof value === "object") {
            return JSON.stringify(value).toLowerCase().includes(searchTerm.toLowerCase())
          }
          return String(value).toLowerCase().includes(searchTerm.toLowerCase())
        }),
      )
    }

    // Appliquer le tri
    if (sortConfig.key) {
      result.sort((a, b) => {
        // Gestion des valeurs imbriquées (ex: "client_id.nom")
        const aValue = sortConfig.key
          .split(".")
          .reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : null), a)
        const bValue = sortConfig.key
          .split(".")
          .reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : null), b)

        if (aValue === null || aValue === undefined) return sortConfig.direction === "ascending" ? 1 : -1
        if (bValue === null || bValue === undefined) return sortConfig.direction === "ascending" ? -1 : 1

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "ascending" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        }

        return sortConfig.direction === "ascending" ? aValue - bValue : bValue - aValue
      })
    }

    setFilteredData(result)
    setCurrentPage(1) // Réinitialiser à la première page après filtrage
  }, [data, searchTerm, sortConfig])

  const requestSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    } else if (sortConfig.key === key && sortConfig.direction === "descending") {
      key = null
      direction = null
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey)
      return (
        <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-all">
          <FaSort className="text-gray-400 w-2.5 h-2.5 group-hover:text-gray-600" />
        </span>
      )

    if (sortConfig.direction === "ascending")
      return (
        <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100">
          <FaSortUp className="text-emerald-600 w-2.5 h-2.5" />
        </span>
      )

    return (
      <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100">
        <FaSortDown className="text-emerald-600 w-2.5 h-2.5" />
      </span>
    )
  }

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = pagination ? filteredData.slice(startIndex, startIndex + rowsPerPage) : filteredData

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Toujours afficher la première page
      pages.push(1)

      // Calculer les pages du milieu
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Ajuster si on est proche du début ou de la fin
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4)
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3)
      }

      // Ajouter des ellipses si nécessaire
      if (startPage > 2) {
        pages.push("...")
      }

      // Ajouter les pages du milieu
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Ajouter des ellipses si nécessaire
      if (endPage < totalPages - 1) {
        pages.push("...")
      }

      // Toujours afficher la dernière page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-100 relative">
      {searchable && (
        <div className="p-5 border-b border-emerald-100">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-emerald-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto relative">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-left py-5 px-6 font-semibold ${
                    column.sortable !== false ? "cursor-pointer select-none group" : ""
                  } ${column.className || ""}`}
                  onClick={() => column.sortable !== false && requestSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable !== false && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <svg
                      className="w-12 h-12 text-gray-300 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-base">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={row._id || rowIndex}
                  className={`transition-all duration-200 ${
                    selectedRow && selectedRow._id === row._id
                      ? "bg-indigo-50"
                      : hoveredRow === row._id
                        ? "bg-gray-50"
                        : "bg-white"
                  }`}
                  onClick={() => onRowClick && onRowClick(row)}
                  onMouseEnter={() => setHoveredRow(row._id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ position: "relative", zIndex: hoveredRow === row._id ? 20 : 10 }}
                >
                  {columns.map((column) => (
                    <td
                      key={`${row._id || rowIndex}-${column.key}`}
                      className={`py-5 px-6 ${column.className || ""}`}
                      style={{ position: column.key === "actions" ? "relative" : "static" }}
                    >
                      {column.render ? column.render(row) : column.key.split(".").reduce((obj, key) => obj?.[key], row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center p-5 border-t border-emerald-100 bg-emerald-50 relative z-10">
          <div className="flex items-center mb-3 sm:mb-0">
            <span className="text-sm text-gray-600 mr-2">Lignes par page:</span>
            <select
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {rowsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600 ml-4">
              {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredData.length)} sur {filteredData.length}
            </span>
          </div>

          <div className="flex items-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-emerald-600 hover:bg-emerald-100 transition-colors"
              }`}
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex mx-2">
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === "number" && handlePageChange(page)}
                  className={`mx-1 min-w-[36px] h-9 rounded-lg ${
                    page === currentPage
                      ? "bg-emerald-600 text-white font-medium shadow-md"
                      : page === "..."
                        ? "text-gray-500 cursor-default"
                        : "text-gray-700 hover:bg-emerald-100 transition-colors"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-emerald-600 hover:bg-emerald-100 transition-colors"
              }`}
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
