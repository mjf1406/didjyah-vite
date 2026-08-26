import DidjyahCard from "@/components/didjyah/DidjyahCard"
import DidjyahCardSkeleton from "@/components/didjyah/DidjyahCardSkeleton"
import DidjyahCardLoadError from "@/components/didjyah/DidjyahCardLoadError"
import type { DidjyahCardLoadState } from "@/components/didjyah/homeRecordState"

interface DidjyahCardWithRecordsProps {
  loadState: DidjyahCardLoadState | undefined
  fallbackName: string
  viewMode?: "list" | "grid"
  onRecorded?: () => void
}

const DidjyahCardWithRecords: React.FC<DidjyahCardWithRecordsProps> = ({
  loadState,
  fallbackName,
  viewMode = "list",
  onRecorded,
}) => {
  if (!loadState || loadState.status === "loading") {
    return <DidjyahCardSkeleton viewMode={viewMode} />
  }

  if (loadState.status === "error") {
    return (
      <DidjyahCardLoadError
        name={fallbackName}
        error={loadState.error}
        viewMode={viewMode}
      />
    )
  }

  return (
    <DidjyahCard
      detail={loadState.didjyah}
      viewMode={viewMode}
      onRecorded={onRecorded}
    />
  )
}

export default DidjyahCardWithRecords
