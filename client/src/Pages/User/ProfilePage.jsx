const DashboardPage = () => {
    return (
        <div className="ml-72">
            {" "}
            {/* Ajout de marge gauche égale à la largeur de la sidebar (w-72) */}
            <main className="w-full min-h-screen bg-gray-100 p-6">
                <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                    Profil
                </h1>
                {/* Contenu du dashboard ici */}
            </main>
        </div>
    );
};

export default DashboardPage;
