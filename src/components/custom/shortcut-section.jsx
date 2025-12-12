import { useState, useEffect } from 'react'
import { useCurrentUser, useStore } from '@/lib/store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ShortcutEditDialog } from './shortcut-edit-dialog'
import { MoreVertical, Edit, Trash2, Plus } from 'lucide-react'
import Canvas from '@/assets/img/canvas.png'
import ClassLink from '@/assets/img/classlink.png'
import Drive from '@/assets/img/drive.png'

const DEFAULT_SHORTCUTS_BASE = [
  { title: 'ClassLink', url: 'https://myapps.classlink.com/', image: ClassLink },
  { title: 'Drive', url: 'https://drive.google.com/', image: Drive },
]

const CANVAS_SHORTCUT = { title: 'Canvas', url: 'https://katyisd.instructure.com/', image: Canvas }

function ShortcutCard({ shortcut, onEdit, onDelete }) {
  return (
    <div className='relative group flex flex-col justify-center items-center rounded-lg overflow-hidden transition hover:bg-muted'>
      <a
        href={shortcut.url}
        target="_blank"
        rel="noopener noreferrer"
        className='shortcut-link flex flex-col justify-center items-center p-2 w-full h-full'
      >
        <div className='w-18 h-18 flex justify-center items-center'>
          <img src={shortcut.image} alt={shortcut.title} className="w-18" />
        </div>
        <p className='font-medium text-sm'>{shortcut.title}</p>
        <p className='truncate text-muted-foreground text-xs w-full text-center'>{shortcut.url.split('/')[2]}</p>
      </a>

      <div className='shortcut-menu absolute top-1 right-1 z-50'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 cursor-pointer">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              onEdit(shortcut)
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              onDelete(shortcut.id)
            }} className="delete text-destructive">
              <Trash2 className="h-4 w-4 mr-2" color="var(--destructive)"/> 
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function ShortcutSection() {
  const user = useCurrentUser()
  const { updateShortcut, removeShortcut, addShortcut } = useStore()
  const [editingShortcut, setEditingShortcut] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (user && user.shortcuts && user.shortcuts.length === 0) {
      const defaultShortcuts = user.district === 'Katy ISD' 
        ? [CANVAS_SHORTCUT, ...DEFAULT_SHORTCUTS_BASE]
        : DEFAULT_SHORTCUTS_BASE
      
      defaultShortcuts.forEach(shortcut => {
        addShortcut({
          title: shortcut.title,
          url: shortcut.url,
          image: shortcut.image
        })
      })
    }
  }, [user?.id])

  const shortcuts = user?.shortcuts || []

  const handleEditShortcut = (shortcut) => {
    setEditingShortcut(shortcut)
    setDialogOpen(true)
  }

  const handleDeleteShortcut = (id) => {
    removeShortcut(id)
  }

  const handleSaveShortcut = (data) => {
    if (editingShortcut?.id) {
      updateShortcut(editingShortcut.id, data)
    } else {
      addShortcut(data)
    }
    setEditingShortcut(null)
  }

  const handleAddNewShortcut = () => {
    setEditingShortcut(null)
    setDialogOpen(true)
  }

  return (
    <>
      <div className="bg-card rounded-lg shadow p-6 border">
        <div className="flex items-start gap-4">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2 flex-1">
            {shortcuts.map((shortcut) => (
              <ShortcutCard
                key={shortcut.id || shortcut.title}
                shortcut={shortcut}
                onEdit={handleEditShortcut}
                onDelete={handleDeleteShortcut}
              />
            ))}
          </div>
          
          <button
            onClick={handleAddNewShortcut}
            className='inline-flex flex-col items-center justify-center gap-1 px-2 py-4 text-xs text-muted-foreground border border-dashed border-muted-foreground/20 rounded-lg h-[120px] transition hover:bg-muted cursor-pointer'
            title="Add new shortcut"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <ShortcutEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        shortcut={editingShortcut}
        onSave={handleSaveShortcut}
      />
    </>
  )
}
