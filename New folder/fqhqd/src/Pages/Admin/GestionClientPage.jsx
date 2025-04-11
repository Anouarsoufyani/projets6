import { useAuthUserQuery } from "../../Hooks/useAuthQueries"
import { useGetClients } from "../../Hooks/useGetUsers"
import { useLocation } from "react-router"

const fakeClients = [
  {
    id: "C001",
    nom: "Anouar Soufyani",
    email: "anouar@email.com",
    statut: "actif",
  },
  {
    id: "C002",
    nom: "Rayan Hasnaoui-Mounir",
    email: "rayan@email.com",
    statut: "inactif",
  },
  {
    id: "C003",
    nom: "Fahed Zakaria",
    email: "fahed@email.com",
    statut: "actif",
  },
]

const GestionUsersPage = () => {
  const { data: authUser, isLoading } = useAuthUserQuery()
  const location = useLocation()
  const path = location.pathname
  const role = path.split("/")[1]
  const { data: users } = useGetClients()
  console.log("users", users)

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"></div>
  }

  if (!authUser) {
    return <div className="text-center text-red-600">Erreur : Utilisateur non trouvé</div>
  }

  return (
    <main className="w-full min-h-full bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-emerald-700 mb-6">Gestion client</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-emerald-100 to-emerald-200">
          <h2 className="text-lg font-semibold text-emerald-800">Liste des clients ({users.data.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 text-sm font-semibold text-gray-700">ID</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-700">Nom</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-700">Statut</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.data.map((data) => (
                <tr key={data.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">{data.id}</td>
                  <td className="py-3 px-4">{data.nom}</td>
                  <td className="py-3 px-4">{data.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        data.statut === "actif" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {data.statut}
                    </span>
                  </td>
                  <td className="py-3 px-4 flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800 transition-colors">Voir</button>
                    <button className="text-amber-600 hover:text-amber-800 transition-colors">Modifier</button>
                    <button className="text-red-600 hover:text-red-800 transition-colors">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

export default GestionUsersPage
