import type { AnalysisConfig, AnalysisResponse, DatasetsResponse } from './types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch {
      // ignore json parse errors, fall back to statusText
    }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}

export async function fetchDatasets(): Promise<DatasetsResponse> {
  const res = await fetch(`${BASE_URL}/api/datasets`)
  return handle<DatasetsResponse>(res)
}

export async function runAnalysis(config: AnalysisConfig): Promise<AnalysisResponse> {
  const res = await fetch(`${BASE_URL}/api/analyse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  return handle<AnalysisResponse>(res)
}

export { BASE_URL }