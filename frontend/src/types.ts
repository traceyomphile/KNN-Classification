export type DatasetName = 'iris' | 'digits' | 'wine' | 'breast_cancer'

export type Stage =
  | 'select'
  | 'loading'
  | 'configure'
  | 'split'
  | 'search'
  | 'fit'
  | 'results'

export interface RunConfig {
  train_ratio: number
  max_k: number
}

export interface ClassDistributionItem {
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
  class_distribution: ClassDistributionItem[]
}

export interface DatasetsResponse {
  datasets: DatasetSummary[]
}

export interface SplitInfo {
  train_ratio: number
  test_ratio: number
  training_samples: number
  test_samples: number
}

export interface KResultPoint {
  k: number
  cv_accuracy: number
  test_accuracy: number
}

export interface OptimalModel {
  k: number
  mean_cv_accuracy: number
  test_accuracy: number
}

export interface ClassificationReportRow {
  precision: number
  recall: number
  'f1-score': number
  support: number
}

export type ClassificationReport = Record<
  string,
  ClassificationReportRow | number
>

export interface ProjectionInfo {
  method: 'PCA'
  components: 2
  explained_variance_ratio: number[]
  explained_variance_total: number
  coordinate_range: [number, number]
  note: string
}

export interface VisualisationTrainingPoint {
  id: number
  x: number
  y: number
  class_index: number
  class_name: string
}

export interface VisualisationNeighbour {
  rank: number
  training_id: number
  class_index: number
  class_name: string
  distance: number
}

export interface VisualisationTestCase {
  id: number
  x: number
  y: number
  true_class_index: number
  true_class_name: string
  predicted_class_index: number
  predicted_class_name: string
  correct: boolean
  vote_counts: number[]
  neighbours: VisualisationNeighbour[]
}

export interface KNNVisualisation {
  projection: ProjectionInfo
  training_points: VisualisationTrainingPoint[]
  test_cases: VisualisationTestCase[]
  neighbour_count: number
  training_points_sampled: boolean
  test_case_selection: string
}

export interface AnalysisResponse {
  dataset: DatasetSummary
  split: SplitInfo
  optimal_model: OptimalModel
  k_results: KResultPoint[]
  confusion_matrix: number[][]
  classification_report: ClassificationReport
  visualisation: KNNVisualisation
}