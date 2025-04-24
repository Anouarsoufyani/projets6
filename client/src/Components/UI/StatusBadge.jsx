"use client"

import { useState } from "react"

// Modifier les couleurs des badges de statut pour utiliser plus de emerald
const STATUS_STYLES = {
  // Commandes
  en_attente: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  en_preparation: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    border: "border-blue-200",
  },
  prete_a_etre_recuperee: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
    border: "border-purple-200",
  },
  recuperee_par_livreur: {
    bg: "bg-pink-50",
    text: "text-pink-700",
    dot: "bg-pink-500",
    border: "border-pink-200",
  },
  en_livraison: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  livree: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  annulee: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    border: "border-red-200",
  },
  refusee: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    border: "border-red-200",
  },

  // Statuts utilisateurs
  "non vérifié": {
    bg: "bg-gray-50",
    text: "text-gray-700",
    dot: "bg-gray-500",
    border: "border-gray-200",
  },
  "en vérification": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  vérifié: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  refusé: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    border: "border-red-200",
  },

  // Statuts documents
  "en attente": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  validé: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  "document refusé": {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    border: "border-red-200",
  },

  // Statuts par défaut
  default: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
}

const StatusBadge = ({ status, className = "" }) => {
  const [isHovered, setIsHovered] = useState(false)
  const style = STATUS_STYLES[status] || STATUS_STYLES.default

  return (
    <span
      className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center border ${style.bg} ${style.text} ${style.border} ${className} transition-all duration-200 ${isHovered ? "shadow-sm transform scale-105" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className={`w-2 h-2 rounded-full mr-1.5 ${style.dot}`}></span>
      {status.replace(/_/g, " ")}
    </span>
  )
}

export default StatusBadge
