// Foto de perfil LOCAL (sin backend): vive en el localStorage de este
// dispositivo, una por usuario. No viaja a otros dispositivos.

const PREFIJO = "foto-perfil:";
// Lado del cuadrado que se guarda: alcanza para el avatar y pesa ~20-40 KB.
// localStorage admite unos 5 MB por sitio, y una foto del celular pasa eso.
const LADO = 256;
const CALIDAD = 0.85;

const clave = (usuario: string) => PREFIJO + usuario.toLowerCase();

export function leerFoto(usuario: string): string | null {
  if (typeof window === "undefined" || !usuario) return null;
  try {
    return localStorage.getItem(clave(usuario));
  } catch {
    return null;
  }
}

// Lanza si el navegador no deja guardarla (sin espacio o almacenamiento bloqueado).
export function guardarFoto(usuario: string, dataUrl: string): void {
  try {
    localStorage.setItem(clave(usuario), dataUrl);
  } catch {
    throw new Error("No se pudo guardar la foto en este dispositivo.");
  }
}

export function borrarFoto(usuario: string): void {
  try {
    localStorage.removeItem(clave(usuario));
  } catch {
    // sin almacenamiento: no hay nada que borrar
  }
}

// Recorta al centro en cuadrado y reduce a LADO x LADO, en JPEG.
export async function reducirFoto(archivo: File): Promise<string> {
  if (!archivo.type.startsWith("image/")) {
    throw new Error("El archivo no es una imagen.");
  }
  const url = URL.createObjectURL(archivo);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("No se pudo leer la imagen."));
      i.src = url;
    });
    const lado = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = LADO;
    canvas.height = LADO;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo procesar la imagen.");
    ctx.drawImage(
      img,
      (img.naturalWidth - lado) / 2,
      (img.naturalHeight - lado) / 2,
      lado,
      lado,
      0,
      0,
      LADO,
      LADO,
    );
    return canvas.toDataURL("image/jpeg", CALIDAD);
  } finally {
    URL.revokeObjectURL(url);
  }
}
