export const getDocumentUrl = (url) => {
  if (!url) return "#"
  return `/${url.replace(/\\/g, "/")}`
}
