/** FastAPI-style error body: { "detail": string | string[] } */
export type ApiErrorDetail = string | string[];

export interface ApiErrorBody {
  detail?: ApiErrorDetail;
}
