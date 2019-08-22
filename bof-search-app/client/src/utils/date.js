const toLocaleDate = date => {
  return new Date(date).toLocaleDateString();
};

const toLocaleTime = date => {
  return new Date(date).toLocaleTimeString();
};

const toLocale = date => {
  return new Date(date).toLocaleString();
};

export { toLocaleDate, toLocaleTime, toLocale };
