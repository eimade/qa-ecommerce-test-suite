/** Erreur métier portée jusqu'à la couche HTTP avec un code stable (vérifié par les tests). */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (what: string) => new AppError(404, 'NOT_FOUND', `${what} introuvable`);
export const invalid = (message: string, details?: unknown) =>
  new AppError(400, 'VALIDATION_ERROR', message, details);
