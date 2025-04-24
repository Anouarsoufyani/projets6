"use client"

import { useState } from "react"

const ActionButton = ({ icon, label, onClick, color = "emerald", disabled = false, className = "" }) => {
  const [isHovered, setIsHovered] = useState(false)

  const colorStyles = {
    blue: {
      bg: "bg-blue-600",
      hover: "hover:bg-blue-700",
      text: "text-white",
      shadow: "shadow-blue-200",
    },
    emerald: {
      bg: "bg-emerald-600",
      hover: "hover:bg-emerald-700",
      text: "text-white",
      shadow: "shadow-emerald-200",
    },
    green: {
      bg: "bg-emerald-600",
      hover: "hover:bg-emerald-700",
      text: "text-white",
      shadow: "shadow-emerald-200",
    },
    red: {
      bg: "bg-red-600",
      hover: "hover:bg-red-700",
      text: "text-white",
      shadow: "shadow-red-200",
    },
    purple: {
      bg: "bg-purple-600",
      hover: "hover:bg-purple-700",
      text: "text-white",
      shadow: "shadow-purple-200",
    },
    amber: {
      bg: "bg-amber-600",
      hover: "hover:bg-amber-700",
      text: "text-white",
      shadow: "shadow-amber-200",
    },
    indigo: {
      bg: "bg-indigo-600",
      hover: "hover:bg-indigo-700",
      text: "text-white",
      shadow: "shadow-indigo-200",
    },
    gray: {
      bg: "bg-gray-600",
      hover: "hover:bg-gray-700",
      text: "text-white",
      shadow: "shadow-gray-200",
    },
  }

  const style = colorStyles[color] || colorStyles.emerald

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200
        ${style.bg} ${style.text} ${!disabled && style.hover}
        ${isHovered ? `shadow-md ${style.shadow}` : "shadow"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

export default ActionButton
