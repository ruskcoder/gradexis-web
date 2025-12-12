import { useCurrentUser } from '@/lib/store'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import TodoList from '@/components/custom/todo-list'
import { ShortcutSection } from '@/components/custom/shortcut-section'

export default function Dashboard() {
  const user = useCurrentUser()
  const showTitle = user ? user.showPageTitles !== false : true
  const today = new Date()
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  const formattedDate = today.toLocaleDateString(undefined, options)

  return (
    <div className="space-y-8 h-full flex flex-col">
      {showTitle && <div>
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="mt-1">{formattedDate}</p>
      </div>}
      <ResizablePanelGroup direction="horizontal" className="space-x-2 flex-grow">
        <ResizablePanel className="space-y-2 flex flex-col">
          <ShortcutSection />
          <div className="bg-card rounded-lg shadow p-6 border flex-grow">
            <h2 className="text-2xl font-semibold mb-4">Feature Request</h2>
            <p className="text-muted-foreground">Feature requests are available to make at: </p>
            <a href="https://forms.gle/GmXtne4w9yGxVcDH8">https://forms.gle/GmXtne4w9yGxVcDH8</a>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel className="min-w-[400px]">
          <div className="bg-card rounded-lg shadow p-4 border space-y-3 h-full">
            <TodoList />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
