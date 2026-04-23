// Quita todo lo que no sea número
export const onlyDigits = (v) => String(v || "").replace(/\D/g, "");

/* ================= CUIT ================= */
export const isValidCUIT = (cuit) => {
  if (!cuit) return false;

  const clean = onlyDigits(cuit);

  if (clean.length !== 11) return false;

  const mult = [5,4,3,2,7,6,5,4,3,2];
  let acc = 0;

  for (let i = 0; i < 10; i++) {
    acc += parseInt(clean[i]) * mult[i];
  }

  let mod = 11 - (acc % 11);
  if (mod === 11) mod = 0;
  if (mod === 10) mod = 9;

  return mod === parseInt(clean[10]);
};

/* ================= DNI ================= */
export const isValidDNI = (dni) => {
  const clean = onlyDigits(dni);
  return clean.length >= 7 && clean.length <= 8;
};

/* ================= EMAIL ================= */
export const isValidEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/* ================= TELÉFONO ARG ================= */
export const normalizeArPhone = (phone) => {
  let clean = onlyDigits(phone);

  if (clean.startsWith("54")) clean = clean.slice(2);
  if (clean.startsWith("0")) clean = clean.slice(1);
  if (clean.startsWith("15")) clean = clean.slice(2);

  return clean;
};

export const isValidArPhone = (phone) => {
  const clean = normalizeArPhone(phone);
  return /^\d{10}$/.test(clean);
};
