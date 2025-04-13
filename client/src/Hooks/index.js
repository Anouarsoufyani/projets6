// Exporter tous les hooks pour faciliter les imports

// Queries
export { useAvailableLivreurs } from "./queries/useAvailableLivreurs";
export {
    useGetCommandeById,
    useGetUserCommandes,
} from "./queries/useGetCommandes";
export { useGetUserById, useGetUsersByRole } from "./queries/useGetUsers";
export { useAuthUserQuery } from "./queries/useAuthQueries";
export { useGetCoords } from "./queries/useGetCoords";
export { useGetDocuments } from "./queries/useGetDocuments";
export { default as useLivreurTracking } from "./queries/useLivreurTracking";
export { default as useUserPosition } from "./queries/useUserPosition";
export { useGetCommande } from "./queries/useGetCommande";
export { useGetNotifications } from "./queries/useGetNotifications";

// Mutations
export { default as useUpdateProfile } from "./mutations/useUpdateProfile";
export { useAssignLivreur } from "./mutations/useAssignLivreur";
export { useRequestLivreur } from "./mutations/useRequestLivreur";
export { default as useDeliveryPosition } from "./mutations/useDeliveryPosition";
export { default as useToggleActive } from "./mutations/useToggleActive";
export { useUpdateDocument } from "./mutations/useUpdateDocument";
export { useLogin } from "./mutations/useLogin";
export { useSignup } from "./mutations/useSignup";
export { useUpdateCommandeStatus } from "./mutations/useUpdateCommandeStatus";
export { useCancelCommande } from "./mutations/useCancelCommande";
export { useCreateCommande } from "./mutations/useCreateCommande";
export {
    useValidateCommercantCode,
    useValidateClientCode,
} from "./mutations/useValidateCode";
export {
    useUploadDocument,
    useUpdateUploadedDocument,
    useDeleteDocument,
} from "./mutations/useUploadDocument";
export {
    useMarkNotificationAsRead,
    useDeleteNotification,
} from "./mutations/useNotifications";

// Autres hooks (qui ne sont pas des queries ou mutations)
export { default as useGoogleMapDirections } from "./useGoogleMapDirections";

// Utils
export { getDocumentUrl } from "./utils/getDocumentsUrl";
export { default as GoogleMapLoader } from "./utils/GoogleMapLoader";
