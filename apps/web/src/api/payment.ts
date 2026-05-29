import type { Plan, Payment, CreatePaymentInput, CreatePaymentResponse } from '@billiard/shared'
import { api } from './client'

export const paymentApi = {
  listPlans: () => api.get<{ plans: Plan[] }>('/plans'),
  createPayment: (input: CreatePaymentInput) => api.post<CreatePaymentResponse>('/payments', input),
  getPayment: (id: string) => api.get<{ payment: Payment }>(`/payments/${id}`),
  history: () => api.get<{ payments: Payment[] }>('/payments/me/history'),
  /** dev-only: завершить платёж в stub-режиме */
  stubComplete: (id: string) => api.post<{ payment: Payment }>(`/payments/${id}/stub-complete`),
}
