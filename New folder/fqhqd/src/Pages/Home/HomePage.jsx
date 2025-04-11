import { FaUser, FaBiking, FaStore } from "react-icons/fa"
import { PropTypes } from "prop-types"
import { Link } from "react-router"
const HomePage = ({ navbarHeight }) => {
  return (
    <>
      <main className="w-full h-full">
        {/* En-tête principal */}
        <header
          className="flex flex-row w-full justify-center items-center bg-gradient-to-r from-emerald-500 to-emerald-700"
          style={{
            minHeight: "calc(100vh - " + navbarHeight + ")",
          }}
        >
          <div className="flex justify-center items-center w-1/2 h-full">
            <img src="deliver_truck_banner.svg" alt="Proximity Delivery" className="w-3/4" />
          </div>
          <div className="w-1/2 h-full flex flex-col justify-center items-center gap-8 px-16 text-white">
            <div className="flex flex-col gap-4 text-center">
              <h1 className="text-5xl font-bold">Révolutionnez vos livraisons avec Proximity</h1>
              <p className="text-2xl">Rapidité, fiabilité et durabilité au service de votre ville</p>
            </div>
            <div className="flex flex-col gap-6 w-full max-w-md">
              <h2 className="text-2xl font-semibold text-center">Commencez dès aujourd’hui</h2>
              <div className="flex flex-col gap-4">
                <Link
                  to={`/signup/?role=client`}
                  className="flex items-center justify-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-md hover:bg-emerald-100 transition duration-300"
                >
                  <FaUser /> Je suis un Client
                </Link>
                <Link
                  to={`/signup/?role=livreur`}
                  className="flex items-center justify-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-md hover:bg-emerald-100 transition duration-300"
                >
                  <FaBiking /> Je suis un Livreur
                </Link>
                <Link
                  to={`/signup/?role=commercant`}
                  className="flex items-center justify-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-md hover:bg-emerald-100 transition duration-300"
                >
                  <FaStore /> Je suis un Commerçant
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Section avantages */}
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Pourquoi choisir SmartCity ?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="bg-emerald-500 text-white p-4 rounded-full mb-4">
                  <FaBiking size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Livraisons Rapides</h3>
                <p>Recevez vos colis en un temps record grâce à notre réseau local.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="bg-emerald-500 text-white p-4 rounded-full mb-4">
                  <FaUser size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fiabilité Garantie</h3>
                <p>Un service de qualité assuré par des livreurs formés.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="bg-emerald-500 text-white p-4 rounded-full mb-4">
                  <FaStore size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Écoresponsable</h3>
                <p>Réduisez votre impact environnemental avec des livraisons durables.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pied de page avec appel à l’action */}
        <footer className="bg-emerald-700 text-white py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="mb-4">Prêt à transformer vos livraisons ?</p>
            <Link to="/signup">
              <button className="bg-white text-emerald-700 px-8 py-3 rounded-md hover:bg-emerald-100 transition duration-300">
                S’inscrire maintenant
              </button>
            </Link>
          </div>
        </footer>
      </main>
    </>
  )
}

HomePage.propTypes = {
  navbarHeight: PropTypes.string,
}

export default HomePage
