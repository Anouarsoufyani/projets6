import { Server } from "socket.io";

const configureSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Structures pour stocker les positions et statuts des livreurs
  const livreurPositions = new Map();
  const livreurStatuts = new Map();

  io.on("connection", (socket) => {
    console.log("Nouvelle connexion socket:", socket.id);

    // Gérer l'authentification du socket
    socket.on("authenticate", (userData) => {
      if (userData && userData.userId) {
        socket.userId = userData.userId;
        socket.userRole = userData.role;

        console.log(
          `Utilisateur authentifié: ${userData.userId} (${userData.role})`
        );

        // Si c'est un livreur, rejoindre sa propre salle
        if (userData.role === "livreur") {
          socket.join(`livreur:${userData.userId}`);
        }
      }
    });

    // Gérer la mise à jour de position du livreur
    socket.on("updatePosition", (positionData) => {
      if (socket.userRole === "livreur" && socket.userId) {
        const { lat, lng, commandeId } = positionData;

        // Stocker la position mise à jour
        livreurPositions.set(socket.userId, {
          lat,
          lng,
          lastUpdate: new Date(),
        });

        console.log(
          `Position du livreur ${socket.userId} mise à jour:`,
          positionData
        );

        // Émettre la mise à jour à tous les clients suivant cette commande
        if (commandeId) {
          io.to(`commande:${commandeId}`).emit("livreurPositionUpdate", {
            livreurId: socket.userId,
            position: { lat, lng },
            commandeId,
          });
        }
      }
    });

    // Nouvel événement: Commencer une livraison
    socket.on("startDelivery", (data) => {
      if (socket.userRole === "livreur" && socket.userId) {
        const { commandeId } = data;

        // Mettre à jour le statut du livreur
        livreurStatuts.set(socket.userId, {
          status: "en_livraison",
          commandeId,
          lastUpdate: new Date(),
        });

        console.log(
          `Livreur ${socket.userId} a commencé la livraison ${commandeId}`
        );

        // Notifier tous les clients qui suivent cette commande
        io.to(`commande:${commandeId}`).emit("deliveryStatusUpdate", {
          livreurId: socket.userId,
          commandeId,
          status: "en_livraison",
          timestamp: new Date(),
        });
      }
    });

    // Nouvel événement: Terminer une livraison
    socket.on("endDelivery", (data) => {
      if (socket.userRole === "livreur" && socket.userId) {
        const { commandeId, status } = data;

        // Mettre à jour le statut du livreur
        livreurStatuts.set(socket.userId, {
          status: status || "disponible",
          lastUpdate: new Date(),
        });

        console.log(
          `Livreur ${socket.userId} a terminé la livraison ${commandeId}`
        );

        // Notifier tous les clients qui suivent cette commande
        io.to(`commande:${commandeId}`).emit("deliveryStatusUpdate", {
          livreurId: socket.userId,
          commandeId,
          status: status || "livré",
          timestamp: new Date(),
        });
      }
    });

    // Suivre une commande spécifique
    socket.on("joinCommande", (commandeId) => {
      if (commandeId && socket.userId) {
        socket.join(`commande:${commandeId}`);
        console.log(
          `Utilisateur ${socket.userId} suit maintenant la commande ${commandeId}`
        );
      }
    });

    // Arrêter de suivre une commande
    socket.on("leaveCommande", (commandeId) => {
      if (commandeId) {
        socket.leave(`commande:${commandeId}`);
        console.log(
          `Utilisateur ${socket.userId} ne suit plus la commande ${commandeId}`
        );
      }
    });

    // Gérer la déconnexion
    socket.on("disconnect", () => {
      console.log(`Socket déconnecté: ${socket.id}`);
      if (socket.userRole === "livreur" && socket.userId) {
        livreurPositions.delete(socket.userId);
      }
    });
  });

  return io;
};

export default configureSocketServer;
