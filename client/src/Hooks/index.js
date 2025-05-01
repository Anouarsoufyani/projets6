// Exporter tous les hooks pour faciliter les imports

// Queries
export { useAvailableLivreurs } from "./queries/useAvailableLivreurs";
export {
    useGetCommandeById,
    useGetUserCommandes,
    useGetLatestPendingCommande,
} from "./queries/useGetCommandes";
export { useGetUserById, useGetUsersByRole } from "./queries/useGetUsers";
export { useAuthUserQuery } from "./queries/useAuthQueries";
export { useGetCoords } from "./queries/useGetCoords";
export { useGetDocuments } from "./queries/useGetDocuments";
export { default as useLivreurTracking } from "./queries/useLivreurTracking";
export { default as useUserPosition } from "./queries/useUserPosition";
export { useGetCommande } from "./queries/useGetCommande";
export {
    useGetNotifications,
    useFilteredNotifications,
} from "./queries/useGetNotifications";
export {
    useGetReviewsForUser,
    useGetUserReviews,
} from "./queries/useGetReviews";

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
export { useSubmitReview } from "./mutations/useSubmitReview";

// Admin mutations
export {
    useUpdateUserStatus,
    useDeleteUser,
    useAdminUpdateUserProfile,
} from "./mutations/useAdminUserManagement";

// Autres hooks (qui ne sont pas des queries ou mutations)
export { default as useGoogleMapDirections } from "./useGoogleMapDirections";

// Utils
export { getDocumentUrl } from "./utils/getDocumentsUrl";
export { default as GoogleMapLoader } from "./utils/GoogleMapLoader";

export * from "./mutations/useVehiculeManagement";
export * from "./mutations/useUpdateDocument";
export * from "./mutations/useUploadDocument";
export * from "./mutations/useLogin";
export * from "./mutations/useSignup";
export * from "./mutations/useUpdateProfile";
export * from "./mutations/useToggleActive";
export * from "./mutations/useDeliveryPosition";
export * from "./mutations/useCreateCommande";
export * from "./mutations/useUpdateCommandeStatus";
export * from "./mutations/useCancelCommande";
export * from "./mutations/useAssignLivreur";
export * from "./mutations/useRequestLivreur";
export * from "./mutations/useSubmitReview";
export * from "./mutations/useValidateCode";
export * from "./mutations/useNotifications";

export * from "./queries/useAuthQueries";
export * from "./queries/useGetCommandes";
export * from "./queries/useGetCommande";
export * from "./queries/useGetUsers";
export * from "./queries/useAvailableLivreurs";
export * from "./queries/useGetCoords";
export * from "./queries/useLivreurTracking";
export * from "./queries/useUserPosition";
export * from "./queries/useGetNotifications";
export * from "./queries/useGetReviews";
export * from "./queries/useGetDocuments";
