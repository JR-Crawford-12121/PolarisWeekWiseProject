"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Upload } from "lucide-react"

export function SyllabusUpload() {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const file = formData.get("file") as File

    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      const res = await fetch("/api/syllabus/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: "Syllabus uploaded and processing started",
        })
        setOpen(false)
      } else {
        const error = await res.json()
        throw new Error(error.error || "Upload failed")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload syllabus",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload Syllabus
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Syllabus</DialogTitle>
          <DialogDescription>
            Upload a PDF syllabus to extract courses, events, and tasks
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Label htmlFor="file">PDF File</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept="application/pdf"
              required
              disabled={uploading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
