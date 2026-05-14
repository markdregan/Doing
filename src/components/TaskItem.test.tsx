import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskItem from './TaskItem'
import type { Task } from '../types'
import { useTaskStore } from '../store/useTaskStore'

vi.mock('../store/useTaskStore', () => ({
  useTaskStore: vi.fn(),
}))

const mockUpdateTask = vi.fn()
const mockSoftDeleteTask = vi.fn()
const mockDeleteTask = vi.fn()
const mockRestoreTask = vi.fn()
const mockToggleTask = vi.fn()
const mockMoveTaskToToday = vi.fn()
const mockRemoveTaskFromToday = vi.fn()
const mockMoveTaskToSomeday = vi.fn()
const mockRemoveTaskFromSomeday = vi.fn()
const mockMoveTaskToProject = vi.fn()
const mockUpdateRepeat = vi.fn()
const mockToggleTaskTag = vi.fn()

const mockAddChecklistItem = vi.fn()
const mockToggleChecklistItem = vi.fn()
const mockUpdateChecklistItem = vi.fn()
const mockDeleteChecklistItem = vi.fn()
const mockAddTag = vi.fn()

const mockStore = {
  updateTask: mockUpdateTask,
  softDeleteTask: mockSoftDeleteTask,
  deleteTask: mockDeleteTask,
  restoreTask: mockRestoreTask,
  toggleTask: mockToggleTask,
  moveTaskToToday: mockMoveTaskToToday,
  removeTaskFromToday: mockRemoveTaskFromToday,
  moveTaskToSomeday: mockMoveTaskToSomeday,
  removeTaskFromSomeday: mockRemoveTaskFromSomeday,
  moveTaskToProject: mockMoveTaskToProject,
  updateRepeat: mockUpdateRepeat,
  toggleTaskTag: mockToggleTaskTag,
  addTag: mockAddTag,
  activeView: 'inbox' as const,
  tags: [],
  projects: [],
  checklistItems: [],
  addChecklistItem: mockAddChecklistItem,
  toggleChecklistItem: mockToggleChecklistItem,
  updateChecklistItem: mockUpdateChecklistItem,
  deleteChecklistItem: mockDeleteChecklistItem,
}

afterEach(() => cleanup())

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useTaskStore).mockImplementation((selector: unknown) => {
    if (typeof selector === 'function') {
      return selector(mockStore)
    }
    return mockStore
  })
})

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Test task',
    notes: '',
    projectId: null,
    status: 'not_started',
    dueDate: null,
    isToday: false,
    isSomeday: false,
    completed: false,
    completedAt: null,
    deletedAt: null,
    createdAt: '2024-01-01',
    sortOrder: 0,
    tagIds: [],
    repeat: null,
    assignedTo: null,
    assignedBy: null,
    source: 'user',
    ...overrides,
  }
}

function getCheckboxButton() {
  const buttons = screen.getAllByRole('button')
  return buttons.find(b => !b.title && b.className.includes('w-5'))
}

function getFooterButton(title: string) {
  const buttons = screen.getAllByRole('button')
  return buttons.find(b => b.title === title)
}

