import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatBar from './ChatBar'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'

// Mock the speech recognition hook at module level
vi.mock('../hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: vi.fn(),
}))

// Default mock — no speech support
const defaultSpeechMock = {
  isRecording: false,
  supported: false,
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
}

vi.mocked(useSpeechRecognition).mockReturnValue(defaultSpeechMock)

const mockOnSend = vi.fn()

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  // Reset to default mock after each test
  vi.mocked(useSpeechRecognition).mockReturnValue(defaultSpeechMock)
})

describe('ChatBar', () => {
  describe('hero variant', () => {
    it('renders the textarea and send button', () => {
      render(<ChatBar onSend={mockOnSend} variant="hero" />)
      expect(screen.getByPlaceholderText('What are you working toward?')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })

    it('calls onSend with text on Enter', async () => {
      const user = userEvent.setup()
      render(<ChatBar onSend={mockOnSend} variant="hero" />)
      const input = screen.getByPlaceholderText('What are you working toward?')
      await user.type(input, 'build a new feature{Enter}')
      expect(mockOnSend).toHaveBeenCalledWith('build a new feature', undefined)
    })

    it('does not call onSend when text is empty on Enter', async () => {
      const user = userEvent.setup()
      render(<ChatBar onSend={mockOnSend} variant="hero" />)
      const input = screen.getByPlaceholderText('What are you working toward?')
      await user.type(input, '{Enter}')
      expect(mockOnSend).not.toHaveBeenCalled()
    })

    it('clears text after send', async () => {
      const user = userEvent.setup()
      render(<ChatBar onSend={mockOnSend} variant="hero" />)
      const input = screen.getByPlaceholderText('What are you working toward?') as HTMLTextAreaElement
      await user.type(input, 'hello{Enter}')
      expect(input.value).toBe('')
    })

    it('renders suggestion chips when provided', () => {
      const suggestions = [
        { label: 'Plan a trip', prompt: 'Help me plan a trip' },
      ]
      render(<ChatBar onSend={mockOnSend} variant="hero" suggestions={suggestions} />)
      expect(screen.getByText('Plan a trip')).toBeInTheDocument()
    })

    it('calls onSend with suggestion prompt on chip click', async () => {
      const user = userEvent.setup()
      const suggestions = [
        { label: 'Plan a trip', prompt: 'Help me plan a trip' },
      ]
      render(<ChatBar onSend={mockOnSend} variant="hero" suggestions={suggestions} />)
      await user.click(screen.getByText('Plan a trip'))
      expect(mockOnSend).toHaveBeenCalledWith('Help me plan a trip')
    })

    it('renders the attachment button', () => {
      render(<ChatBar onSend={mockOnSend} variant="hero" />)
      expect(screen.getByRole('button', { name: /attach/i })).toBeInTheDocument()
    })

    it('renders attachments chips when files are attached', async () => {
      const user = userEvent.setup()
      render(<ChatBar onSend={mockOnSend} variant="hero" />)

      const file = new File(['dummy content'], 'test.png', { type: 'image/png' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toBeInTheDocument()

      await user.upload(fileInput, file)

      const chip = await screen.findByText('test.png')
      expect(chip).toBeInTheDocument()
    })
  })

  describe('compact variant', () => {
    it('renders the textarea with placeholder', () => {
      render(<ChatBar onSend={mockOnSend} variant="compact" placeholder="Ask something..." />)
      expect(screen.getByPlaceholderText('Ask something...')).toBeInTheDocument()
    })

    it('calls onSend with text on Enter', async () => {
      const user = userEvent.setup()
      render(<ChatBar onSend={mockOnSend} variant="compact" />)
      const input = screen.getByPlaceholderText('What are you working toward?')
      await user.type(input, 'hello{Enter}')
      expect(mockOnSend).toHaveBeenCalledWith('hello', undefined)
    })
  })

  describe('attachment functionality', () => {
    it('accepts image files and shows attachment chip', async () => {
      const user = userEvent.setup()
      render(<ChatBar onSend={mockOnSend} />)

      const file = new File(['fake-image-content'], 'photo.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, file)

      const fileName = await screen.findByText('photo.jpg')
      expect(fileName).toBeInTheDocument()
    })

    it('accepts PDF files and shows attachment chip', async () => {
      const user = userEvent.setup()
      render(<ChatBar onSend={mockOnSend} />)

      const file = new File(['fake-pdf-content'], 'document.pdf', { type: 'application/pdf' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, file)

      const fileName = await screen.findByText('document.pdf')
      expect(fileName).toBeInTheDocument()
    })

    it('calls onSend with attachments when sending', async () => {
      const user = userEvent.setup()
      render(<ChatBar onSend={mockOnSend} />)

      const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, file)

      await screen.findByText('doc.pdf')

      // Type some text and send
      const input = screen.getByPlaceholderText('What are you working toward?')
      await user.type(input, 'check this{Enter}')

      expect(mockOnSend).toHaveBeenCalledTimes(1)
      const [text, attachments] = mockOnSend.mock.calls[0]
      expect(text).toBe('check this')
      expect(attachments).toBeDefined()
      expect(attachments).toHaveLength(1)
      expect(attachments[0].name).toBe('doc.pdf')
      expect(attachments[0].mimeType).toBe('application/pdf')
      expect(attachments[0].dataUrl).toContain('data:application/pdf;base64,')
    })

    it('removes attachment chip on X click', async () => {
      const user = userEvent.setup()
      render(<ChatBar onSend={mockOnSend} />)

      const file = new File(['content'], 'remove-me.pdf', { type: 'application/pdf' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, file)

      await screen.findByText('remove-me.pdf')

      // Click the remove button via its accessible label
      const removeBtn = screen.getByRole('button', { name: /remove.*remove-me\.pdf/i })
      await user.click(removeBtn)
      expect(screen.queryByText('remove-me.pdf')).not.toBeInTheDocument()
    })

    it('send is enabled when there are only attachments (no text)', async () => {
      const user = userEvent.setup()
      render(<ChatBar onSend={mockOnSend} />)

      const file = new File(['content'], 'just-file.pdf', { type: 'application/pdf' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, file)

      await screen.findByText('just-file.pdf')

      // Send button should be enabled (attachments present, no text needed)
      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).not.toBeDisabled()

      await user.click(sendButton)
      expect(mockOnSend).toHaveBeenCalledWith('', expect.any(Array))
    })
  })

  describe('mic functionality', () => {
    it('does not show mic button when speech is not supported', () => {
      render(<ChatBar onSend={mockOnSend} />)
      expect(screen.queryByTitle('Start voice input')).not.toBeInTheDocument()
    })

    it('shows mic button when speech is supported', () => {
      vi.mocked(useSpeechRecognition).mockReturnValue({
        isRecording: false,
        supported: true,
        startRecording: vi.fn(),
        stopRecording: vi.fn(),
      })

      render(<ChatBar onSend={mockOnSend} />)
      expect(screen.getByTitle('Start voice input')).toBeInTheDocument()
    })

    it('toggles recording on mic click', async () => {
      const mockStartRecording = vi.fn()
      const mockStopRecording = vi.fn()

      vi.mocked(useSpeechRecognition).mockReturnValue({
        isRecording: false,
        supported: true,
        startRecording: mockStartRecording,
        stopRecording: mockStopRecording,
      })

      const user = userEvent.setup()
      render(<ChatBar onSend={mockOnSend} />)

      const micButton = screen.getByTitle('Start voice input')
      await user.click(micButton)
      expect(mockStartRecording).toHaveBeenCalledOnce()
    })

    it('shows recording state when mic is active', () => {
      vi.mocked(useSpeechRecognition).mockReturnValue({
        isRecording: true,
        supported: true,
        startRecording: vi.fn(),
        stopRecording: vi.fn(),
      })

      render(<ChatBar onSend={mockOnSend} />)
      expect(screen.getByTitle('Stop recording')).toBeInTheDocument()
    })
  })
})
