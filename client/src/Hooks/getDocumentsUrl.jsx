export const getDocumentUrl = (url) => {
    if (!url) return "#";
    // Remplacer les backslashes par des slashes pour l'URL
    return `/${url.replace(/\\/g, "/")}`;
};
