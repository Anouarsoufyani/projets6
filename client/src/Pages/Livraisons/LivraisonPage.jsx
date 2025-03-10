const LivraisonPage = () => {
    return (
        <div>
            {" "}
            {/* Ajout de marge gauche égale à la largeur de la sidebar (w-72) */}
            <main className="w-full h-screen bg-gray-100 p-6">
                <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                    Livraison
                </h1>
                <div className="h-9/10 w-full bg-black p-4">
                    <div></div>
                    <div className="w-7/10 h-full bg-amber-500"></div>
                </div>
                {/* Contenu du dashboard ici */}
            </main>
        </div>
    );
};

export default LivraisonPage;
