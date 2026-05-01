import React from "react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/constants"
import { CreateDidjyahDialog } from "@/components/didjyah/CreateDidjyahDialog"
import { toast } from "sonner"

const NoDidjyahsCard: React.FC = () => {
  return (
    <Card className="max-w-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-2xl font-bold">
          No {APP_NAME}s Found!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p>
          It looks like you haven&apos;t created any {APP_NAME}s yet. Get
          started by creating a new one or choose one of our presets!
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <CreateDidjyahDialog />
        <Button
          variant="outline"
          type="button"
          onClick={() => toast.info("Presets coming soon")}
        >
          Add Presets
        </Button>
      </CardFooter>
    </Card>
  )
}

export default NoDidjyahsCard
