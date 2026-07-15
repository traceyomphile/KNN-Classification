import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Database, FileSpreadsheet, Upload } from 'lucide-react'

interface DataSourcePanelProps {
  onStandardDatasets: () => void
  onUploadDataset: (file: File) => void
}

const ALLOWED_EXTENSIONS = new Set(['csv', 'tsv'])
const MAX_FILE_SIZE = 10 * 1024 * 1024

export default function DataSourcePanel({
  onStandardDatasets,
  onUploadDataset,
}: DataSourcePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  function handleFile(file?: File) {
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      setFileError('Only CSV and TSV files are allowed.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('The uploaded file must be 10 MB or smaller.')
      return
    }

    setFileError(null)
    onUploadDataset(file)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="text-center mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-fog mb-2">01 · Data source</p>
        <h2 className="font-display text-3xl text-paper">Choose your dataset source</h2>
        <p className="text-sm text-mist mt-2">Use a built-in dataset or analyse your own labelled data.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.button
          type="button"
          onClick={onStandardDatasets}
          whileHover={{ y: -7, scale: 1.02, boxShadow: '0 18px 38px rgba(0, 0, 0, 0.38)' }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 360, damping: 22 }}
          className="min-h-56 rounded-xl border border-line bg-panel px-6 py-6 text-left hover:border-cyan"
        >
          <Database size={30} className="text-cyan mb-5" />
          <h3 className="font-display text-xl text-paper">Standard datasets</h3>
          <p className="text-sm text-mist mt-2 leading-relaxed">
            Choose Iris, Digits, Wine, or Breast Cancer from scikit-learn.
          </p>
          <span className="inline-flex items-center gap-2 mt-6 font-mono text-xs text-cyan uppercase tracking-wider">
            Browse datasets
          </span>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          whileHover={{ y: -7, scale: 1.02, boxShadow: '0 18px 38px rgba(0, 0, 0, 0.38)' }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 360, damping: 22 }}
          className="min-h-56 rounded-xl border border-line bg-panel px-6 py-6 text-left hover:border-cyan"
        >
          <Upload size={30} className="text-cyan mb-5" />
          <h3 className="font-display text-xl text-paper">Upload your dataset</h3>
          <p className="text-sm text-mist mt-2 leading-relaxed">
            Upload a CSV or TSV file. The first row must contain column names.
          </p>
          <span className="inline-flex items-center gap-2 mt-6 font-mono text-xs text-cyan uppercase tracking-wider">
            <FileSpreadsheet size={14} /> Select file
          </span>
        </motion.button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv,text/csv,text/tab-separated-values"
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />

      <p className="text-center text-xs text-fog mt-5">
        Uploaded files use the last column as the target/class label and all preceding columns as numeric features.
      </p>
      {fileError && <p className="text-center text-sm text-coral mt-3">{fileError}</p>}
    </motion.div>
  )
}