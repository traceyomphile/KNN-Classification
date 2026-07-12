export type DatasetName = 'iris' | 'digits' | 'wine' | 'breast_cancer'

export interface ClassDistributionEntry {
  class_index: number
  class_name: string
  samples: number
}

export interface DatasetSummary {
  name: DatasetName
  display_name: string
  samples: number
  features: number
  classes: string[]
  class_distribution: ClassDistributionEntry[]
}

export interface DatasetsResponse {
  datasets: DatasetSummary[]
}

export interface AnalysisConfig {
  dataset: DatasetName
  train_ratio: number
  max_k: number
}

export interface RunConfig {
  train_ratio: number
  max_k: number
}

export interface SplitInfo {
  train_ratio: number
  test_ratio: number
  training_samples: number
  test_samples: number
}

export interface OptimalModel {
  k: number
  mean_cv_accuracy: number
  test_accuracy: number
}

export interface KResultPoint {
  k: number
  cv_accuracy: number
  test_accuracy: number
}

export interface ClassificationReportRow {
  precision: number
  recall: number
  'f1-score': number
  support: number
}

export type ClassificationReport = Record<string, ClassificationReportRow | number>

export interface AnalysisResponse {
  dataset: DatasetSummary
  split: SplitInfo
  optimal_model: OptimalModel
  k_results: KResultPoint[]
  confusion_matrix: number[][]
  classification_report: ClassificationReport
}

export type Stage =
  | 'select'
  | 'loading'
  | 'configure'
  | 'split'
  | 'search'
  | 'fit'
  | 'results'