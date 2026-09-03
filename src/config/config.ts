export const config = {
  baseUrl: import.meta.env.VITE_BASE_URL || "",
  pageSize: Number(import.meta.env.VITE_PAGE_SIZE) || 10,
};
