const HomePage = () => {
    return (
        <>
            <main className="w-full h-full">
                <header className="flex flex-row w-full h-[95vh] justify-center items-center">
                    <div className="flex justify-center items-center w-1/2 h-full border-r border-slate-700">
                        <img src="deliver_truck_banner.svg" alt="" />
                    </div>
                    <div className="w-1/2 h-full flex flex-col justify-center items-center gap-4">
                        <div className="flex flex-col gap-2 h-1/3 padding-4 w-full justify-center items-center px-16">
                            <p className="text-4xl font-bold">
                                Bienvenue sur SmartCity!
                            </p>
                            <p className="text-xl">
                                Découvrez SmartCity, l'application
                                révolutionnaire qui transforme la façon dont
                                nous approchons la livraison en milieu urbain.
                                Notre service vous connecte avec des livreurs
                                locaux pour assurer un transport rapide et
                                fiable de vos colis, tout en réduisant
                                l'empreinte carbone et en soutenant l'économie
                                locale. Rejoignez-nous pour une expérience de
                                livraison plus intelligente et durable.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 h-1/3 w-full justify-center items-center px-16">
                            <h1 className="text-xl font-bold">Je suis un:</h1>
                            <button
                                className="bg-emerald-600 px-4 py-2 rounded-md hover:bg-emerald-500 text-white cursor-pointer"
                                type="button"
                            >
                                Client
                            </button>
                            <button
                                className="bg-emerald-600 px-4 py-2 rounded-md hover:bg-emerald-500 text-white cursor-pointer"
                                type="button"
                            >
                                Livreur
                            </button>
                            <button
                                className="bg-emerald-600 px-4 py-2 rounded-md hover:bg-emerald-500 text-white cursor-pointer"
                                type="button"
                            >
                                Commercant
                            </button>
                        </div>
                    </div>
                </header>
            </main>
        </>
    );
};

export default HomePage;
