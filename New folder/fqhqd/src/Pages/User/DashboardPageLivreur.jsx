"use client"

import { useAuthUserQuery } from "../../Hooks/useAuthQueries"
import useToggleActive from "../../Hooks/useToggleActive"
// import { useState, useEffect } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api"
import useDeliveryPosition from "../../Hooks/useDeliveryPosition"
import { useGetUserCommandes } from "../../Hooks/useGetCommandes"
// import useReviews from "../../hooks/useReviews";

const containerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "8px",
}

const DashboardPageLivreur = () => {
  const { data: authUser } = useAuthUserQuery()
  const { toggleActive, isToggleActive } = useToggleActive()
  const { data: commandesData } = useGetUserCommandes()
  const commandeEnCours = commandesData?.commandes?.find((cmd) => cmd.statut === "en_livraison")
  const { position, loading, error } = useDeliveryPosition(authUser?.disponibilite, authUser?._id, commandeEnCours?._id)

  const handleToggleActive = async () => {
    if (!authUser?._id) return
    await toggleActive(authUser._id)
    window.location.reload()
  }

  return (
    <div className="w-full h-full bg-gray-100 p-6">
      {authUser?.statut !== "vérifié" ? (
        <div className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow-lg mb-6 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-6">Compte non vérifié</h1>
          <p className="text-gray-700">
            Votre compte n’est pas encore vérifié. Veuillez soumettre vos pièces justificatives pour finaliser votre
            inscription, ou patienter pendant la vérification par un administrateur.
            <br />
            <br />
            <a href="justificative" className="text-emerald-700 font-bold underline">
              Suivez votre statut ici
            </a>
          </p>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-emerald-700 mb-6">Bienvenue {authUser.nom}</h1>
          <div
            className={
              authUser.disponibilite
                ? " h-9/10 flex flex-col gap-4 bg-white p-6 rounded-lg shadow-lg mb-6 text-center"
                : "flex flex-col gap-4 bg-white p-6 rounded-lg shadow-lg mb-6 text-center"
            }
          >
            <div className="flex justify-center items-center">
              <button
                onClick={() => {
                  handleToggleActive()
                }}
                disabled={isToggleActive}
                className={`${
                  isToggleActive ? "bg-gray-400 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-700"
                } text-white font-bold py-2 px-6 rounded-full shadow-md transition duration-300`}
              >
                {isToggleActive ? "Activation..." : authUser.disponibilite ? "Arrêter de livrer" : "Commencer à livrer"}
              </button>
            </div>

            {authUser.disponibilite && (
              <div className="w-full h-full">
                {loading ? (
                  <p className="text-gray-600">Chargement de la carte...</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : position ? (
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={position}
                    zoom={13}
                    options={{
                      mapTypeControl: false,
                      streetViewControl: false,
                      fullscreenControl: true,
                      zoomControl: true,
                    }}
                  >
                    <Marker
                      position={position}
                      icon={{
                        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                      }}
                    />
                  </GoogleMap>
                ) : (
                  <p className="text-gray-600">Impossible de récupérer votre position.</p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default DashboardPageLivreur
