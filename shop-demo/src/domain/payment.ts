/** Contrat du prestataire de paiement : la boutique ne dépend que de cette interface. */
export interface PaymentGateway {
  charge(cardNumber: string, amountCents: number): PaymentResult;
}

export type PaymentResult = { accepted: true; reference: string } | { accepted: false; reason: string };

/**
 * Bouchon de prestataire de paiement (aucun appel réseau).
 * - 4000 0000 0000 0002 : refus « fonds insuffisants » ;
 * - toute autre carte valide (Luhn) : acceptée, référence PAY-000001, PAY-000002…
 */
export class SimulatedPaymentGateway implements PaymentGateway {
  static readonly DECLINED_CARD = '4000000000000002';
  private counter = 0;

  charge(cardNumber: string, amountCents: number): PaymentResult {
    if (cardNumber === SimulatedPaymentGateway.DECLINED_CARD) {
      return { accepted: false, reason: 'Paiement refusé : fonds insuffisants' };
    }
    if (amountCents <= 0) return { accepted: false, reason: 'Montant invalide' };
    this.counter += 1;
    return { accepted: true, reference: `PAY-${String(this.counter).padStart(6, '0')}` };
  }

  reset(): void {
    this.counter = 0;
  }
}
