"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface Task {
  id: string
  title: string
  description: string | null
  completed: boolean
}

interface ChecklistProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, completed: boolean) => void
}

export function Checklist({ tasks, onTaskUpdate }: ChecklistProps) {
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-start gap-2">
          <Checkbox
            id={task.id}
            checked={task.completed}
            onCheckedChange={(checked) =>
              onTaskUpdate(task.id, checked === true)
            }
          />
          <div className="flex-1">
            <Label
              htmlFor={task.id}
              className={`text-sm ${
                task.completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              {task.title}
            </Label>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {task.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
