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

const mockAddChecklistItem = vi.fn()
const mockToggleChecklistItem = vi.fn()
const mockUpdateChecklistItem = vi.fn()
const mockDeleteChecklistItem = vi.fn()

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
  activeView: 'inbox',
  tags: [],
  toggleTaskTag: vi.fn(),
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
    ...overrides,
  }
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
    const buttons = screen.getAllByRole('button')
    const circleButton = buttons[0]
    await user.click(circleButton)
    expect(mockToggleTask).toHaveBeenCalledWith('t1')
  })

  it('opens inline edit on title click', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={createTask()} />)
    await user.click(screen.getByText('Test task'))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('saves edited title on Enter', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={createTask()} />)
    await user.click(screen.getByText('Test task'))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'Updated{Enter}')
    expect(mockUpdateTask).toHaveBeenCalledWith('t1', { title: 'Updated' })
  })

  it('calls softDeleteTask when delete button clicked', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={createTask()} />)
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons[buttons.length - 1]
    await user.click(deleteButton)
    expect(mockSoftDeleteTask).toHaveBeenCalledWith('t1')
  })

  it('shows restore and permanent delete in trash view', async () => {
    const user = userEvent.setup()
    vi.mocked(useTaskStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return selector({ ...mockStore, activeView: 'trash' })
      }
      return { ...mockStore, activeView: 'trash' }
    })
    render(<TaskItem task={createTask({ deletedAt: '2024-01-01T00:00:00.000Z' })} />)

    await user.click(screen.getAllByRole('button').at(-1)!)
    expect(mockDeleteTask).toHaveBeenCalledWith('t1')
  })

  it('shows overdue date in red', () => {
    const pastDate = '2020-01-01'
    render(<TaskItem task={createTask({ dueDate: pastDate, completed: false })} />)
    const label = screen.getByText('Jan 1, 2020')
    expect(label.className).toContain('text-red-500')
  })

  it('shows completed label in logbook mode', () => {
    vi.mocked(useTaskStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return selector({ ...mockStore, activeView: 'logbook' })
      }
      return { ...mockStore, activeView: 'logbook' }
    })
    render(<TaskItem task={createTask({ completed: true, completedAt: new Date().toISOString() })} />)
    expect(screen.getByText('Completed today')).toBeInTheDocument()
  })

  it('does not open editing in logbook mode', async () => {
    const user = userEvent.setup()
    vi.mocked(useTaskStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return selector({ ...mockStore, activeView: 'logbook' })
      }
      return { ...mockStore, activeView: 'logbook' }
    })
    render(<TaskItem task={createTask({ completed: true, completedAt: new Date().toISOString() })} />)
    await user.click(screen.getByText('Test task'))
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

})
