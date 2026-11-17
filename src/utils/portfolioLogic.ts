import type { ProjectCategory, ProjectItem } from '../data/portfolioData';

export interface ContactFormValues {
  nombre: string;
  email: string;
  mensaje: string;
}

export interface ContactFormErrors {
  nombre?: string;
  email?: string;
  mensaje?: string;
}

export function filterProjects(
  projects: ProjectItem[],
  category: ProjectCategory,
): ProjectItem[] {
  if (category === 'Todos') {
    return projects;
  }
  return projects.filter((project) => project.category === category);
}

export function validateContactForm(values: ContactFormValues): {
  isValid: boolean;
  errors: ContactFormErrors;
} {
  const errors: ContactFormErrors = {};
  const nombre = values.nombre.trim();
  const email = values.email.trim();
  const mensaje = values.mensaje.trim();

  if (nombre.length < 2) {
    errors.nombre = 'Por favor, escribe tu nombre (mínimo 2 caracteres).';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }

  if (mensaje.length < 10) {
    errors.mensaje = 'Cuéntame brevemente tu idea (mínimo 10 caracteres).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function computeCardTilt(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  maxDeg = 7,
): { rotateX: number; rotateY: number } {
  if (rect.width <= 0 || rect.height <= 0) {
    return { rotateX: 0, rotateY: 0 };
  }
  const px = (clientX - rect.left) / rect.width;
  const py = (clientY - rect.top) / rect.height;
  const clampedX = Math.max(0, Math.min(1, px));
  const clampedY = Math.max(0, Math.min(1, py));

  const rotateY = (clampedX - 0.5) * (maxDeg * 2);
  const rotateX = (0.5 - clampedY) * (maxDeg * 2);

  return {
    rotateX: Number(rotateX.toFixed(2)),
    rotateY: Number(rotateY.toFixed(2)),
  };
}