describe('TaskItem', () => {
  it('renders the task title', () => {
    render(<TaskItem task={createTask()} />)
    expect(screen.getByText('Test task')).toBeInTheDocument()
  })

  it('shows completed state with line-through', () => {
    render(<TaskItem task={createTask({ completed: true })} />)
    const title = screen.getByText('Test task')
    expect(title.className).toContain('line-through')
  })

  it('shows due date label', () => {
    const today = new Date().toISOString().slice(0, 10)
    render(<TaskItem task={createTask({ dueDate: today })} />)
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('calls toggleTask when circle button clicked', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={createTask()} />)
    const circleButton = getCheckboxButton()
    expect(circleButton).toBeDefined()
    await user.click(circleButton!)
    expect(mockToggleTask).toHaveBeenCalledWith('t1')
  })

  it('expands on title click and shows notes, checklist, and overflow menu', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={createTask()} />)
    await user.click(screen.getByText('Test task'))
    expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByPlaceholderText('Notes')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('+ Add sub task')).toBeInTheDocument()
    expect(getFooterButton('More')).toBeInTheDocument()
  })

  it('saves edited title on Enter', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={createTask()} />)
    await user.click(screen.getByText('Test task'))
    const input = screen.getAllByRole('textbox')[0]
    await user.clear(input)
    await user.type(input, 'Updated{Enter}')
    expect(mockUpdateTask).toHaveBeenCalledWith('t1', { title: 'Updated' })
  })

  it('calls moveTaskToToday from overflow menu', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={createTask()} />)
    await user.click(screen.getByText('Test task'))
    await user.click(getFooterButton('More')!)
    await user.click(screen.getByText('Add to Today'))
    expect(mockMoveTaskToToday).toHaveBeenCalledWith('t1')
  })

  it('shows Remove from Today in overflow menu when task is today', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={createTask({ isToday: true })} />)
    await user.click(screen.getByText('Test task'))
    await user.click(getFooterButton('More')!)
    expect(screen.getByText('Remove from Today')).toBeInTheDocument()
  })

  it('calls moveTaskToSomeday from overflow menu', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={createTask()} />)
    await user.click(screen.getByText('Test task'))
    await user.click(getFooterButton('More')!)
    await user.click(screen.getByText('Add to Someday'))
    expect(mockMoveTaskToSomeday).toHaveBeenCalledWith('t1')
  })

  it('shows delete confirmation in overflow menu', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={createTask()} />)
    await user.click(screen.getByText('Test task'))
    await user.click(getFooterButton('More')!)
    await user.click(screen.getByText('Delete'))
    expect(screen.getByText('Tap again to confirm')).toBeInTheDocument()
  })

  it('calls softDeleteTask on confirm delete in overflow menu', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={createTask()} />)
    await user.click(screen.getByText('Test task'))
    await user.click(getFooterButton('More')!)
    await user.click(screen.getByText('Delete'))
    await user.click(screen.getByText('Tap again to confirm'))
    expect(mockSoftDeleteTask).toHaveBeenCalledWith('t1')
  })

  it('shows overdue date in red', () => {
    const pastDate = '2020-01-01'
    render(<TaskItem task={createTask({ dueDate: pastDate, completed: false })} />)
    const label = screen.getByText('Jan 1, 2020')
    expect(label.className).toContain('text-red-400')
  })

  it('shows completed label in logbook mode', () => {
    vi.mocked(useTaskStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return selector({ ...mockStore, activeView: 'logbook' as const })
      }
      return { ...mockStore, activeView: 'logbook' as const }
    })
    render(<TaskItem task={createTask({ completed: true, completedAt: new Date().toISOString() })} />)
    expect(screen.getByText('Completed today')).toBeInTheDocument()
  })

  it('does not open editing in logbook mode', async () => {
    const user = userEvent.setup()
    vi.mocked(useTaskStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return selector({ ...mockStore, activeView: 'logbook' as const })
      }
      return { ...mockStore, activeView: 'logbook' as const }
    })
    render(<TaskItem task={createTask({ completed: true, completedAt: new Date().toISOString() })} />)
    await user.click(screen.getByText('Test task'))
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('shows restore and permanent delete in trash view', async () => {
    vi.mocked(useTaskStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return selector({ ...mockStore, activeView: 'trash' as const })
      }
      return { ...mockStore, activeView: 'trash' as const }
    })
    render(<TaskItem task={createTask({ deletedAt: '2024-01-01T00:00:00.000Z' })} />)
    const buttons = screen.getAllByRole('button')
    const restoreBtn = buttons.find(b => b.title === 'Restore')
    expect(restoreBtn).toBeDefined()
    await userEvent.click(buttons.find(b => b.title === 'Delete permanently')!)
    expect(mockDeleteTask).toHaveBeenCalledWith('t1')
  })

  it('shows tag dots in collapsed state', () => {
    const mockTag = { id: 'tag1', title: 'Work', color: 'blue' as const, createdAt: '2024-01-01' }
    vi.mocked(useTaskStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return selector({ ...mockStore, tags: [mockTag] })
      }
      return { ...mockStore, tags: [mockTag] }
    })
    render(<TaskItem task={createTask({ tagIds: ['tag1'] })} />)
    expect(screen.getByTitle('Work')).toBeInTheDocument()
  })

  it('shows checklist indicator in collapsed state', () => {
    const mockChecklistItem = { id: 'c1', taskId: 't1', title: 'Subtask', completed: false, sortOrder: 0, createdAt: '2024-01-01' }
    vi.mocked(useTaskStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return selector({ ...mockStore, checklistItems: [mockChecklistItem] })
      }
      return { ...mockStore, checklistItems: [mockChecklistItem] }
    })
    render(<TaskItem task={createTask()} />)
    expect(screen.getByText('0/1')).toBeInTheDocument()
  })

  it('calls toggleTaskTag from overflow menu tag picker', async () => {
    const mockTag = { id: 'tag1', title: 'Work', color: 'blue' as const, createdAt: '2024-01-01' }
    vi.mocked(useTaskStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return selector({ ...mockStore, tags: [mockTag] })
      }
      return { ...mockStore, tags: [mockTag] }
    })
    const user = userEvent.setup()
    render(<TaskItem task={createTask()} />)
    await user.click(screen.getByText('Test task'))
    await user.click(getFooterButton('More')!)
    await user.click(screen.getByText('Tags'))
    await user.click(screen.getByText('Work'))
    expect(mockToggleTaskTag).toHaveBeenCalledWith('t1', 'tag1')
  })

  it('shows project in overflow menu when task has project', async () => {
    const mockProject = { id: 'p1', title: 'Work Project', color: 'blue' as const, sortOrder: 0, createdAt: '2024-01-01' }
    vi.mocked(useTaskStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return selector({ ...mockStore, projects: [mockProject] })
      }
      return { ...mockStore, projects: [mockProject] }
    })
    const user = userEvent.setup()
    render(<TaskItem task={createTask({ projectId: 'p1' })} />)
    await user.click(screen.getByText('Test task'))
    await user.click(getFooterButton('More')!)
    await user.click(screen.getByText('Move to'))
    expect(screen.getByText('Work Project')).toBeInTheDocument()
  })
})
