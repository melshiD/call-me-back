export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  brand: string;
}
