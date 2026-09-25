export const formatDate = (date) => {
  return new Date(date).toLocaleString("en-US", {
    hour12: true,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    
  });
};
