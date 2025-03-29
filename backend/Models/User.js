import mongoose from "mongoose";

const BaseUserSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true,
      minLength: 6
    },
    numero: {
      type: String,
      required: true,
      unique: true
    },
    role: {
      type: String,
      enum: ["livreur", "client", "commercant", "admin"],
      required: true
    },
    profilePic: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true,
    discriminatorKey: "role"
  }
);

const User = mongoose.model("User", BaseUserSchema);

const AdminSchema = new mongoose.Schema({});

const Admin = User.discriminator("admin", AdminSchema);

const LivreurSchema = new mongoose.Schema({
  vehicule: {
    type: {
      type: String,
      enum: ["voiture", "moto", "vélo"]
    },
    plaque: {
      type: String
    },
    couleur: {
      type: String
    },
    capacite: {
      type: Number
    }
  },
  position: {
    lat: {
      type: Number,
      default: null
    },
    lng: {
      type: Number,
      default: null
    }
  },
  disponibilite: {
    type: Boolean,
    default: false
  },
  distance_max: {
    type: Number,
    default: 10
  },
  note_moyenne: {
    type: Number,
    default: 0
  },
  nombre_livraisons: {
    type: Number,
    default: 0
  }
});

const Livreur = User.discriminator("livreur", LivreurSchema);

const CommercantSchema = new mongoose.Schema({
  favoris_livreurs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  nom_boutique: {
    type: String
  },
  adresse_boutique: {
    rue: {
      type: String
    },
    ville: {
      type: String
    },
    code_postal: {
      type: String
    },
    lat: {
      type: Number
    },
    lng: {
      type: Number
    }
  }
  // horaires: {
  //     lundi: {
  //         ouverture: String,
  //         fermeture: String,
  //     },
  //     mardi: {
  //         ouverture: String,
  //         fermeture: String,
  //     },
  //     mercredi: {
  //         ouverture: String,
  //         fermeture: String,
  //     },
  //     jeudi: {
  //         ouverture: String,
  //         fermeture: String,
  //     },
  //     vendredi: {
  //         ouverture: String,
  //         fermeture: String,
  //     },
  //     samedi: {
  //         ouverture: String,
  //         fermeture: String,
  //     },
  //     dimanche: {
  //         ouverture: String,
  //         fermeture: String,
  //     },
  // },
  // type_commerce: {
  //     type: String,
  //     enum: ["restaurant", "épicerie", "autre"],
  //     required: true,
  // },
  // delai_preparation: {
  //     type: Number,
  //     default: 30,
  // },
});

const Commercant = User.discriminator("commercant", CommercantSchema);

const ClientSchema = new mongoose.Schema({
  adresses_favorites: [
    {
      nom: {
        type: String,
        required: true
      },
      rue: {
        type: String,
        required: true
      },
      ville: {
        type: String,
        required: true
      },
      code_postal: {
        type: String,
        required: true
      },
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    }
  ]
  // moyens_paiement: [
  //     {
  //         type: {
  //             type: String,
  //             enum: ["carte", "paypal", "especes"],
  //             required: true,
  //         },
  //         details: {
  //             type: String,
  //             required: true,
  //         },
  //     },
  // ],
  // preferences: {
  //     notifications: {
  //         type: Boolean,
  //         default: true,
  //     },
  //     langue: {
  //         type: String,
  //         default: "fr",
  //     },
  // },
  // points_fidelite: {
  //     type: Number,
  //     default: 0,
  // },
});

const Client = User.discriminator("client", ClientSchema);

export default {
  User,
  Livreur,
  Commercant,
  Client,
  Admin
};
