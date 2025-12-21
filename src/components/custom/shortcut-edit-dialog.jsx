import { useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Canvas from '@/assets/img/canvas.png'

export function ShortcutEditDialog({ open, onOpenChange, shortcut, onSave }) {
  const [title, setTitle] = useState(shortcut?.title || '')
  const [url, setUrl] = useState(shortcut?.url || '')
  const [image, setImage] = useState(shortcut?.image || '')
  const [imagePreview, setImagePreview] = useState(shortcut?.image || '')
  const [isLoadingFavicon, setIsLoadingFavicon] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setTitle(shortcut?.title || '')
      setUrl(shortcut?.url || '')
      setImage(shortcut?.image || '')
      setImagePreview(shortcut?.image || '')
      setError('')
    }
  }, [open, shortcut])

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result
        setImage(base64)
        setImagePreview(base64)
        setError('')
      }
      reader.readAsDataURL(file)
    }
  }

  const normalizeUrl = (urlStr) => {
    if (!urlStr.includes('://')) {
      return `https://${urlStr}`
    }
    return urlStr
  }

  const handleDetectFavicon = async () => {
    if (!url.trim()) {
      setError('Please enter a URL first')
      return
    }

    setError('')
    setIsLoadingFavicon(true)
    try {
      const normalizedUrl = normalizeUrl(url)
      const urlObj = new URL(normalizedUrl)
      
      if (urlObj.hostname.includes('instructure')) {
        setImage(Canvas)
        setImagePreview(Canvas)
      } else {
        const faviconUrl = `${urlObj.origin}/favicon.ico`
        setImage(faviconUrl)
        setImagePreview(faviconUrl)
      }
    } catch (_err) {
      setError('Invalid URL. Please enter a valid website URL.')
    } finally {
      setIsLoadingFavicon(false)
    }
  }

  const handleSave = () => {
    if (!title.trim() || !url.trim()) {
      setError('Please fill in all fields')
      return
    }
    if (!image && !imagePreview) {
      setError('Please upload or detect an image')
      return
    }
    
    const normalizedUrl = normalizeUrl(url)
    
    onSave({
      title,
      url: normalizedUrl,
      image: image || imagePreview,
    })
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{shortcut?.id ? 'Edit' : 'Add'} Shortcut</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-1 flex flex-col items-center justify-center">
            <Label htmlFor="image-upload" className="mb-4 text-center">
              Upload Image
            </Label>
            <div className="w-48 h-48 border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center mb-4 bg-muted/30">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain p-2" />
              ) : (
                <span className="text-muted-foreground text-sm text-center px-2">Click to upload or detect automatically</span>
              )}
            </div>
            <div className="w-full flex flex-col gap-2 mb-2">
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('image-upload').click()}
                className="flex-1"
              >
                Choose Image
              </Button>
              <Button
                variant="outline"
                onClick={handleDetectFavicon}
                disabled={isLoadingFavicon}
                className="flex-1"
              >
                {isLoadingFavicon ? 'Detecting...' : 'Detect'}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <Label htmlFor="title" className="mb-2 block">
                Name
              </Label>
              <Input
                id="title"
                placeholder="Example"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="url" className="mb-2 block">
                Link
              </Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                type="url"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Shortcut</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
